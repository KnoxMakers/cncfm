#!/usr/bin/python3


from PIL import ImageEnhance, ImageFilter, ImageOps
from PIL import Image, ImageDraw, ImageStat, ExifTags


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

    def __init__(self, img=None, uri=None, width=None, height=None):
        if img:
            self.original = img
            self.img = img
        elif uri:
            self.fromURI(uri)

        if width and height:
            self.width = int(width)
            self.height = int(height)
        elif self.img:
            w, h = self.img.size
            self.width = int(w)
            self.height = int(h)

    def reset(self):
        self.img = self.original

    def fromURI(self, uri):
        import urllib.request
        import io
        with urllib.request.urlopen(uri) as data:
            datafile = io.BytesIO(data.read())
        self.original = Image.open(datafile)
        self.img = self.original
        return self.img

    def toURI(self):
        import base64
        import io
        buffered = io.BytesIO()
        self.img.save(buffered, format="PNG")
        uri = "data:image/png;base64,"
        uri += base64.b64encode(buffered.getvalue()).decode("utf-8")
        return uri

    def fixOrientation(self):

        for orientation in ExifTags.TAGS.keys():
            if ExifTags.TAGS[orientation] == 'Orientation':
                break

        try:
            exif = self.img._getexif()
        except Exception:
            return

        if not exif or orientation not in exif:
            return

        if exif[orientation] == 3:
            self.img = self.img.rotate(180, expand=True)
        elif exif[orientation] == 6:
            self.img = self.img.rotate(270, expand=True)
        elif exif[orientation] == 8:
            self.img = self.img.rotate(90, expand=True)

    def resample(self, dpi):
        new_width = int((self.width / 96.0) * dpi)
        new_height = int((self.height / 96.0) * dpi)
        self.img = self.img.resize((new_width, new_height))
        return self.img

    def removeBG(self):
        from rembg import remove
        self.img = remove(self.img)
        return self.img

    def invert(self):
        mode = self.img.mode
        self.img = self.img.convert("L")
        self.img = ImageOps.invert(self.img)
        self.img = self.img.convert(mode)
        return self.img

    def threshold(self, threshold):
        print("threshold: {}".format(threshold), file=sys.stderr)
        self.img = self.img.convert("L")
        self.img = self.img.point(lambda p: p if (255-p) > threshold else 255)
        return self.img

    def grayscale(self, bg=None):
        if bg:
            img = self.img.convert('RGBA')
            background = Image.new('RGBA', img.size, bg)
            self.img = Image.alpha_composite(background, img)
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

        self.img = self.img.convert("L")

        if amount == 0:
            lut = [0] * 256
        else:
            lut = [
                crimp(pow(i / 255, (1.0 / amount)) * 255)
                for i in range(256)
            ]
        self.img = self.img.point(lut)
        return self.img

    def unsharp_mask(self, percent, radius, threshold):
        unsharp = ImageFilter.UnsharpMask(radius, percent, threshold)
        self.img = self.img.filter(unsharp)
        return self.img

    def tone(self, type, values):
        def tone_line(p):
            N = len(p) - 1
            try:
                m = [(p[i + 1][1] - p[i][1]) / (p[i + 1][0] - p[i][0])
                     for i in range(0, N)]
            except ZeroDivisionError:
                m = [1] * N
            # b = y - mx
            b = [p[i][1] - (m[i] * p[i][0]) for i in range(0, N)]
            r = list()
            for i in range(0, p[0][0]):
                r.append(0)
            for i in range(len(p) - 1):
                x0 = p[i][0]
                x1 = p[i + 1][0]
                range_list = [int(round((m[i] * x) + b[i]))
                              for x in range(x0, x1)]
                r.extend(range_list)
            for i in range(p[-1][0], 256):
                r.append(255)
            r.append(round(int(p[-1][1])))
            return r

        def tone_spline(p):
            """
            Spline interpreter.

            Returns all integer locations between different spline interpolation values
            @param p: points to be quad spline interpolated.
            @return: integer y values for given spline points.
            """
            try:
                N = len(p) - 1
                w = [(p[i + 1][0] - p[i][0]) for i in range(0, N)]
                h = [(p[i + 1][1] - p[i][1]) / w[i] for i in range(0, N)]
                ftt = (
                    [0]
                    + [3 * (h[i + 1] - h[i]) / (w[i + 1] + w[i])
                       for i in range(0, N - 1)]
                    + [0]
                )
                A = [(ftt[i + 1] - ftt[i]) / (6 * w[i]) for i in range(0, N)]
                B = [ftt[i] / 2 for i in range(0, N)]
                C = [h[i] - w[i] * (ftt[i + 1] + 2 * ftt[i]
                                    ) / 6 for i in range(0, N)]
                D = [p[i][1] for i in range(0, N)]
            except ZeroDivisionError:
                return list(range(256))
            r = list()
            for i in range(0, p[0][0]):
                r.append(0)
            for i in range(len(p) - 1):
                a = p[i][0]
                b = p[i + 1][0]
                r.extend(
                    int(
                        round(
                            A[i] * (x - a) ** 3
                            + B[i] * (x - a) ** 2
                            + C[i] * (x - a)
                            + D[i]
                        )
                    )
                    for x in range(a, b)
                )
            for i in range(p[-1][0], 256):
                r.append(255)
            r.append(round(int(p[-1][1])))
            return r

        self.img = self.img.convert("P")
        if type == "spline":
            spline = tone_spline(values)
        else:
            values = [q for q in values if q is not None]
            spline = tone_line(values)
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
        self.img = half_tone
        return self.img

    def dither(self, method="Floyd-Steinberg"):
        """
        This function and the associated _DIFFUSION_MAPS taken from hitherdither. MIT License.
        :copyright: 2016-2017 by hbldh <henrik.blidh@nedomkull.com>
        https://github.com/hbldh/hitherdither
        """

        diff_map = self._DIFFUSION_MAPS.get(method.lower())
        if diff_map is None:
            return
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
        diff = diff.convert("L")
        self.img = diff
        return self.img

    def preset(self, method):

        method = method.lower()

        if method == "gold":
            # self.resample(333)
            # self.grayscale()
            self.contrast(1.25)
            self.brightness(1.25)
            self.unsharp_mask(500, 4, 0)
            self.dither()

        elif method == "stipo":
            # self.resample(500)
            # self.grayscale()
            self.tone("spline", [
                [0, 0], [100, 150], [255, 255]
            ])
            self.gamma(3.5)
            self.unsharp_mask(500, 20, 6)
            self.dither()

        elif method == "gravy":
            # self.resample(333)
            # self.grayscale()
            self.auto_contrast(3)
            self.unsharp_mask(500, 4, 0)
            self.tone("line", [
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
            self.dither()

        elif method == "xin":
            # self.resample(500)
            # self.grayscale()
            self.tone("spline", [
                [0, 0], [100, 125], [255, 255]
            ])
            self.unsharp_mask(100, 8, 0)
            self.dither()

        elif method == "newsy":
            # self.resample(500)
            # self.grayscale()
            self.contrast(1.25)
            self.brightness(1.25)
            self.halftone(black=True)
            self.dither()

        return self.img


if __name__ == "__main__":
    import sys
    import json

    if len(sys.argv) != 2:
        exit()

    output = {
        "status": 1,
        "message": ""
    }

    fp = open(sys.argv[1])
    data = json.load(fp)
    fp.close()

    output["svgid"] = data.get("svgid")
    width = data.get("width", None)
    height = data.get("height", None)

    bg = None
    if (int(data.get("invert", 0)) == 1):
        bg = (0, 0, 0)
    else:
        bg = (255, 255, 255)

    img = RasterPrepare(uri=data.get("img"), width=width, height=height)

    if (int(data.get("removebg", 0)) == 1):
        img.removeBG()

    if (int(data.get("resample", 0)) == 1):
        img.resample(int(data.get("dpi")))

    img.fixOrientation()
    img.grayscale(bg)

    preset = data.get("preset", None)
    if preset:
        if preset == "manual":
            settings = data.get("settings", {})
            if "brightness" in settings:
                val = float(settings["brightness"])
                img.brightness(val)

            if "contrast" in settings:
                val = float(settings["contrast"])
                img.contrast(val)

            if "gamma" in settings:
                val = float(settings["gamma"])
                img.gamma(val)

            if "unsharp_radius" in settings and "unsharp_percent" in settings:
                r = int(settings.get("unsharp_radius"))
                p = int(settings.get("unsharp_percent"))
                img.unsharp_mask(p, r, 0)

            if "threshold" in settings:
                val = int(settings["threshold"])
                img.threshold(val)

            if "dither" in settings:
                img.dither(settings.get("dither"))

        else:
            img.preset(preset)

    if (int(data.get("invert", 0)) == 1):
        img.invert()

    output["img"] = img.toURI()

    print(json.dumps(output))
