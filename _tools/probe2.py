# -*- coding: utf-8 -*-
"""Final probes: button text colors, image2 orange elements."""
import sys, io
from PIL import Image
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

R1 = Image.open(r"D:\Development\VideCoding\Vahta\Дизайн\reference 1.PNG").convert('RGB')
R2 = Image.open(r"D:\Development\VideCoding\Vahta\Дизайн\image2.png").convert('RGB')

print("REF1 probes:")
for p in [(510, 268), (540, 268), (520, 285), (600, 725), (650, 725), (570, 730), (640, 730)]:
    print(" ", p, R1.getpixel(p))

print("IMG2 orange region (350,95)-(450,310):")
img = R2.crop((350, 95, 450, 310))
# print a coarse color map 10x10
small = img.resize((20, 20))
px = small.load()
for y in range(20):
    row = ''
    for x in range(20):
        r, g, b = px[x, y]
        if r > 200 and g < 170 and b < 100:
            row += 'O'
        elif r > 180 and b < 150:
            row += 'o'
        elif r > 240 and g > 240:
            row += '.'
        else:
            row += ' '
    print(f"  {row}")

print("IMG2 logo orange (160,0)-(240,105):")
img2 = R2.crop((160, 0, 240, 105))
small = img2.resize((16, 21))
px = small.load()
for y in range(21):
    row = ''
    for x in range(16):
        r, g, b = px[x, y]
        if r > 200 and g < 170 and b < 100:
            row += 'O'
        elif r > 180 and b < 150:
            row += 'o'
        elif r > 240 and g > 240:
            row += '.'
        else:
            row += ' '
    print(f"  {row}")
