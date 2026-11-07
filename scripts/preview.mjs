// npm run preview -- <draft.json> [--assets <folder>] [--name <slug>] [--build]
// Builds a real preview card from a customer's draft: the same steps the builder's build server runs.
//   1. the draft's empty fields are filled from the theme's sample (so the card is never blank), their own words, choices and switches are kept
//   2. the system fields are added (completeDraft) and the card is marked `preview` (ribbon, noindex, demo store: no guest data kept)
//   3. the sample photos are copied first, then the customer's own files from --assets (same layout: gallery/1.webp, portrait/groom.webp ...) on top
// Writes events/preview-<name>/ (git-ignored, skipped by build:all). With --build it also builds dist/preview-<name>/.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { EVENTS_DIR, ROOT, fail, run } from "./lib.mjs";
import { fillWithSample, sampleEvent } from "../src/lib/sample-merge.js";
import { completeDraft } from "../src/lib/system-fields.js";

const args = process.argv.slice(2);
const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const file = args.find((a, i) => !a.startsWith("--") && !["--assets", "--name"].includes(args[i - 1]));
if (!file || !existsSync(file)) fail("Use: npm run preview -- <draft.json> [--assets <folder>] [--name <slug>] [--build]");

const draft = JSON.parse(readFileSync(file, "utf8"));
if (!draft.theme) fail('The draft needs a "theme" (royal-gold, lover, glasshouse or enchanted-garden).');
const themeSampleFile = join(ROOT, "src", "themes", draft.theme, "sample.json");
if (!existsSync(themeSampleFile)) fail(`Unknown theme "${draft.theme}".`);
const lang = draft.lang === "en" ? "en" : "ms";
const themeSample = JSON.parse(readFileSync(themeSampleFile, "utf8"));
const base = sampleEvent(JSON.parse(readFileSync(join(ROOT, "samples", `base.${lang}.json`), "utf8")), themeSample);

const name = flag("--name") || draft.slug || "draft";
const slug = `preview-${name}`;
const filled = fillWithSample(draft, base);
const event = completeDraft(filled, { slug, lang });
event.preview = true;
event.store = { mode: "demo" };                       // a preview never keeps a guest's RSVP, wish or gift
event.hosting = { site: slug, base: "/" };            // local preview at the root; the build server uses /preview/<token>/

const dir = join(EVENTS_DIR, slug);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "event.json"), JSON.stringify(event, null, 2));
cpSync(join(ROOT, "samples", "assets", themeSample.assetSet), join(dir, "assets"), { recursive: true });
const own = flag("--assets");
if (own) cpSync(resolve(own), join(dir, "assets"), { recursive: true, force: true });
console.log(`✔ events/${slug}/  (${draft.theme}, ${lang}${own ? ", with the customer's files" : ", sample photos"})`);
if (args.includes("--build")) await run("node", [join("scripts", "run.mjs"), "build", slug]);
