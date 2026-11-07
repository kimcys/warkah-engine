// Turns a customer's draft into the event.json of the REAL card (publishing). Plain JavaScript, no file access: the build server and the tests both use it.
// Unlike a preview it has no ribbon, keeps guests' RSVPs, wishes and gifts (in Warkah Kad's own store: mode "cloudflare"), is served at https://<card domain>/<slug>/, and never shows a
// sample photo: the customer's photos, gifts and song are theirs alone.
import { fillWithSample } from "./sample-merge.js";
import { withBuilderModels } from "./builder-models.js";
import { completeDraft } from "./system-fields.js";

/** What the customer uploads: never filled from the sample on a real card. */
export const ASSET_KEYS = ["gallery", "portraits", "gifts", "duitnow", "music"];

/**
 *   sample     the theme's sample card (the base for empty words); features   the switches that apply (effectiveFeatures of their package)
 *   api        the site that serves the guest API, when it is not the card's own site (left out: the card and the API share a host)
 * Throws an Error with a plain message when the address is not valid.
 */
export function publishEvent(draft, sample, { slug, features, api }) {
  if (!draft || typeof draft !== "object") throw new Error("The draft is not an object.");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug || "")) throw new Error(`"${slug}" is not a valid address.`);
  const base = structuredClone(sample);
  for (const key of ASSET_KEYS) delete base[key];
  delete base.hosting;                         // the sample's address is not theirs: completeDraft gives the card its own under the card domain
  const filled = fillWithSample(withBuilderModels(structuredClone(draft)), base);   // the customer's models, or the theme's pair: never the sample's
  filled.features = features;
  const event = completeDraft(filled, { slug, lang: draft.lang === "en" ? "en" : "ms" });
  delete event.preview;
  event.store = api ? { mode: "cloudflare", api } : { mode: "cloudflare" };
  return event;
}

/** The files a card refers to in its assets folder (only for the parts that are switched on), as paths like gallery/1.webp. */
export function referencedFiles(event) {
  const on = event.features || {};
  const out = new Set();
  const add = (p) => { if (typeof p === "string" && p && !/^https?:/.test(p)) out.add(p); };
  add(event.meta?.ogImage);
  if (on.portraits !== false) for (const p of Object.values(event.portraits || {})) add(p);
  if (on.gallery !== false) for (const g of event.gallery || []) add(g?.src);
  if (on.gifts) for (const g of event.gifts?.items || []) add(`gifts/${g.id}.webp`);
  if (on.duitnow) add(event.duitnow?.image);
  if (on.music !== false) add(event.music?.src);
  return [...out];
}
