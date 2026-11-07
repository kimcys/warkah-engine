// A fingerprint of everything that decides what a built card looks like: the themes and components (src/), the card's own scripts (public/core), the
// build's dependencies and settings. The build server sends it to Warkah Kad with every call, and a published card records the one it was built with,
// so Warkah Kad can tell which live cards were built by an older engine and rebuild them ("live card updates").
// Pure over the files: the same files give the same answer on any machine, in or out of Docker (no git needed).
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const PARTS = ["src", join("public", "core"), "package-lock.json", "warkah.config.json", "astro.config.mjs", join("scripts", "lib.mjs"), join("scripts", "run.mjs")];

function* files(path) {
  if (!existsSync(path)) return;
  if (!statSync(path).isDirectory()) { yield path; return; }
  for (const name of readdirSync(path).sort()) yield* files(join(path, name));
}

/** @param {string} root the engine's folder */
export function engineVersion(root) {
  const hash = createHash("sha256");
  for (const part of PARTS) for (const file of files(join(root, part))) {
    hash.update(relative(root, file).split("\\").join("/")).update("\0").update(readFileSync(file)).update("\0");
  }
  return hash.digest("hex").slice(0, 16);
}
