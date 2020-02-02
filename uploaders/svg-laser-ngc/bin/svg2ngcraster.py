#!/usr/bin/python

# svg2ngcraster.py
#
# Based heavily on axidraw.py
# https://github.com/evil-mad/AxiDraw
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

import inkex
from simpletransform import parseTransform, composeTransform
import plot_utils
import StringIO
import base64
import re
import glob
import os
from PIL import Image

rasterTemplate = """
(Raster: {imgid})
M63 P0 (Turn off synchronized motion)
M65 P0 (Turn off digital output immediately)
G00 Z0.000001 (Z-Magic output off)
G21
M68 E0 Q{img_power}
F{img_feedrate}
M3 (Enable the spindle)
S0.000001 (Set the spindle to the slowest rate that LinuxCNC sees as being on)
O145 call [{i}] [{x:.2f}] [{y:.2f}] [{w:.2f}] [{h:.2f}] [{xscan:.2f}] [{yscan:.2f}] [{overscan:.24}]
(G01 Z-0.000001 F10000)
M5
"""

try:
    xrange = xrange  # We have Python 2
except Exception:
    xrange = range  # We have Python 3
try:
    basestring
except NameError:
    basestring = str


def error(str):
    print str
    quit()


class AxiDrawClass(inkex.Effect):

    def __init__(self):
        inkex.Effect.__init__(self)
        self.OptionParser.add_option("", "--images",	action="store", type="string", dest="imageDir", default="", help="Directory for extracted raster images")
        self.OptionParser.add_option("", "--laser", action="store", type="string", dest="laser", default="", help="DPI:FEEDRATE:POWER")
        self.OptionParser.add_option("", "--directory",	action="store", type="string",  dest="directory", default="", help="Directory for gcode file")
        self.OptionParser.add_option("", "--filename",	action="store", type="string", dest="filename", default="", help="Gcode file name")

    def effect(self):
        self.svgWidth = 0
        self.svgHeight = 0
        self.svgTransform = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]]
        self.useTagNestLevel = 0
        self.svg = self.document.getroot()

        if (not self.getDocProps()):
            error("Document missing appropriate dimensions.")
            return

        self.DocUnits = self.getDocumentUnit()
        userUnitsWidth = plot_utils.unitsToUserUnits("1in")
        self.DocUnitScaleFactor = plot_utils.userUnitToUnits(userUnitsWidth, self.DocUnits)

        # Viewbox handling
        # Ignores translations and the preserveAspectRatio attribute
        viewbox = self.svg.get('viewBox')
        if viewbox:
            vinfo = viewbox.strip().replace(',', ' ').split(' ')
            Offset0 = -float(vinfo[0])
            Offset1 = -float(vinfo[1])
            if (vinfo[2] != 0) and (vinfo[3] != 0):
                # TODO: Handle a wider yet range of viewBox formats and values
                sx = self.svgWidth / float(vinfo[2])
                sy = self.svgHeight / float(vinfo[3])
                self.DocUnitScaleFactor = 1.0 / sx  # Scale preview to viewbox
        else:
            # Handle case of no viewbox provided.
            sx = 1.0 / float(plot_utils.pxPerInch)
            sy = sx
            Offset0 = 0.0
            Offset1 = 0.0

        t = 'scale(%f,%f) translate(%f,%f)' % (sx, sy, Offset0, Offset1)
        self.svgTransform = parseTransform(t)
        self.gcode = ""
        self.recursivelyTraverseSvg(self.svg, self.svgTransform)

        if len(self.gcode) > 0:
            self.f = open(self.getGcodeFilename(), "w")
            self.f.write("%\n\n{}\n\n%".format(self.gcode))
            self.f.close()

    def recursivelyTraverseSvg(self, aNodeList,
                               matCurrent=[[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]]):

        for node in aNodeList:
            # first apply the current matrix transform to this node's transform
            matNew = composeTransform(matCurrent, parseTransform(node.get("transform")))

            if node.tag == inkex.addNS('g', 'svg') or node.tag == 'g':
                self.recursivelyTraverseSvg(node, matNew)

            elif node.tag == inkex.addNS('symbol', 'svg') or node.tag == 'symbol':
                if (self.useTagNestLevel > 0):
                    self.recursivelyTraverseSvg(node, matNew)

            elif node.tag == inkex.addNS('a', 'svg') or node.tag == 'a':
                self.recursivelyTraverseSvg(node, matNew)

            elif node.tag == inkex.addNS('use', 'svg') or node.tag == 'use':
                refid = node.get(inkex.addNS('href', 'xlink'))
                if refid is not None:
                    # [1:] to ignore leading '#' in reference
                    path = '//*[@id="%s"]' % refid[1:]
                    refnode = node.xpath(path)
                    if refnode is not None:
                        x = float(node.get('x', '0'))
                        y = float(node.get('y', '0'))
                        # Note: the transform has already been applied
                        if (x != 0) or (y != 0):
                            t = parseTransform('translate(%f,%f)' % (x, y))
                            matNew2 = composeTransform(matNew, t)
                        else:
                            matNew2 = matNew
                        self.useTagNestLevel = self.useTagNestLevel + 1
                        self.recursivelyTraverseSvg(refnode, matNew2)
                        self.useTagNestLevel = self.useTagNestLevel - 1
                    else:
                        continue
                else:
                    continue

            elif node.tag == inkex.addNS('image', 'svg') or node.tag == 'image':
                self.gcode += self.imageToGcode(node, matNew)

            else:
                continue


    def getDocProps(self):
        '''
        Get the document's height and width attributes from the <svg> tag.
        Use a default value in case the property is not present or is
        expressed in units of percentages.
        '''
        self.svgHeight = plot_utils.getLengthInches(self, 'height')
        self.svgWidth = plot_utils.getLengthInches(self, 'width')
        if (self.svgHeight is None) or (self.svgWidth is None):
            return False
        else:
            return True

    def getImageFilename(self):
        d = self.options.imageDir.rstrip("/")

        i = 1
        while True:
            ftest = "{}/*{}.*".format(d, i)
            if not glob.glob(ftest):
                break
            i += 1
        return i, "{}/raster-{}.jpg".format(d, i)

    def checkRotate(self, t):
        if not t:
            return None
        r = re.match("rotate\((-{0,1}\d*.{0,1}\d*)\)",t)
        if r:
            return float(r.groups()[0])

    def imageToGcode(self, node, mat):
        img_dpi, img_feedrate, img_power = self.options.laser.split(":")
        img_scan = 25.4 * (1.0 / int(img_dpi))
        img_overscan = "8.00"

        img_rotate = self.checkRotate(node.get("transform", None))
        if img_rotate:
            print "Unsupported rotate"

        img_x = (float(node.get('x', '0')) / self.DocUnitScaleFactor + mat[0][2]) * 25.4
        img_y = (self.svgHeight - ((float(node.get('y', '0')) / self.DocUnitScaleFactor) + mat[1][2])) * 25.4
        img_w = (float(node.get('width')) / self.DocUnitScaleFactor) * 25.4
        img_h = (float(node.get('height')) / self.DocUnitScaleFactor) * 25.4

        img_id = node.get("id")
        ireg = re.compile("^data:image/.{3,4};base64,")
        for key in node.keys():
            d = node.get(key)
            if ireg.match(d):
                img_encoded, img_b64 = d.split(",")
                break
        if img_b64:
            imgio = StringIO.StringIO(base64.b64decode(img_b64))
            img = Image.open(imgio)
            img = img.convert("RGBA")
            newimg = Image.new('RGBA', img.size, (255, 255, 255, 255))
            newimg.paste(img, mask=img)
            img_dpi_w = int((int(img_dpi) / 25.4) * img_w)
            img_dpi_h = int((int(img_dpi) / 25.4) * img_h)
            newimg = newimg.resize((img_dpi_w, img_dpi_h), Image.ANTIALIAS)
            i, newfilename = self.getImageFilename()
            newimg = newimg.convert("RGB")
            newimg.save(newfilename, "JPEG")
            return rasterTemplate.format(imgid=img_id, img_power=img_power,
                                         img_feedrate=img_feedrate, i=i,
                                         x=img_x, y=img_y, w=img_w, h=img_h,
                                         xscan=img_scan, yscan=img_scan,
                                         overscan=img_overscan)

    def getGcodeFilename(self):
        directory = self.options.directory.rstrip("/")
        if not os.path.isdir(directory):
            error("Invalid gcode directory given.")
            return False

        filename = os.path.basename(self.options.filename)
        filename = os.path.splitext(filename)[0]
        filename = filename + ".raster.{}.ngc"

        i = 1
        while True:
            newfilename = directory + "/" + filename.format(str(i).zfill(4))
            if not os.path.exists(newfilename):
                return newfilename
            i += 1


if __name__ == '__main__':
    e = AxiDrawClass()
    e.affect()
