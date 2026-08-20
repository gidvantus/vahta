# -*- coding: utf-8 -*-
"""Accurate color-classified layout map for design images."""
import sys, io
from PIL import Image
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# (name, r, g, b, char)
CLASSES = [
    ("white",    250, 250, 250, ' '),
    ("lightblue",220, 235, 250, '.'),
    ("midblue",  140, 175, 230, '~'),
    ("grayblue", 175, 190, 210, ':'),
    ("warmgray", 170, 160, 150, '='),
    ("darkbrown",55,  45,  40, '#'),
    ("charcoal", 60,  62,  66, '#'),
    ("orange",   250, 100, 10,  'O'),
    ("blue",     5,   111, 241, 'B'),
    ("darkblue", 30,  60, 120, '@'),
]
# merge darkbrown/charcoal by char equality later; just pick nearest by name

def classify(r, g, b):
    best, bd = None, 1e9
    for name, cr, cg, cb, ch in CLASSES:
        d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2
        if d < bd:
            bd, best = d, (name, ch)
    return best

def render(path, cols=110, label=""):
    img = Image.open(path).convert('RGB')
    w, h = img.size
    rows = max(1, round(h * cols / w / 2.0))
    small = img.resize((cols, rows))
    px = small.load()
    print(f"===== {label} ({w}x{h}) =====")
    # legend
    legend = " ".join(f"{ch}={name}" for name, _, _, _, ch in CLASSES)
    print(legend)
    for y in range(rows):
        line = ''.join(classify(*px[x, y])[1] for x in range(cols))
        print(f"{y:3d} {line}")
    print()

render(r"D:\Development\VideCoding\Vahta\Дизайн\reference 1.PNG", label="REFERENCE 1 (landing)")
render(r"D:\Development\VideCoding\Vahta\Дизайн\image2.png", label="IMAGE 2 (catalog)")
