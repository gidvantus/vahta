# -*- coding: utf-8 -*-
"""Locate non-white pixels in reference1 bottom half; check middle element color."""
import sys, io
from collections import Counter
from PIL import Image
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

img = Image.open(r"D:\Development\VideCoding\Vahta\Дизайн\reference 1.PNG").convert('RGB')
w, h = img.size

# scan all pixels, collect colored ones (sat > 25) into bands by y
bands = {}
for y in range(h):
    for x in range(0, w, 3):
        r, g, b = img.getpixel((x, y))
        mx, mn = max(r, g, b), min(r, g, b)
        sat = 0 if mx == 0 else (mx - mn) * 255 // mx
        if sat > 25 and mx > 60:
            by = y // 40
            bands.setdefault(by, []).append(((r, g, b), x))
print("colored bands (y/40): count | x-range | top color")
for by in sorted(bands):
    px = bands[by]
    xs = [p[1] for p in px]
    c = Counter(p[0] for p in px)
    top = c.most_common(3)
    print(f"  y {by*40}-{by*40+39}: n={len(px)} x={min(xs)}..{max(xs)} "
          + " ".join(f"#{r:02X}{g:02X}{b:02X}({n})" for (r, g, b), n in top))

# middle element crop
crop = img.crop((330, 640, 530, 730))
small = crop.resize((60, 45))
q = small.quantize(colors=4, method=Image.MEDIANCUT)
pal = q.getpalette()
cnt = Counter(q.getdata())
tot = sum(cnt.values())
print("\nmiddle element (330,640)-(530,730):")
for i, c in cnt.most_common(4):
    print(f"  #{pal[i*3]:02X}{pal[i*3+1]:02X}{pal[i*3+2]:02X} {c*100//tot}%")
