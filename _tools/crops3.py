# -*- coding: utf-8 -*-
"""Crop orange element regions for OCR + palette."""
import sys, io
from collections import Counter
from PIL import Image
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

R1 = r"D:\Development\VideCoding\Vahta\Дизайн\reference 1.PNG"
CROPS = [
    ("logo mark",     (90, 15, 160, 65)),
    ("hero right O",  (470, 130, 767, 230)),
    ("cta left O",    (55, 690, 140, 770)),
    ("search btn",    (485, 235, 680, 305)),
    ("card1 strip",   (35, 460, 172, 505)),
]
for name, box in CROPS:
    img = Image.open(R1).convert('RGB').crop(box)
    w, h = img.size
    big = img.resize((w * 2, h * 2), Image.LANCZOS)
    big.save(rf"D:\Development\VideCoding\Vahta\_tools\o_{name.replace(' ', '_')}.png")
    q = img.resize((80, 40)).quantize(colors=5, method=Image.MEDIANCUT)
    pal = q.getpalette()
    cnt = Counter(q.getdata())
    tot = sum(cnt.values())
    cols = "  ".join(f"#{pal[i*3]:02X}{pal[i*3+1]:02X}{pal[i*3+2]:02X}({c*100//tot}%)" for i, c in cnt.most_common(5))
    print(f"{name:14s} {box} -> {cols}")
