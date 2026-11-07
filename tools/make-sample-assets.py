# Draws the sample images the builder preview uses (no real people): the library's groom and bride figures on soft backgrounds, gift boxes and QR codes.
# Run:  python3 tools/make-sample-assets.py     (needs Pillow and qrcode:  pip install pillow qrcode)
# Writes samples/assets/<set>/ for two sets: "modern" (suit + gown) and "malay" (white baju melayu + white kebaya).
import os, random
from PIL import Image, ImageDraw, ImageFilter
import qrcode

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "samples", "assets")
SETS = {"modern": ("groom-3", "bride-4"), "malay": ("groom-1", "bride-3")}
BG = [((255, 226, 236), (255, 246, 240)), ((205, 232, 247), (255, 244, 232)), ((255, 241, 196), (255, 232, 240)), ((214, 240, 226), (248, 244, 236)), ((226, 218, 248), (255, 238, 244))]

def figure(name):
    return Image.open(os.path.join(ROOT, "models", f"{name}.webp")).convert("RGBA")

def gradient(w, h, a, b, seed):
    g = Image.new("RGB", (w, h))
    px = g.load()
    for y in range(h):
        t = y / (h - 1)
        row = tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
        for x in range(w): px[x, y] = row
    # soft bokeh dots (fixed seed so the files do not change on every run)
    rnd = random.Random(seed)
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(26):
        r = rnd.randint(max(8, w // 40), max(14, w // 12))
        x, y = rnd.randint(0, w), rnd.randint(0, h)
        d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, rnd.randint(40, 110)))
    layer = layer.filter(ImageFilter.GaussianBlur(3))
    g = g.convert("RGBA"); g.alpha_composite(layer)
    return g

def place(canvas, fig, height, cx, bottom=None, top=None):
    f = fig.resize((round(fig.width * height / fig.height), height), Image.LANCZOS)
    x = cx - f.width // 2
    y = (bottom - height) if bottom is not None else top
    canvas.alpha_composite(f, (x, y))

def couple(w, h, g, b, bg, seed, scale=0.92, gap=0.19, bottom_pad=0.0):
    c = gradient(w, h, *BG[bg], seed)
    fh = round(h * scale)
    bottom = round(h * (1 - bottom_pad)) + (fh - h) // 2 if scale > 1 else round(h * (1 - bottom_pad))
    place(c, figure(g), fh, round(w * (0.5 - gap)), bottom=bottom)
    place(c, figure(b), fh, round(w * (0.5 + gap)), bottom=bottom)
    return c

def bust(w, h, name, bg, seed):
    c = gradient(w, h, *BG[bg], seed)
    fig = figure(name)
    fh = round(h * 2.1)                          # large: head and shoulders fill the frame
    place(c, fig, fh, w // 2, top=round(h * 0.04))
    return c

def box(color, ribbon, bg, seed):
    c = gradient(400, 400, *BG[bg], seed)
    d = ImageDraw.Draw(c)
    d.rounded_rectangle((90, 170, 310, 330), 16, fill=color)
    d.rounded_rectangle((78, 140, 322, 190), 14, fill=tuple(max(0, v - 18) for v in color))
    d.rectangle((188, 140, 212, 330), fill=ribbon)
    d.ellipse((150, 100, 200, 150), outline=ribbon, width=9); d.ellipse((200, 100, 250, 150), outline=ribbon, width=9)
    return c

def qr_png(text, size, path):
    img = qrcode.make(text, border=2).convert("RGB").resize((size, size), Image.NEAREST)
    img.save(path)

for name, (g, b) in SETS.items():
    d = os.path.join(OUT, name)
    for sub in ("cover", "portrait", "gallery", "gifts", "qr", "duitnow"): os.makedirs(os.path.join(d, sub), exist_ok=True)
    couple(720, 1280, g, b, 0, 1, scale=0.80, gap=0.2, bottom_pad=0.04).convert("RGB").save(os.path.join(d, "cover", "og-preview.jpg"), quality=84)
    bust(800, 1000, g, 1, 2).save(os.path.join(d, "portrait", "groom.webp"), quality=84)
    bust(800, 1000, b, 0, 3).save(os.path.join(d, "portrait", "bride.webp"), quality=84)
    shots = [(1200, 675, 0.96, 0.17, 0), (750, 1200, 0.78, 0.2, 3), (1200, 675, 1.55, 0.13, 2), (900, 1125, 0.8, 0.19, 4), (1200, 800, 1.35, 0.14, 1)]
    for i, (w, h, sc, gap, bg) in enumerate(shots, 1):
        couple(w, h, g, b, bg, 10 + i, scale=sc, gap=gap).convert("RGB").save(os.path.join(d, "gallery", f"{i}.webp"), quality=80)
    for i, col in enumerate([(244, 176, 196), (160, 206, 232), (240, 214, 120), (176, 214, 190)], 1):
        box(col, (255, 255, 255), i % 5, 20 + i).convert("RGB").save(os.path.join(d, "gifts", f"g{i}.webp"), quality=80)
    qr_png("https://warkah.com.my/", 600, os.path.join(d, "duitnow", "qr.png"))
    qr_png("https://maps.google.com/?q=Dewan+Seri+Kenanga+Shah+Alam", 400, os.path.join(d, "qr", "google-maps.png"))
    qr_png("https://waze.com/ul?q=Dewan%20Seri%20Kenanga%20Shah%20Alam", 400, os.path.join(d, "qr", "waze.png"))
print("samples/assets written")
