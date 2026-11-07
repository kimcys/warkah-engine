// Puts the customer's chosen models on the theme's scene plates, where the painted couple used to stand.
//
// Some themes (Emas Diraja, Rumah Kaca) have the couple painted into their scene pictures. A scene listed in src/themes/<theme>/scene-couples.json has, besides the
// painted picture (bg/<scene>.webp), a CLEAN plate (bg/<scene>-clean.webp: the same picture with no people) and the anchors of the painted pair. For a card that shows
// chosen models, this script lays the models on the clean plate at those anchors and writes the result over bg/<scene>.webp in the card's staged folder, so every page
// that uses the scene shows the customer's own models. Where there is no clean plate yet, or the card has no models, the painted scene is left as it is.
// Runs after stage() and recolourStaged() (the models already carry the customer's outfit colours). Only the staged copies change.
//
//   node scripts/compose-scenes.mjs --standin <theme> <groomId> <brideId> <out folder>   lays models on the PAINTED scenes, to check the anchors by eye
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

sharp.cache(false);   // the models were rewritten (recoloured) a moment ago by this same process: read them afresh
import { ROOT, modelIdsFor } from "./lib.mjs";
import { clipToPlate, placement } from "../src/lib/scene-place.js";

const ALPHA_MIN = 24;

/** The visible outline of a model picture: the box that holds every pixel that is not (nearly) transparent. */
async function outlineOf(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] >= ALPHA_MIN) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  return x1 < 0 ? null : { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

/** A soft shadow on the floor under the feet, so the figure stands on the scene instead of floating. */
function shadowSvg(width, height) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><radialGradient id="g"><stop offset="0" stop-color="#000" stop-opacity="0.38"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs><ellipse cx="${width / 2}" cy="${height / 2}" rx="${width / 2}" ry="${height / 2}" fill="url(#g)"/></svg>`);
}

async function layersFor(modelFile, anchor, plate) {
  const box = await outlineOf(modelFile);
  if (!box) return [];
  const p = placement(anchor, plate, box);
  const resized = await sharp(modelFile).ensureAlpha().extract(box).resize(p.width, p.height).toBuffer();
  const layers = [];
  if (anchor.feet <= 1.0) {                                           // the feet are on the picture: ground them
    const sw = Math.round(p.width * 1.05), sh = Math.max(8, Math.round(p.height * 0.045));
    const clip = clipToPlate({ left: Math.round(anchor.cx * plate.width - sw / 2), top: Math.round(anchor.feet * plate.height - sh / 2), width: sw, height: sh }, plate);
    if (clip) layers.push({ input: await sharp(shadowSvg(sw, sh)).extract({ left: clip.sx, top: clip.sy, width: clip.w, height: clip.h }).png().toBuffer(), left: clip.dx, top: clip.dy });
  }
  const clip = clipToPlate(p, plate);                                 // a picture cropped by the plate's edge (heads or feet off the page) is cut the same way
  if (clip) layers.push({ input: await sharp(resized).extract({ left: clip.sx, top: clip.sy, width: clip.w, height: clip.h }).png().toBuffer(), left: clip.dx, top: clip.dy });
  return layers;
}

/** Lays the models on one plate file and returns the finished picture (webp bytes). */
export async function composeScene(plateFile, scene, groomFile, brideFile) {
  const meta = await sharp(plateFile).metadata();
  const plate = { width: meta.width, height: meta.height };
  const layers = [...(await layersFor(brideFile, scene.bride, plate)), ...(await layersFor(groomFile, scene.groom, plate))];   // the groom in front where their hands meet
  return sharp(plateFile).removeAlpha().composite(layers).webp({ quality: 88 }).toBuffer();
}

const anchorsFor = (theme, root = ROOT) => {
  const file = join(root, "src", "themes", theme, "scene-couples.json");
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
};

/** For a card (event.json) with its staged folder. Returns the scenes it composed. */
export async function composeScenes(event, stagedDir) {
  const anchors = anchorsFor(event.theme);
  const ids = modelIdsFor(event);
  const bgDir = join(stagedDir, "theme", "bg");
  const composed = [];
  for (const [scene, spec] of Object.entries(anchors)) {
    const clean = join(bgDir, `${scene}-clean.webp`);
    if (!existsSync(clean)) continue;                                   // no clean art yet: the painted scene stays
    if (ids.groom && ids.bride) {
      const groomFile = join(stagedDir, "models", `${ids.groom}.webp`), brideFile = join(stagedDir, "models", `${ids.bride}.webp`);
      if (existsSync(groomFile) && existsSync(brideFile)) {
        // a scene with nobody to put in (a tiny distant figure that only needs removing) just takes the clean plate as it is
        const out = spec.plateOnly ? readFileSync(clean) : await composeScene(clean, spec, groomFile, brideFile);
        writeFileSync(join(bgDir, `${scene}.webp`), out);
        composed.push(scene);
      }
    }
    rmSync(clean, { force: true });                                     // the clean plate itself never ships
  }
  return composed;
}

// --standin: models over the painted scenes, written to a folder, to check by eye that they stand where the painted pair stands
if (process.argv[2] === "--standin") {
  const [, , , theme, groomId, brideId, outDir] = process.argv;
  mkdirSync(outDir, { recursive: true });
  for (const [scene, spec] of Object.entries(anchorsFor(theme))) {
    if (spec.plateOnly) continue;
    const plate = join(ROOT, "src", "themes", theme, "public", "bg", `${scene}.webp`);
    const out = await composeScene(plate, spec, join(ROOT, "models", `${groomId}.webp`), join(ROOT, "models", `${brideId}.webp`));
    await sharp(out).toFile(join(outDir, `${theme}-${scene}.webp`));
    console.log("✔", scene);
  }
}
