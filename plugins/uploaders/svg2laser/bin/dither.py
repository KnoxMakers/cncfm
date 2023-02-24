from PIL import Image
from collections import OrderedDict
import numpy
import random
import sys

import math


class Dither:
    def __init__(self):
        self.palettes = OrderedDict()
        self.available_palettes = []
        self.build_palettes()

        self.ordered_diffusion_matrices = {}
        self.error_diffusion_matrices = {}
        self.build_matricies()

    def open_image(self, image_filename):
        self.open_image_data = Image.open(image_filename).convert('RGB')

        return self.open_image_data

    def pil2numpy(self, image=None):
        if (image == None):
            image = self.open_image_data
        self.pil2numpy_matrix = numpy.asarray(image, dtype=float)
        self.pil2numpy_matrix = self.pil2numpy_matrix/255.

        return self.pil2numpy_matrix

    def numpy2pil(self, matrix):
        self.numpy2pil_image = Image.fromarray(numpy.uint8(matrix*255))

        return self.numpy2pil_image

    def closest_palette_color(self, value, palette_name, bit_depth=1):
        # compute distance to colors in palette
        # TODO make this naive method more sophisticated
        min_dist = 10000.
        ci_use = -1
        for ci, color in enumerate(self.available_palettes[palette_name]):
            pr, pg, pb = color
            vr, vg, vb = value
            dist = math.sqrt((vr-pr)*(vr-pr)+(vg-pg)*(vg-pg)+(vb-pb)*(vb-pb))

            if dist < min_dist:
                ci_use = ci
                min_dist = dist

        if ci == -1:
            return [0.0, 0.0, 0.0]
        else:
            return self.available_palettes[palette_name][ci_use]

    def ordered_dither(self, image_matrix, palette_name, map_to_use):
        map_size = self.ordered_diffusion_matrices[map_to_use].shape[0]
        new_matrix = numpy.copy(image_matrix)
        cols, rows, depth = image_matrix.shape
        for y in range(rows):
            for x in range(cols):
                old_pixel = numpy.array(new_matrix[x][y], dtype=float)
                old_pixel += old_pixel * \
                    self.ordered_diffusion_matrices[map_to_use][x %
                                                                map_size][y % map_size]
                new_pixel = numpy.array(self.closest_palette_color(old_pixel,
                                                                   palette_name), dtype=float)
                new_matrix[x][y] = new_pixel

        return new_matrix

    def error_diffusion(self, image_matrix, palette_name, diffusion_matrix):
        new_matrix = numpy.copy(image_matrix)
        cols, rows, depth = image_matrix.shape
        for y in range(rows):
            for x in range(cols):
                # calculate the new pixel value
                old_pixel = numpy.array(new_matrix[x][y], dtype=float)
                new_pixel = numpy.array(self.closest_palette_color(old_pixel,
                                                                   palette_name), dtype=float)
                # replace the old pixel with the new value, and quantify the error
                new_matrix[x][y] = new_pixel
                quant_error = old_pixel - new_pixel

                forward_diffusion = self.error_diffusion_matrices[diffusion_matrix][0]
                for ci, coeff in enumerate(forward_diffusion):
                    if x + ci + 1 < cols:
                        new_matrix[x + (ci + 1)][y] += quant_error * coeff
                for di, downward_diffusion in enumerate(self.error_diffusion_matrices[diffusion_matrix][1:]):
                    if y + di + 1 < rows:
                        offset = int(math.ceil(len(downward_diffusion) / 2))
                        for ci, coeff in enumerate(downward_diffusion):
                            if 0 <= x + ci - offset < cols:
                                new_matrix[x + ci -
                                           int(offset)][y + di + 1] += quant_error * coeff

        return new_matrix

    def build_matricies(self):
        self.ordered_diffusion_matrices = {
            'bayer4x4': 1./17. * numpy.array([
                [1,  9,  3, 11],
                [13,  5, 15,  7],
                [4, 12,  2, 10],
                [16,  8, 14,  6]
            ], dtype=object),
            'bayer8x8': 1./65. * numpy.array([
                [0, 48, 12, 60,  3, 51, 15, 63],
                [32, 16, 44, 28, 35, 19, 47, 31],
                [8, 56,  4, 52, 11, 59,  7, 55],
                [40, 24, 36, 20, 43, 27, 39, 23],
                [2, 50, 14, 62,  1, 49, 13, 61],
                [34, 18, 46, 30, 33, 17, 45, 29],
                [10, 58,  6, 54,  9, 57,  5, 53],
                [42, 26, 38, 22, 41, 25, 37, 21]
            ], dtype=object),
            'cluster4x4': 1./15. * numpy.array([
                [12,  5,  6, 13],
                [4,  0,  1,  7],
                [11,  3,  2,  8],
                [15, 10,  9, 14]
            ], dtype=object),
            'cluster8x8': 1./64. * numpy.array([
                [24, 10, 12, 26, 35, 47, 49, 37],
                [8,  0,  2, 14, 45, 59, 61, 51],
                [22,  6,  4, 16, 43, 57, 63, 53],
                [30, 20, 18, 28, 33, 41, 55, 39],
                [34, 46, 48, 36, 25, 11, 13, 27],
                [44, 58, 60, 50,  9,  1,  3, 15],
                [42, 56, 62, 52, 23,  7,  5, 17],
                [32, 40, 54, 38, 31, 21, 19, 29]
            ], dtype=object),
        }
        self.error_diffusion_matrices = {
            'floyd_steinberg': numpy.array([
                [7./16],
                [3./16, 5./16, 1./16]
            ], dtype=object),
            'jajuni': numpy.array([
                [7./48, 5./48],
                [1./16, 5./48, 7./48, 5./48, 1./16],
                [1./48, 1./16, 5./48, 1./16, 1./48]
            ], dtype=object),
            'fan': numpy.array([
                [7./16],
                [1./16, 3./16, 5./16, 0., 0.]
            ], dtype=object),
            'stucki': numpy.array([
                [4./21, 2./21],
                [1./21, 2./21, 4./21, 2./21, 1./21],
                [1./42, 1./21, 2./21, 1./21, 1./42]
            ], dtype=object),
            'burkes': numpy.array([
                [.25, .125],
                [.0625, .125, .25, .125, .0625]
            ], dtype=object),
            'sierra': numpy.array([
                [5./32, 3./32],
                [1./16, 1./8, 5./32, 1./8, 1./16],
                [1./16, 3./32, 1./16]
            ], dtype=object),
            'two_row_sierra': numpy.array([
                [1./4, 3./16],
                [1./16, 1./8, 3./16, 1./8, 1./16]
            ], dtype=object),
            'sierra_lite': numpy.array([
                [0.5],
                [0.25, 0.25, 0]
            ], dtype=object),
            'atkinson': numpy.array([
                [0.125, 0.125],
                [0.125, 0.125, 0.125],
                [0.125]
            ], dtype=object),
        }

    def build_c64_palettes(self):

        # gamma corrected colors from
        # http://unusedino.de/ec64/technical/misc/vic656x/colors/
        palette = [
            [0.0,           0.0,           0.0],
            [254.999999878, 254.999999878, 254.999999878],
            [103.681836072,  55.445357742,  43.038096345],
            [111.932673473, 163.520631667, 177.928819803],
            [111.399725075,  60.720543693, 133.643433983],
            [88.102223525, 140.581101312,  67.050415368],
            [52.769271594,  40.296416104, 121.446211753],
            [183.892638117, 198.676829993, 110.585717385],
            [111.399725075,  79.245328562,  37.169652483],
            [66.932804788,  57.383702891,   0.0],
            [153.690586380, 102.553762644,  89.111118307],
            [67.999561813,  67.999561813,  67.999561813],
            [107.797780127, 107.797780127, 107.797780127],
            [154.244479632, 209.771445903, 131.584994128],
            [107.797780127,  94.106015515, 180.927622164],
            [149.480882981, 149.480882981, 149.480882981],
        ]
        self.palettes['c64'] = [[c/255. for c in color] for color in palette]

    def build_websafe_palettes(self):
        palette = []
        for r in range(6):
            for g in range(6):
                for b in range(6):
                    palette.append([r/5.0, g/5.0, b/5.0])
        self.palettes['websafe'] = palette

    def build_grayscale_palettes(self):
        for bit_depth in range(1, 8):
            levels = 2**bit_depth - 1
            # print '\tbit depth = {}, levels = {}'.format(bit_depth, levels)
            pname = '{}bit_gray'.format(bit_depth)
            palette = [[0.0, 0.0, 0.0]]
            for l in range(levels):
                val = float(l+1)/(levels)
                # print '\tl = {}, val = {}'.format(l, val)
                palette.append([val, val, val])
            self.palettes[pname] = palette

    def build_cga_palettes(self):
        # generate all the low/dark colors
        low = []
        off_on = (0.0, 2./3.)
        for r in off_on:
            for g in off_on:
                for b in off_on:
                    low.append([r, g, b])
        # set brown
        low[6][1] /= 2.

        # generate all the high colors
        high = []
        off_on = (1./3., 1.0)
        for r in off_on:
            for g in off_on:
                for b in off_on:
                    high.append([r, g, b])

        # add the colors to their respective palettes

        self.palettes['cga_mode4_1'] = [low[0],  # black
                                        low[3],  # low cyan
                                        low[5],  # low magenta
                                        low[7]]  # low white
        self.palettes['cga_mode4_2'] = [low[0],  # black
                                        low[2],  # low green
                                        low[4],  # low red
                                        low[6]]  # low yellow (brown)
        self.palettes['cga_mode4_1_high'] = [low[0],   # black
                                             high[3],  # high cyan
                                             high[5],  # high magenta
                                             high[7]]  # high white
        self.palettes['cga_mode4_2_high'] = [low[0],   # black
                                             high[2],  # high green
                                             high[4],  # high red
                                             high[6]]  # high yellow
        self.palettes['cga_mode5'] = [low[0],  # black
                                      low[3],  # low cyan
                                      low[4],  # low red
                                      low[7]]  # low white
        self.palettes['cga_mode5_high'] = [low[0],   # black
                                           high[3],  # high cyan
                                           high[4],  # high red
                                           high[7]]  # high white

    def build_ega_palettes(self):
        # generate all the low/dark colors
        low = []
        off_on = (0.0, 2./3.)
        for r in off_on:
            for g in off_on:
                for b in off_on:
                    low.append([r, g, b])
        # set brown
        low[6][1] /= 2.

        # generate all the high colors
        high = []
        off_on = (1./3., 1.0)
        for r in off_on:
            for g in off_on:
                for b in off_on:
                    high.append([r, g, b])

        self.palettes['ega_default'] = low + high  # how convenient

    def build_palettes(self):
        self.build_grayscale_palettes()
        self.build_cga_palettes()
        self.build_ega_palettes()
        self.build_websafe_palettes()
        self.build_c64_palettes()

        self.available_palettes = self.palettes


if __name__ == "__main__":
    import sys
    filename = sys.argv[1]

    dither = Dither()
    # print(dither.available_palettes.keys())
    # print(dither.ordered_diffusion_matrices.keys())
    # print(dither.error_diffusion_matrices.keys())

    img_pil = Image.open(filename)
    img_np = dither.pil2numpy(img_pil)

    for dither_type in dither.ordered_diffusion_matrices.keys():
        print(f"ordered: {dither_type}")
        img_out_np = dither.ordered_dither(img_np, '1bit_gray', dither_type)
        img_out_pil = dither.numpy2pil(img_out_np)
        img_out_pil.save(f"{filename}.ordered.{dither_type}.png")

    for dither_type in dither.error_diffusion_matrices.keys():
        print(f"error: {dither_type}")
        img_out_np = dither.error_diffusion(img_np, '1bit_gray', dither_type)
        img_out_pil = dither.numpy2pil(img_out_np)
        img_out_pil.save(f"{filename}.error.{dither_type}.png")
