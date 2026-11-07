// Applies the customer's outfit colours (couple.outfit.groom / .bride) to the model pictures staged for their card, so the card ships the recoloured figures.
// Runs after stage() in scripts/run.mjs. Only the staged copies change; the model library is never touched. Does nothing when no colour was chosen.
import { existsSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { modelIdsFor } from "./lib.mjs";
import { parseHex, recolourOptionsFor, recolourOutfit } from "../src/lib/recolour.js";

/** Recolours one picture file in place. Returns false when the colour is not one or the file is missing. */
export async function recolourFile(file, hex, options = {}) {
  if (!parseHex(hex) || !existsSync(file)) return false;
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  recolourOutfit(data, hex, { width: info.width, height: info.height, ...options });
  const out = await sharp(data, { raw: info }).webp({ quality: 90, alphaQuality: 100 }).toBuffer();
  writeFileSync(file + ".tmp", out);
  renameSync(file + ".tmp", file);
  return true;
}

export async function recolourStaged(event, stagedDir) {
  const colours = event.couple?.outfit ?? {};
  if (!colours.groom && !colours.bride) return [];
  const ids = modelIdsFor(event);
  const done = [];
  for (const who of ["groom", "bride"]) {
    const id = ids[who];
    if (id && colours[who] && await recolourFile(join(stagedDir, "models", `${id}.webp`), colours[who], recolourOptionsFor(id))) done.push(`${who}:${id}`);
  }
  return done;
}
