import inkex
from PIL import Image
from dither import Dither
import urllib.request
import requests
from io import BytesIO
import glob

dither = Dither()


class svg2raster(inkex.EffectExtension):
    fp = None
    h = 0
    w = 0

    def add_arguments(self, pars):
        pars.add_argument("--filename", type=str, default="")
        pars.add_argument("--method", type=str, default="gcode")
        pars.add_argument("--algorithm", type=str, default="raw")
        pars.add_argument("--dpi", type=int, default=300)
        pars.add_argument("--minpower", type=float, default=0)
        pars.add_argument("--maxpower", type=float, default=255)
        pars.add_argument("--precision", type=int, default=0)
        pars.add_argument("--feedrate", type=int, default=0)
        pars.add_argument("--threshold", type=int, default=20)
        pars.add_argument("--gcode_header", type=str, default="")
        pars.add_argument("--gcode_footer", type=str, default="")
        pars.add_argument("--gcode_on", type=str, default="M3")
        pars.add_argument("--gcode_off", type=str, default="M5")
        pars.add_argument("--gcode_power", type=str, default="S{power}\n")
        pars.add_argument("--bjj_image_dir", type=str, default="")

    def image2dither(self, img):
        img = img.convert("RGBA")
        background = Image.new('RGBA', img.size, (255, 255, 255))
        img = Image.alpha_composite(background, img)
        img = img.convert("RGB")
        if self.options.algorithm in dither.error_diffusion_matrices.keys():
            print("dithering => {}".format(self.options.algorithm))
            img_np = dither.pil2numpy(img)
            img_np = dither.error_diffusion(img_np,
                                            '1bit_gray',
                                            self.options.algorithm)
            img = dither.numpy2pil(img_np)
            return img.convert("1")
        elif self.options.algorithm in dither.ordered_diffusion_matrices.keys():
            print("dithering => {}".format(self.options.algorithm))
            img_np = dither.pil2numpy(img)
            img_np = dither.ordered_dither(img_np,
                                           '1bit_gray',
                                           self.options.algorithm)
            img = dither.numpy2pil(img_np)
            return img.convert("1")

        return img.convert("L")

    def getPower(self, pixel):
        if (255-pixel) <= self.options.threshold:
            return 0
        percentage = (255.0 - float(pixel)) / 255.0
        rangesize = self.options.maxpower - self.options.minpower
        power = float(self.options.minpower) + (percentage * rangesize)
        return round(power, self.options.precision)

    def gcodeHeader(self):
        if self.options.gcode_header:
            self.fp.write(self.options.gcode_header)

        self.fp.write("\n")
        self.gcodeComment("options".center(30))
        self.gcodeComment("-"*30)
        self.gcodeComment("     method: " + str(self.options.method), length=30)
        self.gcodeComment("  algorithm: " + str(self.options.algorithm), length=30)
        self.gcodeComment("        dpi: " + str(self.options.dpi), length=30)
        self.gcodeComment("   feedrate: " + str(self.options.feedrate), length=30)
        self.gcodeComment("  threshold: " + str(self.options.threshold), length=30)
        self.gcodeComment("   minpower: " + str(self.options.minpower), length=30)
        self.gcodeComment("   maxpower: " + str(self.options.maxpower), length=30)
        self.fp.write("\n")
        
    def gcodeFooter(self):
        if self.options.gcode_footer:
            self.fp.write(self.options.gcode_footer)

    def gcodeComment(self, comment, length=None):
        if length:
            comment = comment.ljust(length)
        self.fp.write("({comment})\n".format(comment=comment))

    def gcodeOn(self):
        if self.options.gcode_on:
            self.fp.write(self.options.gcode_on)

    def gcodeOff(self):
        if self.options.gcode_off:
            self.fp.write(self.options.gcode_off)

    def gcodeFeed(self):
        if self.options.feedrate:
            self.fp.write("F{}\n".format(self.options.feedrate))

    def gcodeGo(self, x, y, g="G01"):
        self.fp.write(f"{g} X{x:.2f} Y{y:.2f}\n")

    def gcodePower(self, power):
        self.fp.write(self.options.gcode_power.format(power=power))
        self.fp.flush()

    def image2gcode(self, img, x, y, w, h):
        img = self.image2dither(img)
        dpmm = self.options.dpi / 25.4
        pixw = int(w * dpmm)
        pixelSizeW = w / pixw
        pixh = int(h * dpmm)
        pixelSizeH = h / pixh
        img = img.resize((pixw, pixh))

        pixels = img.load()
        lastPower = None
        direction = 1
        irange = list(range(0, pixh+1))
        irange.reverse()
        x1 = x
        y1 = y
        dirtybit = True
        for i in irange:
            y1 = round((y-h) + (i * pixelSizeH), 2)
            if dirtybit:
                self.gcodeGo(x1, y1, 'G00')
                self.gcodeOn()
            jrange = list(range(0, pixw+1))
            if direction < 0:
                jrange.reverse()
            dirtybit = False
            for j in jrange:
                lastX = x1
                x1 = round(x + (j * pixelSizeW), 2)
                power = self.getPower(pixels[j-1, (pixh - i-1)])
                #print(f"{j}: {x1}, {y1} => {power}")
                if lastPower != power:
                    if lastPower is not None:
                        dirtybit = True
                        if direction < 0:
                            self.gcodeGo(x1, y1)
                        else:
                            self.gcodeGo(lastX, y1)
                    self.gcodePower(power)
                    lastPower = power
            if dirtybit:
                self.gcodeGo(x1, y1)
                self.gcodeOff()
                lastPower = None
                direction *= -1

    def getBjjImageFilename(self):
        d = self.options.bjj_image_dir.rstrip("/")

        i = 1
        while True:
            ftest = "{}/*{}.*".format(d, i)
            if not glob.glob(ftest):
                break
            i += 1
        return i, "{}/raster-{}.jpg".format(d, i)

    def image2bjj(self, img, x, y, w, h):
        img = self.image2dither(img)
        i, fname = self.getBjjImageFilename()
        img.save(fname)
        gap = 25.4 * (1/self.options.dpi)
        self.gcodeOn()
        self.fp.write("S0.000001\n")
        gcode = "O145 call [{}] [{}] [{}] [{}] [{}] [{}] [{}] [{}]\n"
        self.fp.write(gcode.format(i, x, y, w, h, gap, gap, 8))
        self.gcodeOff()

    def uri2image(self, uri):
        response = urllib.request.urlopen(uri)
        return Image.open(BytesIO(response.read()))

    def parse_images(self, svg):
        for elem in svg:
            if str(elem) == "image":
                bbox = elem.bounding_box(True)
                x = round(elem.unit_to_viewport(bbox.left, "mm"), 2)
                y = round(elem.unit_to_viewport(bbox.bottom, "mm"), 2)
                w = round(elem.unit_to_viewport(elem.width, "mm"), 2)
                h = round(elem.unit_to_viewport(elem.height, "mm"), 2)
                y = h + (self.h - y)
                print("{}: {}, {}: {}mm x {}mm".format(elem.eid, x, y, w, h))
                img = self.uri2image(elem.get("xlink:href"))
                if img:
                    if self.options.method == "gcode":
                        self.image2gcode(img, x, y, w, h)
                    elif self.options.method == "bjj":
                        self.image2bjj(img, x, y, w, h)

            elif len(elem.getchildren()) > 0:
                self.parse_images(elem)

    def effect(self):
        inkex.paths.PathCommand.number_template = '{:.2f}'
        self.h = self.svg.uutounit(self.svg.viewbox_height, "mm")
        self.w = self.svg.uutounit(self.svg.viewbox_width, "mm")
        self.fp = open(self.options.filename, "w")
        self.gcodeHeader()
        self.gcodeFeed()
        self.parse_images(self.svg)
        self.gcodeFooter()
        self.fp.close()


if __name__ == '__main__':
    svg2raster().run()
