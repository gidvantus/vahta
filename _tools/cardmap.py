# -*- coding: utf-8 -*-
"""Detailed color map of vacancy card 1 from catalog design."""
import sys, io
from PIL import Image
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

img = Image.open(r"D:\Development\VideCoding\Vahta\Дизайн\image2.png").convert('RGB')
card = img.crop((440, 170, 1510, 430))

# color classes
def cls(r, g, b):
    if r > 235 and g > 235 and b > 235: return ' '          # white
    if b > 180 and r < 120 and g < 160: return 'B'          # vivid blue
    if b > 160 and r > 150 and g > 170 and b > g: return '~'  # light blue
    if r > 200 and 40 < g < 170 and b < 110: return 'O'     # orange
    if r < 100 and g < 100 and b < 110: return '#'          # dark text
    if r > 180 and g > 180 and b > 180: return '.'          # light gray
    return '='

cols = 120
w, h = card.size
rows = max(1, round(h * cols / w / 2.0))
small = card.resize((cols, rows))
px = small.load()
print(f"card 1 crop (440,170,1510,430) {w}x{h} -> {cols}x{rows}")
for y in range(rows):
    print(f"{y:3d} " + ''.join(cls(*px[x, y]) for x in range(cols)))
