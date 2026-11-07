# One-off: blanks the "EN" monogram painted on the shield of the Royal Gold scenes, so the theme carries no couple's initials.
# The ink is dark brown on the yellow shield: mask it (inside a box around the letters, so the gold border is untouched) and fill the
# hole from the shield's own yellow, coarse to fine.
# Usage: python3 tools/clean-crest.py src/themes/royal-gold/public/bg      (rewrites couple/stage/groom/bride/chandelier.webp in place)
import os, sys
import numpy as np
from PIL import Image, ImageFilter

folder = sys.argv[1]
BOXES = {                      # file -> box around the letters (x0, y0, x1, y1), from looking at each scene
    "couple": (1005, 575, 1275, 740),
    "stage": (490, 1380, 640, 1475),
    "groom": (1270, 235, 1440, 440),
    "bride": (0, 190, 250, 475),
    "chandelier": (15, 2085, 215, 2205),
}

def grow(mask, px):
    m = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(px * 2 + 1))
    return np.asarray(m) > 127

def gblur(arr, s):
    return np.asarray(Image.fromarray(arr.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(s))).astype(np.float32)

for name, (x0, y0, x1, y1) in BOXES.items():
    path = os.path.join(folder, f"{name}.webp")
    a = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    H, W, _ = a.shape
    box = np.zeros((H, W), bool); box[y0:min(y1, H), x0:min(x1, W)] = True
    lum = a.mean(axis=2)
    ink = box & (lum < 125) & (a[..., 0] >= a[..., 2] + 8)
    ink = grow(ink, 5) & box
    yellow = (a[..., 0] > 205) & (a[..., 1] > 150) & (a[..., 2] < 150) & ~ink
    out = a.copy()
    for s in (40, 20, 10, 5, 3):
        num = gblur(a * yellow[..., None], s)
        den = gblur(np.repeat((yellow * 255.0)[..., None], 3, axis=2), s) / 255
        est = num / np.maximum(den, 1e-3)
        out = np.where(ink[..., None] & (den > 0.03), est, out)
    soft = gblur(np.repeat((ink * 255.0)[..., None], 3, axis=2), 1.6)[..., :1] / 255
    out = a * (1 - soft) + out * soft
    Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(path, quality=88, method=6)
    print(name, "ink px", int(ink.sum()))
