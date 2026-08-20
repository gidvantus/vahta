# -*- coding: utf-8 -*-
"""Upscale images 2x and save temp copies for better OCR."""
import sys, io
from PIL import Image
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

JOBS = [
    (r"D:\Development\VideCoding\Vahta\Дизайн\reference 1.PNG", r"D:\Development\VideCoding\Vahta\_tools\up_ref1.png"),
    (r"D:\Development\VideCoding\Vahta\Дизайн\image2.png", r"D:\Development\VideCoding\Vahta\_tools\up_img2.png"),
]
for src, dst in JOBS:
    img = Image.open(src).convert('RGB')
    w, h = img.size
    big = img.resize((w * 2, h * 2), Image.LANCZOS)
    big.save(dst)
    print("saved", dst, big.size)
