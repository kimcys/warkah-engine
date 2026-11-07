// npm run sample -- <theme> [--lang en] [--build]
// Writes events/sample-<theme>-<lang>/ (the theme's sample card, with its sample photos) so you can look at it:
//   npm run sample -- lover                      then   npm run dev -- sample-lover-ms
//   npm run sample -- lover --lang en --build    writes it and builds dist/sample-lover-en/
// Folders starting with "sample-" are ignored by `build:all` and by git.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { EVENTS_DIR, ROOT, fail, run } from "./lib.mjs";
import { sampleEvent } from "../src/lib/sample-merge.js";

const args = process.argv.slice(2);
const theme = args.find((a) => !a.startsWith("--") && a !== args[args.indexOf("--lang") + 1]);
const lang = args.includes("--lang") ? args[args.indexOf("--lang") + 1] : "ms";
if (!theme || !existsSync(join(ROOT, "src", "themes", theme, "sample.json"))) fail("Use: npm run sample -- <theme> [--lang en] [--build]\nThemes: royal-gold, lover, glasshouse, enchanted-garden");
if (!["ms", "en"].includes(lang)) fail('--lang must be "ms" or "en"');

const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const themeSample = read(`src/themes/${theme}/sample.json`);
const event = sampleEvent(read(`samples/base.${lang}.json`), themeSample);
event.hosting = { ...event.hosting, site: `sample-${theme}` };

const slug = `sample-${theme}-${lang}`;
const dir = join(EVENTS_DIR, slug);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "event.json"), JSON.stringify(event, null, 2));
cpSync(join(ROOT, "samples", "assets", themeSample.assetSet), join(dir, "assets"), { recursive: true });
console.log(`✔ events/${slug}/  (${theme}, ${lang}, photos: ${themeSample.assetSet})`);
if (args.includes("--build")) await run("node", [join("scripts", "run.mjs"), "build", slug]);
