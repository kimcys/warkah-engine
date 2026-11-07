// Gives an English card English wording for the defaults the couple did not write themselves (see i18n/en-defaults.ts).
import { eventSchema } from "./event-schema";
import { EN_DEFAULTS } from "./i18n/en-defaults";

// The Malay default of each path, read from the schema so the two can never drift apart.
const MS_DEFAULTS: Record<string, unknown> = {
  "host.inviteRelation": eventSchema.shape.host.shape.inviteRelation.parse(undefined),
  ...Object.fromEntries(Object.entries(eventSchema.shape.text.parse(undefined)).map(([k, v]) => [`text.${k}`, v])),
  "ayat.malay": eventSchema.shape.ayat.parse(undefined).malay,
  "dressCode.title": eventSchema.shape.dressCode.unwrap().shape.title.parse(undefined),
  defaultWishes: eventSchema.shape.defaultWishes.parse(undefined)
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Returns a copy of `data` with English defaults where an English card still has the Malay default. */
export function localise<T extends Record<string, any>>(data: T, lang: "ms" | "en"): T {
  if (lang !== "en") return data;
  const out: any = structuredClone(data);
  for (const [path, en] of Object.entries(EN_DEFAULTS)) {
    const keys = path.split(".");
    const last = keys.pop()!;
    let parent = out;
    for (const k of keys) { parent = parent?.[k]; if (parent === undefined) break; }
    if (parent && last in parent && same(parent[last], MS_DEFAULTS[path])) parent[last] = en;
  }
  return out;
}
