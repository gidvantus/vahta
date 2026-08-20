# -*- coding: utf-8 -*-
"""Locate orange and blue elements in image2."""
import sys, io
from PIL import Image
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

img = Image.open(r"D:\Development\VideCoding\Vahta\Дизайн\image2.png").convert('RGB')
w, h = img.size

def find(color_fn, label):
    boxes = {}
    for y in range(h):
        for x in range(0, w, 2):
            r, g, b = img.getpixel((x, y))
            if color_fn(r, g, b):
                by = y // 100
                boxes.setdefault(by, []).append(x)
    print(f"--- {label} ---")
    for by in sorted(boxes):
        xs = boxes[by]
        print(f"  y {by*100}-{by*100+99}: x {min(xs)}..{max(xs)} n={len(xs)}")

find(lambda r, g, b: r > 200 and 60 < g < 160 and b < 80, "orange-ish")
find(lambda r, g, b: b > 200 and r < 100 and g < 160, "blue-ish")
