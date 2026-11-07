// Recolours the OUTFIT of a model picture (the groom's and bride's figures) and leaves everything else alone: skin, gold embroidery, shoes and transparency.
// The garments in the model library are near-white, grey or black, so an outfit pixel is one with almost no colour of its own; skin is warm and more saturated, and
// gold detail is strongly saturated. An outfit pixel keeps its light and shade (the folds, lace and stitching) and takes the new colour:
//
//     out = colour x (floor + (1 - floor) x light)         light = the pixel's own brightness 0..1, lifted so shadows do not go muddy
//
// Pure arithmetic over an RGBA byte array, so the same function recolours a picture in the browser (canvas ImageData, for the live preview in the builder) and in
// the card build (sharp's raw pixels), and both give the same result. No dependencies.

/** Outfit colours the builder offers (the customer may also pick any colour). `null` hex = the model as it is. */
export const OUTFIT_COLOURS = [
  { id: "asal", label: "Asal", labelEn: "Original", hex: null },
  { id: "putih-gading", label: "Putih gading", labelEn: "Ivory", hex: "#F3EAD7" },
  { id: "hijau-sage", label: "Hijau sage", labelEn: "Sage green", hex: "#9DB59A" },
  { id: "hijau-zamrud", label: "Hijau zamrud", labelEn: "Emerald", hex: "#1F6B4F" },
  { id: "biru-laut", label: "Biru laut", labelEn: "Navy", hex: "#1F2F5C" },
  { id: "biru-langit", label: "Biru langit", labelEn: "Sky blue", hex: "#8FB4D9" },
  { id: "merah-hati", label: "Merah hati", labelEn: "Maroon", hex: "#7A1F2B" },
  { id: "merah-jambu", label: "Merah jambu", labelEn: "Dusty rose", hex: "#D9A1A8" },
  { id: "ungu-lavender", label: "Ungu lavender", labelEn: "Lavender", hex: "#B8A4D6" },
  { id: "emas-champagne", label: "Emas champagne", labelEn: "Champagne gold", hex: "#D9BF8C" },
  { id: "kelabu-batu", label: "Kelabu batu", labelEn: "Stone grey", hex: "#8C8C94" },
  { id: "hitam", label: "Hitam", labelEn: "Black", hex: "#1B1B1F" }
];

/** "#RRGGBB" to [r, g, b], or null when it is not one. */
export function parseHex(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(typeof hex === "string" ? hex.trim() : "");
  return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : null;
}

const FLOOR = 0.42;          // how dark the deepest shadow of the outfit gets, as a share of the colour
const SKIN_NEAR = 30;        // a pixel this close (RGB distance) to the model's own skin colour is skin and is left alone
const SKIN_FAR = 52;         // ... and one this far is outfit; in between it fades, so the edge of a hand shows no ring
const GOLD_SAT = 0.42;       // a warm pixel this saturated is gold (embroidery, crowns, brooches) and keeps its colour

/** The model's own skin colour: the middle of the warm, bright, not-too-pale pixels in the top fifth of the picture (the face). */
function skinColour(rgba, width, height) {
  const rows = Math.max(1, Math.floor(height * 0.2));
  const rs = [], gs = [], bs = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    if (rgba[i + 3] < 250) continue;
    const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max ? (max - min) / max : 0;
    if (r > g && g > b && sat > 0.12 && sat < 0.4 && max > 170) { rs.push(r); gs.push(g); bs.push(b); }
  }
  if (rs.length < Math.max(10, rows * width * 0.01)) return null;
  const mid = (xs) => xs.sort((p, q) => p - q)[xs.length >> 1];
  return [mid(rs), mid(gs), mid(bs)];
}

/**
 * Recolours `rgba` (Uint8ClampedArray or Uint8Array of r,g,b,a bytes, `width` x `height`) in place and returns it.
 *   hex             "#RRGGBB"; null or anything else leaves the picture untouched
 *   keepDarkHead    0..1: dark pixels in this top share of the picture stay as they are (a groom's black hair or songkok; not a bride's tudung)
 *   keepDarkFeet    the same for the bottom share: black shoes stay black
 */
export function recolourOutfit(rgba, hex, { width, height, keepDarkHead = 0, keepDarkFeet = 0.06 } = {}) {
  const target = parseHex(hex);
  if (!target || !width || !height) return rgba;
  const skin = skinColour(rgba, width, height);
  const headRows = Math.floor(height * keepDarkHead);
  const feetFrom = Math.floor(height * (1 - keepDarkFeet));
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] === 0) continue;
    const R = rgba[i], G = rgba[i + 1], B = rgba[i + 2];
    const r = R / 255, g = G / 255, b = B / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const warm = R >= G && G >= B;                                         // between red and yellow: skin, gold and cream
    const light = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (warm && sat > GOLD_SAT) continue;                                  // gold detail
    const row = Math.floor(i / 4 / width);
    if (light < 0.28 && ((headRows && row < headRows) || row >= feetFrom)) continue;   // dark hair, songkok, shoes
    let outfit = 1;
    if (skin) {
      const d = Math.hypot(R - skin[0], G - skin[1], B - skin[2]);
      outfit = Math.min(1, Math.max(0, (d - SKIN_NEAR) / (SKIN_FAR - SKIN_NEAR)));
    }
    if (outfit === 0) continue;
    const k = FLOOR + (1 - FLOOR) * Math.min(1, light * 1.04);
    rgba[i] = Math.round(R + (target[0] * k - R) * outfit);
    rgba[i + 1] = Math.round(G + (target[1] * k - G) * outfit);
    rgba[i + 2] = Math.round(B + (target[2] * k - B) * outfit);
  }
  return rgba;
}

/** Per model: where its black hair or songkok is (the top share of the picture), so it is not tinted with the outfit. The other models have none. */
export const MODEL_RECOLOUR = { "groom-1": { keepDarkHead: 0.13 }, "groom-3": { keepDarkHead: 0.12 } };
export const recolourOptionsFor = (modelId) => MODEL_RECOLOUR[modelId] || {};
