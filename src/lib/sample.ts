// Sample content per theme and language (see sample-merge.js for the rules). Used by the builder's live preview and by `npm run sample`.
import { sampleEvent, fillWithSample } from "./sample-merge.js";
import baseMs from "../../samples/base.ms.json";
import baseEn from "../../samples/base.en.json";
import royalGold from "../themes/royal-gold/sample.json";
import lover from "../themes/lover/sample.json";
import glasshouse from "../themes/glasshouse/sample.json";
import enchantedGarden from "../themes/enchanted-garden/sample.json";
import type { ThemeKey } from "./theme-keys";
import type { Lang } from "./i18n";

const BASE = { ms: baseMs, en: baseEn } as const;
const THEME_SAMPLES = { "royal-gold": royalGold, lover, glasshouse, "enchanted-garden": enchantedGarden } as const;

/** The full sample card for a theme: valid event.json content, every feature switched on, ready to build. */
export function sampleFor(theme: ThemeKey, lang: Lang = "ms") {
  return sampleEvent(BASE[lang], THEME_SAMPLES[theme]) as Record<string, any>;
}

/** Which folder of sample photos suits the theme: samples/assets/<set>/ ("modern" or "malay"). */
export const assetSetFor = (theme: ThemeKey): string => THEME_SAMPLES[theme].assetSet;

/** A customer's draft with its empty fields filled from the sample (their choices are never replaced). */
export function previewDraft(draft: Record<string, any>, theme: ThemeKey, lang: Lang = "ms") {
  return fillWithSample(draft, sampleFor(theme, lang)) as Record<string, any>;
}
