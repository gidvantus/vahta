# -*- coding: utf-8 -*-
"""Probe orange pixels precisely in reference 1."""
import sys, io
from PIL import Image
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

img = Image.open(r"D:\Development\VideCoding\Vahta\Дизайн\reference 1.PNG").convert('RGB')
w, h = img.size

# find all orange pixels (r>180, g 40-160, b<90)
pts = []
for y in range(h):
    for x in range(w):
        r, g, b = img.getpixel((x, y))
        if r > 180 and 40 <= g <= 170 and b < 90:
            pts.append((x, y))
print("orange pixel count:", len(pts))
if pts:
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    print("x:", min(xs), "..", max(xs), " y:", min(ys), "..", max(ys))
    # cluster by y in 20px bands
    from collections import Counter
    bands = Counter(y // 20 for y in ys)
    print("distribution by y-band (20px):")
    for b in sorted(bands):
        by = [p for p in pts if p[1] // 20 == b]
        bx = [p[0] for p in by]
        print(f"  y {b*20}-{b*20+19}: n={len(by)} x={min(bx)}..{max(bx)}")

# probe specific points
for p in [(400, 260), (400, 270), (380, 262), (500, 270), (505, 270), (390, 275)]:
    print(p, img.getpixel(p))
