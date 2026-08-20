# -*- coding: utf-8 -*-
"""Analyze design images: size, dominant colors, coarse layout map."""
import sys, io
from collections import Counter
from PIL import Image

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PATHS = [
    r"D:\Development\VideCoding\Vahta\Дизайн\reference 1.PNG",
    r"D:\Development\VideCoding\Vahta\Дизайн\image2.png",
]

# color buckets: name -> (r,g,b) prototype for nearest mapping
BUCKETS = {
    'WHT': (245, 245, 245),
    'BLK': (25, 25, 25),
    'GRY': (128, 128, 128),
    'RED': (200, 40, 40),
    'ORG': (230, 130, 40),
    'YLW': (235, 205, 60),
    'GRN': (60, 170, 80),
    'CYN': (60, 190, 200),
    'BLU': (50, 90, 200),
    'PRP': (140, 70, 190),
    'PNK': (230, 110, 170),
    'BRN': (130, 85, 50),
}

def nearest_bucket(r, g, b):
    best, bd = '???', 1e9
    for name, (pr, pg, pb) in BUCKETS.items():
        d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
        if d < bd:
            bd, best = d, name
    return best

def dominant_colors(img, n=8):
    small = img.convert('RGB').resize((120, 120))
    q = small.quantize(colors=n, method=Image.MEDIANCUT)
    palette = q.getpalette()
    counts = Counter(q.getdata())
    total = sum(counts.values())
    out = []
    for idx, cnt in counts.most_common(n):
        r, g, b = palette[idx * 3: idx * 3 + 3]
        out.append(f"#{r:02X}{g:02X}{b:02X} ({cnt * 100.0 / total:.1f}%)")
    return out

def layout_map(img, cols=72):
    """Downsample and paint each cell with a char reflecting its color bucket.
    Luminance drives density of the char, hue drives the bucket label."""
    w, h = img.size
    rows = max(1, int(h * cols / w / 2.2))  # aspect correction for chars
    small = img.convert('RGB').resize((cols, rows))
    px = small.load()
    density = ' .:-=+*#%@'
    lines = []
    for y in range(rows):
        line = ''
        for x in range(cols):
            r, g, b = px[x, y]
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            ch = density[min(9, int(lum / 25.6))]
            line += ch
        lines.append(line)
    return lines

def color_regions_map(img, cols=100):
    """Paint each cell with bucket first letter, but keep whitespace for light cells."""
    w, h = img.size
    rows = max(1, int(h * cols / w / 2.2))
    small = img.convert('RGB').resize((cols, rows))
    px = small.load()
    lines = []
    for y in range(rows):
        line = ''
        for x in range(cols):
            r, g, b = px[x, y]
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            if lum > 235:
                line += ' '   # near-white background
            elif lum < 35:
                line += '#'   # near-black
            else:
                line += nearest_bucket(r, g, b)[0]
        lines.append(line)
    return lines

for p in PATHS:
    print('=' * 100)
    print('FILE:', p)
    img = Image.open(p)
    print(f'SIZE: {img.width} x {img.height}  MODE: {img.mode}')
    print('DOMINANT COLORS:')
    for c in dominant_colors(img):
        print('   ', c)
    print('--- layout (luminance) ---')
    for line in layout_map(img):
        print(line)
    print('--- layout (color buckets: W=white B=black G=gray R=red O=orange Y=yellow N=green C=cyan U=blue P=purple K=pink N=brn) ---')
    for line in color_regions_map(img):
        print(line)
    print()
