// Turns a customer's draft into the event.json of a preview card. Used by `npm run preview` (a laptop) and `npm run build-job` (the build server).
//   1. empty fields are filled from the theme's sample (so the card is never blank); their own words, choices and switches are kept
//   2. the package is applied: a switch outside the customer's tier is off, exactly as on the real card
//   3. the system fields are added (completeDraft); the card is marked `preview` (ribbon, noindex, demo store: no guest data kept)
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib.mjs";
import { fillWithSample, sampleEvent } from "../src/lib/sample-merge.js";
import { withBuilderModels } from "../src/lib/builder-models.js";
import { completeDraft } from "../src/lib/system-fields.js";
import { publishEvent, referencedFiles } from "../src/lib/publish.js";
import { effectiveFeatures } from "../kit/index.js";


export class DraftError extends Error {}

/** { event, assetSet, theme } for a draft. `slug` names the build; `base` is where it will be served ("/" on a laptop). */
export function previewEventFor(draft, { slug, tier = "basic", addons = [], base = "/" }) {
  if (!draft || typeof draft !== "object") throw new DraftError("The draft is not an object.");
  if (!draft.theme) throw new DraftError('The draft needs a "theme" (royal-gold, lover, glasshouse or enchanted-garden).');
  if (!/^[a-z0-9-]+$/.test(draft.theme)) throw new DraftError(`Unknown theme "${draft.theme}".`);
  const themeSampleFile = join(ROOT, "src", "themes", draft.theme, "sample.json");
  if (!existsSync(themeSampleFile)) throw new DraftError(`Unknown theme "${draft.theme}".`);
  const lang = draft.lang === "en" ? "en" : "ms";
  const themeSample = JSON.parse(readFileSync(themeSampleFile, "utf8"));
  const sample = sampleEvent(JSON.parse(readFileSync(join(ROOT, "samples", `base.${lang}.json`), "utf8")), themeSample);
  const filled = fillWithSample(withBuilderModels(structuredClone(draft)), sample);   // the customer's models, or the theme's pair: never the sample's
  filled.features = effectiveFeatures(draft, tier, addons);
  const event = completeDraft(filled, { slug, lang });
  event.preview = true;
  event.store = { mode: "demo" };                       // a preview never keeps a guest's RSVP, wish or gift
  event.hosting = { site: slug, base };
  return { event, assetSet: themeSample.assetSet, lang };
}

/** { event } for the REAL card (see src/lib/publish.js). */
export function publishEventFor(draft, { slug, tier = "basic", addons = [] }) {
  if (!draft || typeof draft !== "object") throw new DraftError("The draft is not an object.");
  if (!draft.theme || !/^[a-z0-9-]+$/.test(draft.theme)) throw new DraftError('The draft needs a "theme".');
  const themeSampleFile = join(ROOT, "src", "themes", draft.theme, "sample.json");
  if (!existsSync(themeSampleFile)) throw new DraftError(`Unknown theme "${draft.theme}".`);
  const lang = draft.lang === "en" ? "en" : "ms";
  const sample = sampleEvent(JSON.parse(readFileSync(join(ROOT, "samples", `base.${lang}.json`), "utf8")), JSON.parse(readFileSync(themeSampleFile, "utf8")));
  try { return { event: publishEvent(draft, sample, { slug, features: effectiveFeatures(draft, tier, addons) }), lang }; } catch (e) { throw new DraftError(e.message); }
}
export { referencedFiles };
