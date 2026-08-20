# -*- coding: utf-8 -*-
"""Crop specific regions and report their dominant colors."""
import sys, io
from collections import Counter
from PIL import Image
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def palette(img, n=6):
    small = img.convert('RGB').resize((100, 100))
    q = small.quantize(colors=n, method=Image.MEDIANCUT)
    pal = q.getpalette()
    cnt = Counter(q.getdata())
    total = sum(cnt.values())
    return [f"#{pal[i*3]:02X}{pal[i*3+1]:02X}{pal[i*3+2]:02X} {c*100.0//total}%"
            for i, c in cnt.most_common(n)]

CROPS = [
    ("ref1 dark section", r"D:\Development\VideCoding\Vahta\Дизайн\reference 1.PNG", (80, 370, 700, 500)),
    ("ref1 bottom-right CTA", r"D:\Development\VideCoding\Vahta\Дизайн\reference 1.PNG", (430, 760, 767, 895)),
    ("ref1 bottom-left logo", r"D:\Development\VideCoding\Vahta\Дизайн\reference 1.PNG", (150, 770, 400, 895)),
    ("ref1 hero area", r"D:\Development\VideCoding\Vahta\Дизайн\reference 1.PNG", (40, 140, 730, 350)),
    ("img2 card header", r"D:\Development\VideCoding\Vahta\Дизайн\image2.png", (880, 40, 1536, 130)),
    ("img2 right cards", r"D:\Development\VideCoding\Vahta\Дизайн\image2.png", (880, 180, 1536, 1024)),
    ("img2 sidebar", r"D:\Development\VideCoding\Vahta\Дизайн\image2.png", (0, 140, 300, 1024)),
]
for name, path, box in CROPS:
    img = Image.open(path).convert('RGB').crop(box)
    print(f"--- {name} {box} ---")
    for p in palette(img):
        print("   ", p)
    print()
