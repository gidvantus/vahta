# -*- coding: utf-8 -*-
"""Scan saturated colors in reference 1 (warm accents)."""
import sys, io
from collections import Counter
from PIL import Image
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

img = Image.open(r"D:\Development\VideCoding\Vahta\Дизайн\reference 1.PNG").convert('RGB')
img = img.resize((img.width // 2, img.height // 2))
c = Counter(img.getdata())
sat_px = []
for (r, g, b), cnt in c.most_common(30000):
    mx, mn = max(r, g, b), min(r, g, b)
    sat = 0 if mx == 0 else (mx - mn) * 255 // mx
    if sat >= 30 and cnt >= 30:
        sat_px.append((cnt, (r, g, b), sat))
sat_px.sort(key=lambda x: -x[0])
print("total saturated:", len(sat_px))
for cnt, (r, g, b), sat in sat_px[:15]:
    print(f"  #{r:02X}{g:02X}{b:02X} sat={sat} freq={cnt}")
