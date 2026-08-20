# -*- coding: utf-8 -*-
"""Approximate-render logo.svg with PIL to verify composition."""
import sys, io, math
from PIL import Image, ImageDraw, ImageFont
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

W, H = 300, 72
img = Image.new('RGB', (W, H), '#ffffff')
d = ImageDraw.Draw(img)

def cubic(p0, p1, p2, p3, n=48):
    pts = []
    for i in range(n + 1):
        t = i / n
        mt = 1 - t
        x = mt**3 * p0[0] + 3 * mt**2 * t * p1[0] + 3 * mt * t**2 * p2[0] + t**3 * p3[0]
        y = mt**3 * p0[1] + 3 * mt**2 * t * p1[1] + 3 * mt * t**2 * p2[1] + t**3 * p3[1]
        pts.append((x, y))
    return pts

def arc_bottom(p0, p1, r, n=32):
    """lower semicircle from p0 to p1 (center between, r=6)"""
    cx, cy = (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2
    pts = []
    for i in range(n + 1):
        a = math.pi + math.pi * i / n  # sweep 0 => CCW => bottom arc
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

# outer flame (scaled 1.12, translated 238,9)
S, T = 1.12, (238, 9)
def tr(p):
    return (p[0] * S + T[0], p[1] * S + T[1])

outer = []
outer += cubic(tr((20, 2)), tr((12, 12)), tr((7, 17.5)), tr((7, 25.5)))
outer += cubic(tr((7, 25.5)), tr((7, 34.3)), tr((12.8, 40.5)), tr((20, 40.5)))
outer += cubic(tr((20, 40.5)), tr((27.2, 40.5)), tr((33, 34.3)), tr((33, 25.5)))
outer += cubic(tr((33, 25.5)), tr((33, 17.5)), tr((28, 12)), tr((20, 2)))
d.polygon(outer, fill='#F75E03')

inner = []
inner += cubic(tr((17, 20)), tr((13, 24.5)), tr((11.5, 27.5)), tr((11.5, 31)))
inner += arc_bottom(tr((11.5, 31)), tr((23.5, 31)), 6 * S)
inner += cubic(tr((23.5, 31)), tr((23.5, 27.5)), tr((22, 24.5)), tr((17, 20)))
d.polygon(inner, fill='#ffffff')

# text
font = ImageFont.truetype(r'C:\Windows\Fonts\verdanab.ttf', 44)
d.text((2, 51 - 44), 'Вахта.ру', font=font, fill='#6E71AF')
# PIL text draws by top-left; baseline math: draw at y=6..50

img.save(r'D:\Development\VideCoding\Vahta\_tools\logo_preview.png')

# ASCII check
small = img.resize((120, 29))
px = small.load()
for y in range(29):
    row = ''
    for x in range(120):
        r, g, b = px[x, y]
        if r > 240 and g > 240 and b > 240: row += ' '
        elif r > 200 and g < 170 and b < 110: row += 'O'
        elif r > 100 and g < 130 and b > 140 and b > r: row += 'P'
        else: row += '.'
    print(row)
