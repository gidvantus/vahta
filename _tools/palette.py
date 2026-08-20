# -*- coding: utf-8 -*-
"""Extract detailed palette + region stats for design images."""
import sys, io
from PIL import Image
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PATHS = [
    r"D:\Development\VideCoding\Vahta\Дизайн\reference 1.PNG",
    r"D:\Development\VideCoding\Vahta\Дизайн\image2.png",
]

def avg_color(region):
    r = region.convert('RGB').resize((64, 64))
    px = list(r.getdata())
    n = len(px)
    rs = sum(p[0] for p in px) // n
    gs = sum(p[1] for p in px) // n
    bs = sum(p[2] for p in px) // n
    return (rs, gs, bs)

def fmt(c):
    return f"#{c[0]:02X}{c[1]:02X}{c[2]:02X}"

for p in PATHS:
    img = Image.open(p).convert('RGB')
    w, h = img.size
    print("=" * 90)
    print("FILE:", p, f"{w}x{h}")
    # grid 3x4 regions
    print("--- region averages (grid 4 cols x 3 rows, top-left origin) ---")
    cols, rows = 4, 3
    for ry in range(rows):
        line = []
        for cx in range(cols):
            box = (cx * w // cols, ry * h // rows, (cx + 1) * w // cols, (ry + 1) * h // rows)
            line.append(fmt(avg_color(img.crop(box))))
        print("  row", ry, " ".join(line))
    # top-14 palette from downsampled image
    small = img.resize((160, 160))
    from collections import Counter
    q = small.quantize(colors=14, method=Image.MEDIANCUT)
    pal = q.getpalette()
    cnt = Counter(q.getdata())
    total = sum(cnt.values())
    print("--- palette top-14 ---")
    for idx, c in cnt.most_common(14):
        r, g, b = pal[idx * 3: idx * 3 + 3]
        print(f"  #{r:02X}{g:02X}{b:02X}  {c * 100.0 / total:5.1f}%")
    print()
