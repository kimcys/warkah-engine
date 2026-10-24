// Cleans chosen video frames: median-filters the regions holding baked-in sample text / the watermark,
// then writes webp scene backgrounds. Usage: node clean.cjs <framesDir> <outDir> [previewDir]
// Run from the repo root: node src/themes/glasshouse/clean-frames.cjs <framesDir> <outDir>  (frames: t000.0.png … every 0.5 s)
const sharp = require("sharp");
const [, , src, out, preview] = process.argv;
const WM = [384, 742, 192, 152];            // TikTok logo + handle, bottom right
const plan = {
  opening: { t: "000.0", glass: "translate(292 645) scale(0.72) translate(-299 -467)", wm: [[0, 440, 200, 150]], from: [[0, -160]] },
  arch:    { t: "004.0", glass: "translate(0 0)", wm: [[0, 440, 180, 160]], from: [[0, -190]] },
  court:   { t: "009.5", wm: [WM] },
  lamp:    { t: "019.0", finish: "black", text: [[222, 452, 146, 104]], wm: [WM], dark: true, from: [[0, -110]] },
  hall:    { t: "028.0", wm: [WM] },
  bride:   { t: "040.0", finish: "haze", text: [[160, 322, 330, 176]], wm: [WM], from: [[0, 120]] },
  groom:   { t: "047.0", finish: "haze", text: [[96, 288, 300, 172]], wm: [[392, 752, 184, 132]], smooth: true },
  stage:   { t: "052.0", finish: "haze", text: [[160, 92, 300, 376]], wm: [WM], smooth: true },
  aisle:   { t: "060.0", wm: [WM] },
  phone:   { t: "066.0", wm: [WM] },
  roses:   { t: "072.0", finish: "haze", text: [[26, 318, 528, 336]], wm: [WM], smooth: true },
  garden:  { t: "078.0", wm: [WM] },
  gate:    { t: "082.0", wm: [WM, [150, 932, 280, 80]], from: [[0, -108], [0, -84]] }
};

// Soft edges: alpha rises smoothly over `edge` px from each side, so a patch melts into the frame.
async function soften(buf, w, h, edge, open = {}) {
  const rgb = await sharp(buf).removeAlpha().resize(w, h).raw().toBuffer();
  const out = Buffer.alloc(w * h * 4);
  const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.min(
        open.left ? Infinity : x, open.top ? Infinity : y,
        open.right ? Infinity : w - 1 - x, open.bottom ? Infinity : h - 1 - y);
      const i = y * w + x;
      out[i * 4] = rgb[i * 3]; out[i * 4 + 1] = rgb[i * 3 + 1]; out[i * 4 + 2] = rgb[i * 3 + 2];
      out[i * 4 + 3] = Math.round(255 * ease(d / edge));
    }
  }
  return sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

async function patch(img, [x, y, w, h], size, finish) {
  const pad = 18;                                   // work on a slightly bigger area and feather the margin
  const meta = await sharp(img).metadata();
  const X = Math.max(0, x - pad), Y = Math.max(0, y - pad);
  const W = Math.min(meta.width - X, w + 2 * pad), H = Math.min(meta.height - Y, h + 2 * pad);
  let region = await sharp(img).extract({ left: X, top: Y, width: W, height: H }).median(size).median(size).blur(1.5).png().toBuffer();
  if (finish === "haze") {
    region = await sharp(region).composite([{ input: Buffer.from(`<svg width="${W}" height="${H}"><defs><radialGradient id="g"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="0.7" stop-color="#fff" stop-opacity="0.75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><ellipse cx="${W / 2}" cy="${H / 2}" rx="${W / 2}" ry="${H / 2}" fill="url(#g)"/></svg>`) }]).png().toBuffer();
  } else if (finish === "acrylic") {
    region = await sharp(region).composite([{ input: Buffer.from(`<svg width="${W}" height="${H}"><rect x="${pad + 2}" y="${pad + 2}" width="${w - 4}" height="${h - 4}" rx="6" fill="#fbfafc" fill-opacity="0.86"/></svg>`) }]).png().toBuffer();
  } else if (finish === "black") {
    region = await sharp(region).composite([{ input: Buffer.from(`<svg width="${W}" height="${H}"><rect x="${pad}" y="${pad}" width="${w}" height="${h}" fill="#151617"/></svg>`) }]).png().toBuffer();
  }
  const edge = finish === "black" || finish === "acrylic" ? 6 : pad;
  region = await soften(region, W, H, edge);
  return sharp(img).composite([{ input: region, left: X, top: Y }]).png().toBuffer();
}

// Frosted acrylic board with a heart-topped outline (the bow loops at the top of the arch make the same shape).
// The frame's baked-in sample text is wiped by a strong median + blur inside the shape, then a thin white tint and
// a soft rim are laid over, so the doorway and flowers still show through, like the clear sign in the video.
const BOARD = { x0: 196, y0: 292, x1: 402, y1: 642 };
function heartPath({ x0, y0, x1, y1 }, grow = 0) {
  x0 -= grow; y0 -= grow; x1 += grow; y1 += grow;
  const cx = (x0 + x1) / 2;
  return `M${x0 + 16} ${y1} Q${x0} ${y1} ${x0} ${y1 - 16} L${x0} ${y0 + 36} ` +
    `C${x0} ${y0 + 10} ${x0 + 30} ${y0} ${x0 + 56} ${y0} C${x0 + 84} ${y0} ${x0 + 98} ${y0 + 14} ${cx} ${y0 + 28} ` +
    `C${x1 - 98} ${y0 + 14} ${x1 - 84} ${y0} ${x1 - 56} ${y0} C${x1 - 30} ${y0} ${x1} ${y0 + 10} ${x1} ${y0 + 36} ` +
    `L${x1} ${y1 - 16} Q${x1} ${y1} ${x1 - 16} ${y1}Z`;
}
async function glass(img, tf, tint = 0.42) {
  const meta = await sharp(img).metadata();
  const W = meta.width, H = meta.height;
  const svg = (inner) => Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`);
  // mask a little bigger than the board, so no sample-text pixel survives at the rim
  const maskRaw = await sharp(svg(`<defs><filter id="f"><feGaussianBlur stdDeviation="2.2"/></filter></defs><rect width="100%" height="100%" fill="#000"/><g transform="${tf}" filter="url(#f)"><path d="${heartPath(BOARD, 7)}" fill="#fff"/></g>`))
    .removeAlpha().extractChannel(0).raw().toBuffer();
  const frosted = await sharp(img).removeAlpha().median(31).median(31).blur(9).raw().toBuffer();
  const rgba = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) { rgba[i * 4] = frosted[i * 3]; rgba[i * 4 + 1] = frosted[i * 3 + 1]; rgba[i * 4 + 2] = frosted[i * 3 + 2]; rgba[i * 4 + 3] = maskRaw[i]; }
  const frostedPng = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  const tintSvg = svg(`<g transform="${tf}"><path d="${heartPath(BOARD)}" fill="#ffffff" fill-opacity="${tint}"/><path d="${heartPath(BOARD)}" fill="none" stroke="#ffffff" stroke-opacity="0.8" stroke-width="2"/><path d="${heartPath(BOARD, -3)}" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1"/></g>`);
  return sharp(img).composite([{ input: frostedPng }, { input: tintSvg }]).png().toBuffer();
}

// Watermark: cover it with a copy of nearby scenery (dx, dy = where to copy from), feathered.
async function clone(img, [x, y, w, h], [dx, dy]) {
  const meta = await sharp(img).metadata();
  const src = await sharp(img).extract({ left: x + dx, top: y + dy, width: w, height: h }).png().toBuffer();
  const open = { right: x + w >= meta.width, bottom: y + h >= meta.height, left: x <= 0, top: y <= 0 };
  return sharp(img).composite([{ input: await soften(src, w, h, 26, open), left: x, top: y }]).png().toBuffer();
}

// Watermark over a figure: a strong median keeps the shapes (trousers, veil) and drops the thin letters.
async function smooth(img, [x, y, w, h]) {
  const meta = await sharp(img).metadata();
  const src = await sharp(img).extract({ left: x, top: y, width: w, height: h }).median(17).median(17).png().toBuffer();
  const open = { right: x + w >= meta.width, bottom: y + h >= meta.height, left: x <= 0, top: y <= 0 };
  return sharp(img).composite([{ input: await soften(src, w, h, 18, open), left: x, top: y }]).png().toBuffer();
}

(async () => {
  for (const [name, p] of Object.entries(plan)) {
    let img = await sharp(`${src}/t${p.t}.png`).png().toBuffer();
    if (p.glass) img = await glass(img, p.glass);
    for (const r of p.text ?? []) img = await patch(img, r, p.dark ? 15 : 21, p.finish);
    for (const [i, r] of (p.wm ?? []).entries()) img = p.smooth ? await smooth(img, r) : await clone(img, r, (p.from ?? [])[i] ?? [-150, 0]);
    await sharp(img).webp({ quality: 84 }).toFile(`${out}/${name}.webp`);
    if (preview) await sharp(img).resize(288).jpeg({ quality: 80 }).toFile(`${preview}/${name}.jpg`);
  }
})();
