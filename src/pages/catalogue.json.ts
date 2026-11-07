// The builder's catalogue: everything a customer can choose, read from the code so nothing is listed twice.
// Only written when a build is run with WARKAH_CATALOGUE=1 (npm run catalogue); scripts/run.mjs removes it from normal cards.
import type { APIRoute } from "astro";
import { z } from "astro/zod";
import { themes } from "../themes";
import { THEME_KEYS } from "../lib/theme-keys";
import { FEATURES } from "../lib/features";
import { ADDONS, TIERS } from "../lib/tiers";
import { OUTFIT_COLOURS } from "../lib/recolour.js";
import { BUILDER_MODELS } from "../lib/builder-models.js";
import { ASSET_RULES } from "../lib/asset-rules";
import { BUILDER_STEPS } from "../lib/builder-steps";
import { eventSchema } from "../lib/event-schema";
import modelLibrary from "../../models/library.json";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { assetSetFor, sampleFor } from "../lib/sample";
import { CARD_DOMAIN } from "../lib/system-fields.js";
import { RESERVED_SLUGS } from "../lib/slug.js";

// Thumbnails written by `npm run thumbnails` (samples/thumbnails/<theme>/<name>.webp). A missing file is listed as null so a gap is easy to see.
const thumb = (theme: string, name: string) => (existsSync(join(process.cwd(), "samples", "thumbnails", theme, `${name}.webp`)) ? `samples/thumbnails/${theme}/${name}.webp` : null);
const thumbs = (theme: string, name: string) => ({ home: thumb(theme, name), details: thumb(theme, `${name}-details`) });

export const GET: APIRoute = () => {
  const catalogue = {
    generated: "by npm run catalogue; do not edit",
    language: "ms",
    // where builder cards live (https://<cardDomain>/<slug>/), the addresses that cannot be used, and the fields the system fills in
    cardDomain: CARD_DOMAIN,
    reservedSlugs: RESERVED_SLUGS,
    systemFields: ["hosting", "store", "package", "meta"],
    themes: THEME_KEYS.map((key) => {
      const t = themes[key];
      return {
        key,
        name: t.name,
        label: t.display.label,
        description: t.display.description,
        culture: t.display.culture,
        thumbnails: { opening: thumb(key, "opening"), classic: thumbs(key, "classic"), palettes: Object.fromEntries(Object.keys(t.palettes).map((id) => [id, thumbs(key, id)])) },
        layout: t.layout,
        classic: { label: { ms: "Klasik", en: "Classic" }, swatch: t.classicSwatch },
        palettes: Object.entries(t.palettes).map(([id, p]) => ({ id, label: { ms: p.label, en: p.labelEn }, swatch: p.swatch, tintsArtwork: !!p.tint })),
        defaultModels: t.defaultModels ?? BUILDER_MODELS[key] ?? null,
        // true = the theme paints its own couple in the scene art until a model is chosen
        paintedCouple: !t.defaultModels && !!t.modelScenes,
        pages: t.sections.map((s) => s.id),
        // sample content for the preview before the customer types anything (photos: samples/assets/<assetSet>/)
        sample: { assetSet: assetSetFor(key), ms: sampleFor(key, "ms"), en: sampleFor(key, "en") }
      };
    }),
    models: modelLibrary.models,
    features: FEATURES,
    tiers: TIERS,
    addons: ADDONS,
    outfitColours: OUTFIT_COLOURS,
    assetRules: ASSET_RULES,
    steps: BUILDER_STEPS,
    eventJsonSchema: z.toJSONSchema(eventSchema, { io: "input", unrepresentable: "any" })
  };
  return new Response(JSON.stringify(catalogue, null, 2), { headers: { "Content-Type": "application/json" } });
};
