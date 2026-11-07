// The theme contract. Every src/themes/<name>/theme.ts calls defineTheme({...}); the result is what the card reads.
// Missing keys, a missing standard page or a missing #openInvite stop the build with a message naming the theme.
import { REQUIRED_SECTIONS, type SectionLayout } from "../lib/sections";

// Ambience + behaviour read by public/core/card.js (any key left out takes the default below).
export interface ThemeClient {
  scenes: boolean;          // full-page scenes behind the pages (true for layout "pages")
  fairyLights: number;      // number of sparkles (0 = none)
  petals: string[];         // petal colours ([] = no petals)
  openingDelay: number;     // ms between "Buka Kad" and the card appearing
  wishesPerPage: number;    // ucapan shown per page in the wishes list
}

// A colour option a client can choose (event.json "palette"). "classic" is always the theme as designed; every other id is listed in
// the theme's `palettes`. Colours come from overriding the theme's CSS variables; `tint` shifts the artwork behind the pages.
export interface Palette {
  label: string;                        // shown to the customer (Malay)
  labelEn: string;                      // the same in English
  swatch: [string, string, string];     // three colours for the picker chip: main, accent, soft
  vars: Record<string, string>;         // CSS variables to override, e.g. { "--rose": "#7a5cc4" }
  tint?: { hue?: number; saturate?: number; brightness?: number };   // CSS filter on the scene artwork (degrees / multipliers)
  themeColor?: string;                  // browser bar colour
  petals?: string[];                    // falling petal colours
}

// How the theme is presented in the builder's theme chooser (next to its thumbnails in samples/thumbnails/<theme>/).
export interface ThemeDisplay {
  label: { ms: string; en: string };
  description: { ms: string; en: string };      // one sentence: the look, and who it suits
  culture: "malay" | "modern";                  // decides which models and sample photos are suggested
}

export interface ThemeInput {
  name: string;
  display: ThemeDisplay;
  Opening: any;             // must contain a #openInvite button
  Backdrop: any;            // scene layers + .fairy-lights + .petal-field
  layout: "pages" | "scroll";   // "pages" = one snapping page per screen; "scroll" = one continuous scroll
  scroll?: "pages" | "free";    // only for themes that offer both (Glasshouse); adds body class scroll-<value>
  themeColor: string;
  fonts: string;            // Google Fonts URL
  preload?: string[];       // theme images to preload (relative to /theme/)
  stylesheet?: string;      // default "style.css"
  components?: Partial<Record<string, any>>;   // pages this theme draws itself (id → component); others use the shared page
  sections: SectionLayout[];
  client?: Partial<ThemeClient>;
  // Bride and groom figures (models/library.json). A theme either:
  //  - names defaultModels: every card shows a figure (the client can pick another in couple.model), or
  //  - draws the couple into its scene art (no defaultModels): that art is used until the client picks a model.
  defaultModels?: { groom: string; bride: string };
  // The theme as designed (palette "classic"): three colours for the picker chip.
  classicSwatch: [string, string, string];
  // Colour options besides "classic" (see Palette). Every theme should offer a few.
  palettes?: Record<string, Palette>;
  // Figure-free scenes to show behind a chosen model, for themes whose "groom"/"bride" scenes have the couple painted in.
  modelScenes?: { groom: string; bride: string };
}

const CLIENT_DEFAULTS: ThemeClient = { scenes: false, fairyLights: 0, petals: [], openingDelay: 250, wishesPerPage: 2 };

// Raw text of every theme's Opening.astro, to check the #openInvite button exists.
const openings = import.meta.glob("./*/Opening.astro", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

export function defineTheme(key: string, input: ThemeInput) {
  const fail = (message: string) => { throw new Error(`Theme "${input.name}": ${message}`); };

  const ids = input.sections.map((s) => s.id);
  const missing = REQUIRED_SECTIONS.filter((id) => !ids.includes(id));
  if (missing.length) fail(`sections is missing the standard page(s): ${missing.join(", ")}`);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) fail(`sections lists a page twice: ${[...new Set(dupes)].join(", ")}`);
  if (input.sections.some((s) => s.scene) && input.layout !== "pages") fail(`only layout "pages" can set a scene per page`);

  const opening = openings[`./${key}/Opening.astro`];
  if (!opening) fail(`src/themes/${key}/Opening.astro not found`);
  if (!opening.includes('id="openInvite"')) fail(`Opening.astro must contain a button with id="openInvite"`);

  for (const lang of ["ms", "en"] as const) {
    if (!input.display?.label?.[lang] || !input.display?.description?.[lang]) fail(`display needs a label and a description in "${lang}"`);
  }
  for (const [id, palette] of Object.entries(input.palettes ?? {})) {
    if (!palette.labelEn) fail(`palette "${id}" needs labelEn (its English name)`);
    if (id === "classic") fail(`palette "classic" is reserved for the theme as designed`);
    if (!/^[a-z][a-z0-9-]*$/.test(id)) fail(`palette id "${id}" must be lowercase letters, digits and dashes`);
    for (const name of Object.keys(palette.vars)) if (!/^--[a-z0-9-]+$/.test(name)) fail(`palette "${id}": "${name}" is not a CSS variable name`);
  }

  const client: ThemeClient = { ...CLIENT_DEFAULTS, scenes: input.layout === "pages", ...input.client };
  return {
    ...input,
    stylesheet: input.stylesheet ?? "style.css",
    preload: input.preload ?? [],
    components: input.components ?? {},
    palettes: input.palettes ?? {},
    bodyClass: `layout-${input.layout}${input.scroll ? ` scroll-${input.scroll}` : ""}`,
    client
  };
}
