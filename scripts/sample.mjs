// npm run sample -- <theme> [--lang en] [--builder] [--build]
// Writes events/sample-<theme>-<lang>/ (the theme's sample card, with its sample photos) so you can look at it:
//   npm run sample -- lover                      then   npm run dev -- sample-lover-ms
//   npm run sample -- lover --lang en --build    writes it and builds dist/sample-lover-en/
//   --builder   give it the system fields exactly as the builder would (served from the card domain /<slug>/, no Firebase site)
// Folders starting with "sample-" are ignored by `build:all` and by git.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, fail, run } from "./lib.mjs";
import { writeSample } from "./sample-lib.mjs";

const args = process.argv.slice(2);
const langAt = args.indexOf("--lang");
const lang = langAt >= 0 ? args[langAt + 1] : "ms";
const theme = args.find((a, i) => !a.startsWith("--") && (langAt < 0 || i !== langAt + 1));
if (!theme || !existsSync(join(ROOT, "src", "themes", theme, "sample.json"))) fail("Use: npm run sample -- <theme> [--lang en] [--builder] [--build]\nThemes: royal-gold, lover, glasshouse, enchanted-garden");
if (!["ms", "en"].includes(lang)) fail('--lang must be "ms" or "en"');

const { slug, photos } = writeSample(theme, lang, { builder: args.includes("--builder") });
console.log(`✔ events/${slug}/  (${theme}, ${lang}, photos: ${photos})`);
if (args.includes("--build")) await run("node", [join("scripts", "run.mjs"), "build", slug]);
