# -*- coding: utf-8 -*-
"""Precise component colors for both designs."""
import sys, io
from collections import Counter
from PIL import Image
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def colors(path, box, n=5):
    img = Image.open(path).convert('RGB').crop(box)
    small = img.resize((80, 40))
    q = small.quantize(colors=n, method=Image.MEDIANCUT)
    pal = q.getpalette()
    cnt = Counter(q.getdata())
    tot = sum(cnt.values())
    return "  ".join(f"#{pal[i*3]:02X}{pal[i*3+1]:02X}{pal[i*3+2]:02X}({c*100//tot}%)" for i, c in cnt.most_common(n))

R1 = r"D:\Development\VideCoding\Vahta\Дизайн\reference 1.PNG"
R2 = r"D:\Development\VideCoding\Vahta\Дизайн\image2.png"

COMPS = [
    ("REF1 header bg",      R1, (0, 0, 767, 70)),
    ("REF1 nav row",        R1, (0, 30, 767, 75)),
    ("REF1 hero left bg",   R1, (30, 95, 480, 230)),
    ("REF1 search btn",     R1, (450, 248, 560, 296)),
    ("REF1 badge 70k",      R1, (330, 248, 450, 296)),
    ("REF1 hero right panel", R1, (480, 90, 767, 265)),
    ("REF1 stats row",      R1, (30, 315, 740, 355)),
    ("REF1 section title bg", R1, (30, 380, 740, 420)),
    ("REF1 card1 bg",       R1, (35, 500, 172, 645)),
    ("REF1 card1 top strip",R1, (35, 470, 172, 500)),
    ("REF1 CTA area bg",    R1, (0, 690, 767, 895)),
    ("REF1 CTA btn",        R1, (505, 700, 640, 745)),
    ("REF1 benefits row",   R1, (30, 810, 740, 850)),
    ("IMG2 header bg",      R2, (0, 0, 1536, 75)),
    ("IMG2 post-btn",       R2, (1150, 30, 1390, 65)),
    ("IMG2 search input",   R2, (300, 20, 980, 60)),
    ("IMG2 sidebar bg",     R2, (0, 120, 430, 1024)),
    ("IMG2 city input",     R2, (40, 160, 430, 195)),
    ("IMG2 card1 bg",       R2, (440, 180, 1510, 420)),
    ("IMG2 card1 logo strip", R2, (440, 180, 1510, 230)),
    ("IMG2 apply btn1",     R2, (1225, 275, 1470, 320)),
    ("IMG2 results row",    R2, (440, 115, 1510, 150)),
]
for name, path, box in COMPS:
    print(f"{name:22s} {box} -> {colors(path, box)}")
