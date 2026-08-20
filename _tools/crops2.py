# -*- coding: utf-8 -*-
"""Crop regions of interest for OCR + palette."""
import sys, io
from PIL import Image
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

CROPS = [
    # name, src, box, out
    ("ref1_card1",  r"D:\Development\VideCoding\Vahta\Дизайн\reference 1.PNG", (35, 470, 172, 615), r"D:\Development\VideCoding\Vahta\_tools\c_card1.png"),
    ("ref1_cta",    r"D:\Development\VideCoding\Vahta\Дизайн\reference 1.PNG", (0, 690, 767, 895), r"D:\Development\VideCoding\Vahta\_tools\c_cta.png"),
    ("ref1_heroR",  r"D:\Development\VideCoding\Vahta\Дизайн\reference 1.PNG", (480, 80, 767, 340), r"D:\Development\VideCoding\Vahta\_tools\c_heror.png"),
    ("ref1_heroL",  r"D:\Development\VideCoding\Vahta\Дизайн\reference 1.PNG", (30, 90, 480, 345), r"D:\Development\VideCoding\Vahta\_tools\c_herol.png"),
]
for name, src, box, out in CROPS:
    img = Image.open(src).convert('RGB').crop(box)
    w, h = img.size
    big = img.resize((w * 2, h * 2), Image.LANCZOS)
    big.save(out)
    print(name, box, "->", out, big.size)
