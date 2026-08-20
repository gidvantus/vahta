# -*- coding: utf-8 -*-
"""Find distinct accent colors in design images."""
import sys, io
from PIL import Image
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def accents(path, n=12, min_sat=60, min_freq=150):
    img = Image.open(path).convert('RGB').resize((400, 466))  # keep aspect ~ ref1
    px = list(img.getdata())
    from collections import Counter
    c = Counter(px)
    out = []
    for (r, g, b), cnt in c.most_common(4000):
        mx, mn = max(r, g, b), min(r, g, b)
        sat = 0 if mx == 0 else (mx - mn) * 255 // mx
        if sat >= min_sat and cnt >= min_freq and mx > 40:
            out.append((cnt, (r, g, b)))
            if len(out) >= n:
                break
    return out

for path in [r"D:\Development\VideCoding\Vahta\Дизайн\reference 1.PNG",
             r"D:\Development\VideCoding\Vahta\Дизайн\image2.png"]:
    print("=" * 60)
    print(path)
    for cnt, (r, g, b) in accents(path):
        print(f"  #{r:02X}{g:02X}{b:02X}  freq={cnt}")
