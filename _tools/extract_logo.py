# -*- coding: utf-8 -*-
"""Extract site logo from catalog design: find wordmark bounds, save PNG with transparency."""
import sys, io
from PIL import Image
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

img = Image.open(r"D:\Development\VideCoding\Vahta\Дизайн\image2.png").convert('RGBA')

# scan LEFT header band only (logo zone, before the search input ~x 300)
band = img.crop((0, 0, 300, 120))
px = band.load()
minx, maxx, miny, maxy = 9999, -1, 9999, -1
for y in range(120):
    for x in range(0, 300, 1):
        r, g, b, a = px[x, y]
        if r < 235 or g < 235 or b < 235:  # non-white
            if x < minx: minx = x
            if x > maxx: maxx = x
            if y < miny: miny = y
            if y > maxy: maxy = y
print("logo content bounds:", (minx, miny, maxx, maxy))

# tight crop with padding
crop = img.crop((minx - 2, miny - 2, maxx + 6, maxy + 6))

# make near-white transparent
data = crop.load()
w, h = crop.size
for y in range(h):
    for x in range(w):
        r, g, b, a = data[x, y]
        if r > 248 and g > 248 and b > 248:
            data[x, y] = (255, 255, 255, 0)
        elif r > 240 and g > 240 and b > 240:
            data[x, y] = (r, g, b, max(0, a - 100))

crop.save(r"D:\Development\VideCoding\Vahta\img\logo.png")
print("saved", crop.size)
