// Two languages for a card: Bahasa Malaysia (the text written in the code) and English. The Malay text IS the key:
//   t("Buka Kad")                      → "Open the card" when the card's language is English, else "Buka Kad"
//   t("Hari ke {n}", { n: 3 })         → placeholders in {braces}
// A missing English entry falls back to the Malay text (nothing breaks) and is reported once per key during the build, so
// `npm run build -- <an English card>` lists exactly what still needs translating.
import EN from "./i18n/en";

export type Lang = "ms" | "en";
export const LANGS: Lang[] = ["ms", "en"];

const reported = new Set<string>();

export function makeT(lang: Lang) {
  return (ms: string, vars?: Record<string, string | number>): string => {
    let text = ms;
    if (lang === "en") {
      const en = (EN as Record<string, string>)[ms];
      if (en === undefined) {
        if (!reported.has(ms)) { reported.add(ms); console.warn(`[i18n] no English for: ${ms}`); }
      } else text = en;
    }
    if (vars) for (const [k, v] of Object.entries(vars)) text = text.split(`{${k}}`).join(String(v));
    return text;
  };
}

/** Strings that public/core/card.js shows (toasts, form messages, button states). Sent to the browser for English cards only. */
export function browserStrings(lang: Lang, keys: string[]): Record<string, string> {
  if (lang !== "en") return {};
  const out: Record<string, string> = {};
  for (const k of keys) {
    const en = (EN as Record<string, string>)[k];
    if (en !== undefined) out[k] = en;
  }
  return out;
}

// Day and month names live in dates.js (plain JS, shared with the builder).
export { DAYS, MONTHS } from "./dates.js";
