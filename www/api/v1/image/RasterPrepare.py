#!/usr/bin/python3

"""
resample
grayscale
contrast (contrast: 25, brightness: 25)

gamma (factor: 3.5)

unsharp_mask (percent: 100, radius: 8, threshold: 0)
             (percent: 150, radius: 1, threshold: 0)
             (percent: 500, radius 20, threshold: 6)
             (percent: 500, radius: 4, threshold: 0)
             
tone (type: spline, values [[0,0],[100,125],[255,255]])
     (type: line, values [(2,32),(9,50),(30,84),(40,99),(76,144),(101,170),(126,193),(156,214),(181,230),(206,246),(256,254)])
     
dither (type: 'Floyd-Steinberg')

auto_contrast (cutoff: 3)

halftone (black: True, sample: 10, angle: 22, oversample: 2)
"""

from PIL import ImageEnhance, ImageFilter, ImageOps
from PIL import Image, ImageDraw, ImageStat


class RasterPrepare:

    original = None
    img = None
    width = None
    height = None

    _DIFFUSION_MAPS = {
        "floyd-steinberg": (
            (1, 0, 7 / 16),
            (-1, 1, 3 / 16),
            (0, 1, 5 / 16),
            (1, 1, 1 / 16),
        ),
        "atkinson": (
            (1, 0, 1 / 8),
            (2, 0, 1 / 8),
            (-1, 1, 1 / 8),
            (0, 1, 1 / 8),
            (1, 1, 1 / 8),
            (0, 2, 1 / 8),
        ),
        "jarvis-judice-ninke": (
            (1, 0, 7 / 48),
            (2, 0, 5 / 48),
            (-2, 1, 3 / 48),
            (-1, 1, 5 / 48),
            (0, 1, 7 / 48),
            (1, 1, 5 / 48),
            (2, 1, 3 / 48),
            (-2, 2, 1 / 48),
            (-1, 2, 3 / 48),
            (0, 2, 5 / 48),
            (1, 2, 3 / 48),
            (2, 2, 1 / 48),
        ),
        "stucki": (
            (1, 0, 8 / 42),
            (2, 0, 4 / 42),
            (-2, 1, 2 / 42),
            (-1, 1, 4 / 42),
            (0, 1, 8 / 42),
            (1, 1, 4 / 42),
            (2, 1, 2 / 42),
            (-2, 2, 1 / 42),
            (-1, 2, 2 / 42),
            (0, 2, 4 / 42),
            (1, 2, 2 / 42),
            (2, 2, 1 / 42),
        ),
        "burkes": (
            (1, 0, 8 / 32),
            (2, 0, 4 / 32),
            (-2, 1, 2 / 32),
            (-1, 1, 4 / 32),
            (0, 1, 8 / 32),
            (1, 1, 4 / 32),
            (2, 1, 2 / 32),
        ),
        "sierra3": (
            (1, 0, 5 / 32),
            (2, 0, 3 / 32),
            (-2, 1, 2 / 32),
            (-1, 1, 4 / 32),
            (0, 1, 5 / 32),
            (1, 1, 4 / 32),
            (2, 1, 2 / 32),
            (-1, 2, 2 / 32),
            (0, 2, 3 / 32),
            (1, 2, 2 / 32),
        ),
        "sierra2": (
            (1, 0, 4 / 16),
            (2, 0, 3 / 16),
            (-2, 1, 1 / 16),
            (-1, 1, 2 / 16),
            (0, 1, 3 / 16),
            (1, 1, 2 / 16),
            (2, 1, 1 / 16),
        ),
        "sierra-2-4a": (
            (1, 0, 2 / 4),
            (-1, 1, 1 / 4),
            (0, 1, 1 / 4),
        ),
    }

    def fromURI(self, uri):
        import urllib.request
        import io
        with urllib.request.urlopen(uri) as data:
            datafile = io.BytesIO(data.read())
        self.img = Image.open(datafile)
        return self.img

    def resample(self, dpi):
        new_width = self.width * dpi * 25.4
        new_height = self.height * dpi * 25.4
        self.img = self.orig.resize((new_width, new_height))
        return self.img

    def grayscale(self):
        self.img = ImageOps.grayscale(self.img)
        return self.img

    def contrast(self, amount):
        enhancer = ImageEnhance.Contrast(self.img)
        self.img = enhancer.enhance(amount)
        return self.img

    def auto_contrast(self, cutoff):
        self.img = self.img.convert("L")
        self.img = ImageOps.autocontrast(self.img, cutoff=cutoff)
        return self.img

    def brightness(self, amount):
        enhancer = ImageEnhance.Brightness(self.img)
        self.img = enhancer.enhance(amount)
        return self.img

    def gamma(self, amount):
        def crimp(px):
            px = int(round(px))
            if px < 0:
                return 0
            if px > 255:
                return 255
            return px

        self.img.convert("L")

        if amount == 0:
            lut = [0] * 256
        else:
            lut = [
                crimp(pow(i / 255, (1.0 / amount)) * 255)
                for i in range(256)
            ]
        self.img = image.point(lut)
        return self.img

    def unsharp_mask(self, percent, radius, threshold):
        unsharp = ImageFilter.UnsharpMask(radius, percent, threshold)
        self.img = self.img.filter(unsharp)
        return self.img

    def tone(self, type, values):
        self.img = self.img.convert("P")
        if type == "spline":
            spline = ImageNode.spline(values)
        else:
            values = [q for q in values if q is not None]
            spline = ImageNode.line(values)
        if len(spline) < 256:
            spline.extend([255] * (256 - len(spline)))
        if len(spline) > 256:
            spline = spline[:256]
        self.img = self.img.point(spline)
        if self.img.mode != "L":
            self.img = self.img.convert("L")
        return self.img

    def halftone(self, sample=10, scale=3.0, angle=22.0, oversample=2, black=False):

        original_image = self.img
        self.img = self.img.convert("L")
        self.img = self.img.rotate(angle, expand=1)
        size = int(self.img.size[0] * scale), int(self.img.size[1] * scale)
        if black:
            half_tone = Image.new("L", size, color=255)
        else:
            half_tone = Image.new("L", size)
        draw = ImageDraw.Draw(half_tone)
        if sample == 0:
            sample = 1
        for x in range(0, self.img.size[0], sample):
            for y in range(0, self.img.size[1], sample):
                box = self.img.crop(
                    (
                        x - oversample,
                        y - oversample,
                        x + sample + oversample,
                        y + sample + oversample,
                    )
                )
                stat = ImageStat.Stat(box)
                if black:
                    diameter = ((255 - stat.mean[0]) / 255) ** 0.5
                else:
                    diameter = (stat.mean[0] / 255) ** 0.5
                edge = 0.5 * (1 - diameter)
                x_pos, y_pos = (x + edge) * scale, (y + edge) * scale
                box_edge = sample * diameter * scale
                if black:
                    draw.ellipse(
                        (x_pos, y_pos, x_pos + box_edge, y_pos + box_edge), fill=0
                    )
                else:
                    draw.ellipse(
                        (x_pos, y_pos, x_pos + box_edge, y_pos + box_edge), fill=255
                    )
        half_tone = half_tone.rotate(-angle, expand=1)
        width_half, height_half = half_tone.size
        xx = (width_half - original_image.size[0] * scale) / 2
        yy = (height_half - original_image.size[1] * scale) / 2
        half_tone = half_tone.crop(
            (
                xx,
                yy,
                xx + original_image.size[0] * scale,
                yy + original_image.size[1] * scale,
            )
        )
        half_tone = half_tone.resize(original_image.size)
        return half_tone

    def dither(self, method="Floyd-Steinberg"):
        """
        This function and the associated _DIFFUSION_MAPS taken from hitherdither. MIT License.
        :copyright: 2016-2017 by hbldh <henrik.blidh@nedomkull.com>
        https://github.com/hbldh/hitherdither
        """

        diff_map = _DIFFUSION_MAPS.get(method.lower())
        if diff_map is None:
            raise NotImplementedError
        diff = self.img.convert("F")
        pix = diff.load()
        width, height = self.img.size
        for y in range(height):
            for x in range(width):
                pixel = pix[x, y]
                pix[x, y] = 0 if pixel <= 127 else 255
                error = pixel - pix[x, y]
                for dx, dy, diffusion_coefficient in diff_map:
                    xn, yn = x + dx, y + dy
                    if (0 <= xn < width) and (0 <= yn < height):
                        pix[xn, yn] += error * diffusion_coefficient
        return diff

    def pepare(self, method):

        match method:

            case "Gold":
                self.img = self.resample(333)
                self.img = self.grayscale()
                self.img = self.contrast(25)
                self.img = self.brightness(25)
                self.img = self.unsharp_mask(500, 4, 0)
                self.img = self.dither()

            case "Stipo":
                self.img = self.resample(500)
                self.img = self.grayscale()
                self.img = self.tone("spline", [
                    [0, 0], [100, 150], [255, 255]
                ])
                self.img = self.gamma(3.5)
                self.img = self.unsharp_mask(500, 20, 6)
                self.img = self.dither()

            case "Gravy":
                self.img = self.resample(333)
                self.img = self.grayscale()
                self.img = self.auto_contrast(3)
                self.img = self.unsharp_mask(500, 4, 0)
                self.img = self.tone("line", [
                    (2, 32),
                    (9, 50),
                    (30, 84),
                    (40, 99),
                    (76, 144),
                    (101, 170),
                    (126, 193),
                    (156, 214),
                    (181, 230),
                    (206, 246),
                    (256, 254),
                ])
                self.img = self.dither()

            case "Xin":
                self.img = self.resample(500)
                self.img = self.grayscale()
                self.img = self.tone("spline", [
                    [0, 0], [100, 125], [255, 255]
                ])
                self.img = self.unsharp_mask(100, 8, 0)
                self.img = self.dither()

            case "Newsy":
                self.img = self.resample(500)
                self.img = self.grayscale()
                self.img = self.contrast(25)
                self.img = self.halftone(black=True)
                self.img = self.dither()

        return self.img
