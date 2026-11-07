// The builder's catalogue: everything a customer can choose, read from the code so nothing is listed twice.
// Only written when a build is run with WARKAH_CATALOGUE=1 (npm run catalogue); scripts/run.mjs removes it from normal cards.
import type { APIRoute } from "astro";
import { z } from "astro/zod";
import { themes } from "../themes";
import { THEME_KEYS } from "../lib/theme-keys";
import { FEATURES } from "../lib/features";
import { TIERS } from "../lib/tiers";
import { ASSET_RULES } from "../lib/asset-rules";
import { BUILDER_STEPS } from "../lib/builder-steps";
import { eventSchema } from "../lib/event-schema";
import modelLibrary from "../../models/library.json";

export const GET: APIRoute = () => {
  const catalogue = {
    generated: "by npm run catalogue; do not edit",
    language: "ms",
    themes: THEME_KEYS.map((key) => {
      const t = themes[key];
      return {
        key,
        name: t.name,
        layout: t.layout,
        classic: { label: "Klasik", swatch: t.classicSwatch },
        palettes: Object.entries(t.palettes).map(([id, p]) => ({ id, label: p.label, swatch: p.swatch, tintsArtwork: !!p.tint })),
        defaultModels: t.defaultModels ?? null,
        // true = the theme paints its own couple in the scene art until a model is chosen
        paintedCouple: !t.defaultModels && !!t.modelScenes,
        pages: t.sections.map((s) => s.id)
      };
    }),
    models: modelLibrary.models,
    features: FEATURES,
    tiers: TIERS,
    assetRules: ASSET_RULES,
    steps: BUILDER_STEPS,
    eventJsonSchema: z.toJSONSchema(eventSchema, { io: "input", unrepresentable: "any" })
  };
  return new Response(JSON.stringify(catalogue, null, 2), { headers: { "Content-Type": "application/json" } });
};
