// Shared helpers for the npm scripts.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
export const EVENTS_DIR = join(ROOT, "events");

export function listEvents() {
  return readdirSync(EVENTS_DIR).filter((name) => existsSync(join(EVENTS_DIR, name, "event.json")));
}

export function readEvent(slug) {
  if (!slug) fail("Name the client, e.g.  npm run dev -- ezzan-nadiah\nClients: " + listEvents().join(", "));
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) fail(`"${slug}" is not a valid client name (lowercase letters, numbers and dashes).`);
  const file = join(EVENTS_DIR, slug, "event.json");
  if (!existsSync(file)) fail(`events/${slug}/event.json not found.\nClients: ${listEvents().join(", ")}`);
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    fail(`events/${slug}/event.json is not valid JSON: ${error.message}`);
  }
}

export function readWarkahConfig() {
  return JSON.parse(readFileSync(join(ROOT, "warkah.config.json"), "utf8"));
}

function copyInto(from, to) {
  if (!existsSync(from)) return;
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    if (name === ".DS_Store" || name === ".keep") continue;
    cpSync(join(from, name), join(to, name), { recursive: true, force: true });
  }
}

// Builds .stage/<slug>/ = the public folder Astro serves for this one card:
//   /core, /warkah      shared files (public/)
//   /theme              the theme's files, then the client's overrides (events/<slug>/theme/)
//   /event              the client's photos, song, QR codes (events/<slug>/assets/)
// Only this client's files are included, so no other couple's photos end up on their site.
export function stage(slug, event) {
  const themeDir = join(ROOT, "src", "themes", event.theme, "public");
  if (!existsSync(themeDir)) fail(`Theme "${event.theme}" not found (src/themes/${event.theme}/public).`);

  const out = join(ROOT, ".stage", slug);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  copyInto(join(ROOT, "public"), out);
  copyInto(themeDir, join(out, "theme"));
  copyInto(join(EVENTS_DIR, slug, "theme"), join(out, "theme"));
  copyInto(join(EVENTS_DIR, slug, "assets"), join(out, "event"));
  return out;
}

export function sizeOf(dir) {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const info = statSync(path);
    total += info.isDirectory() ? sizeOf(path) : info.size;
  }
  return total;
}

export function run(command, args, env = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: "inherit", shell: process.platform === "win32", env: { ...process.env, ...env } });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolvePromise() : reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`))));
  });
}

export function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}
