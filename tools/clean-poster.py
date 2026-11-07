# One-off: removes the couple's names, date and hashtag from the Enchanted Garden poster so the card can draw them as live text.
# Both kinds of lettering are thin strokes, so each stroke is masked and filled from the pixels around it (multi-scale), with a little grain
# added back over the foliage so the patches do not look smooth.
# Usage: python3 tools/clean-poster.py <poster-with-text.webp> <out.webp>      (needs Pillow and numpy)
import sys
import numpy as np
from PIL import Image, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
img = Image.open(src).convert("RGB")
a = np.asarray(img).astype(np.float32)
H, W, _ = a.shape

def grow(mask, px):
    m = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(px * 2 + 1))
    return np.asarray(m) > 127

def gblur(arr, s):
    return np.asarray(Image.fromarray(arr.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(s))).astype(np.float32)

def fill(base, mask, only=None):
    """Replace the masked pixels with the weighted average of the unmasked ones around them (coarse to fine).
    `only` limits which unmasked pixels may be used as the source (e.g. the cream of the path, never the flowers)."""
    known = (~mask).astype(np.float32)
    if only is not None: known = known * only.astype(np.float32)
    out = base.copy()
    kn = (known * 255)
    for s in (40, 20, 10, 5, 3):
        num = gblur(base * known[..., None], s)
        den = gblur(np.repeat(kn[..., None], 3, axis=2), s) / 255
        est = num / np.maximum(den, 1e-3)
        out = np.where(mask[..., None] & (den > 0.04), est, out)
    return out

def feather(mask, s):
    return gblur(np.repeat((mask * 255.0)[..., None], 3, axis=2), s)[..., :1] / 255

rng = np.random.default_rng(7)

# 1) names: white strokes, found line by line (a tight box each, so the pale building and sparkles behind the trees are left alone).
#    "strong" = clearly white; "weak" = the anti-aliased edge, kept only when it touches a strong pixel.
def names_mask():
    strong = np.zeros((H, W), bool); weak = np.zeros((H, W), bool)
    for x0, y0, x1, y1 in [(335, 748, 1175, 955), (510, 940, 975, 1160)]:       # "Nadiah &"  /  "Ezzan"
        reg = a[y0:y1, x0:x1]
        strong[y0:y1, x0:x1] = reg.min(axis=2) > 196
        weak[y0:y1, x0:x1] = reg.min(axis=2) > 135
    return grow(grow(strong, 6) & weak | strong, 4)
names = names_mask()
filled = fill(a, names)
filled = filled + rng.normal(0, 4.0, size=filled.shape).astype(np.float32) * names[..., None]
soft = feather(names, 2)
out = a * (1 - soft) + filled * soft

# 2) date + hashtag: grey/black strokes (low saturation, darker than the cream) on the path
date = np.zeros((H, W), bool)
for x0, y0, x1, y1 in [(580, 2085, 820, 2155), (400, 2150, 1030, 2295), (480, 2290, 950, 2420)]:   # "Ahad," / the date / the hashtag
    reg = out[y0:y1, x0:x1]
    lum = reg.mean(axis=2)
    sat = reg.max(axis=2) - reg.min(axis=2)
    date[y0:y1, x0:x1] = (lum < 188) & (sat < 46)
date = grow(date, 6)
cream = (out.mean(axis=2) > 205) & ((out.max(axis=2) - out.min(axis=2)) < 60)
filled = fill(out, date, only=cream)
softd = feather(date, 1.8)
out = out * (1 - softd) + filled * softd

Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(dst, quality=88, method=6)
print("written", dst)
