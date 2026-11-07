// What the builder tells a customer about their draft: what is wrong, what is still missing, whether they may go on to publish.
// The browser (live, as they type) and the API (on every save, and before publishing) both call this, so they always agree.
//
//   problems   a value they wrote is not acceptable (Malay message, field name, path)
//   missing    something required is still empty, in form order, with the step to jump to
//   locked     a switch they turned on that their package does not include (or that is not offered)
//   ready      no problems, nothing missing, nothing locked
import { BUILDER_STEPS, labelFor } from "./builder-steps";
import { FEATURES, OFFERED_FEATURES } from "./features";
import { ADDON_KEYS, TIERS, type Tier } from "./tiers";
import { THEME_KEYS, type ThemeKey } from "./theme-keys";
import { validateEvent, type Problem } from "./validate";
import { previewDraft } from "./sample";
import { completeDraft } from "./system-fields.js";
import { sanitizeDraft } from "./sanitize.js";
import { getPath, hasValue } from "./paths.js";
import { slugProblem } from "./slug.js";
import { checkUrl } from "./urls.js";
import type { Lang } from "./i18n";

export interface Missing { path: string; label: string; step: string; reason: "required" | "feature" | "asset" }
export interface Locked { feature: string; label: string; reason: "tier" | "not_offered"; addon?: boolean }   // addon: it can be bought on its own
export interface DraftStatus {
  problems: Problem[];
  missing: Missing[];
  locked: Locked[];
  changes: { path: string; reason: string }[];       // what the sanitiser cleaned (shown as a gentle note)
  features: Record<string, boolean>;                  // what is really on after the package is applied
  completeness: { done: number; total: number };
  ready: boolean;
}
export interface StatusOptions {
  tier?: Tier["id"];
  /** Add-ons the card has bought (keys of ADDONS), on top of its tier. */
  addons?: string[];
  lang?: Lang;
  slug?: string;
  /** Paths of the files uploaded for this card ("gallery/1.webp", "portrait/groom.webp" ...). Leave out to skip the file checks. */
  assets?: string[];
}

/** Most rows a list may have. */
export const LIMITS: Record<string, number> = { aturcara: 12, contacts: 6, gallery: 12, "gifts.items": 20 };

// Data a switched-off feature owns: problems under these paths are ignored while the switch is off.
const OWNED: Record<string, string[]> = { gifts: ["gifts"], duitnow: ["duitnow"], dressCode: ["dressCode"], music: ["music"], gallery: ["gallery"], programme: ["aturcara"], ayat: ["ayat"], portraits: ["portraits"] };

const stepOf = (path: string) => BUILDER_STEPS.find((s) => s.fields.some((f) => f.path === path || path.startsWith(f.path + ".")))?.id ?? "tambahan";
const featureLabel = (key: string) => FEATURES.find((f) => f.key === key)?.label ?? key;

/** The switches that really apply: the defaults, the customer's choices, minus anything their package does not include. */
export function effectiveFeatures(draft: any, tier: Tier["id"] = "basic", addons: string[] = []): Record<string, boolean> {
  const allowed = TIERS.find((t) => t.id === tier)?.features ?? [];
  const out: Record<string, boolean> = {};
  for (const f of FEATURES) {
    const wanted = draft?.features && f.key in draft.features ? !!draft.features[f.key] : f.default;
    const permitted = f.offered === false ? false : allowed === "all" || (allowed as string[]).includes(f.key) || addons.includes(f.key);
    out[f.key] = wanted && permitted;
  }
  return out;
}

const isObject = (v: unknown): v is Record<string, any> => !!v && typeof v === "object" && !Array.isArray(v);
const list = (v: unknown): any[] => (Array.isArray(v) ? v : []);

export function draftStatus(input: unknown, options: StatusOptions = {}): DraftStatus {
  const tier = options.tier ?? "basic";
  const cleaned = sanitizeDraft(isObject(input) ? input : {});
  const { changes } = cleaned;
  const draft: any = cleaned.draft;
  if (!isObject(draft.features)) delete draft.features;                       // a customer (or a bug) may send anything
  const lang: Lang = draft.lang === "en" || options.lang === "en" ? "en" : "ms";
  const wanted: Record<string, boolean> = Object.fromEntries(FEATURES.map((f) => [f.key, draft.features && f.key in draft.features ? !!draft.features[f.key] : f.default]));
  const features = effectiveFeatures(draft, tier, options.addons);
  const assets = options.assets ? new Set(options.assets) : null;

  // --- locked: switched on by the customer but not theirs to use
  const locked: Locked[] = [];
  for (const f of FEATURES) {
    if (!draft.features || !draft.features[f.key]) continue;                 // only what they explicitly turned on
    if (f.offered === false) locked.push({ feature: f.key, label: f.label, reason: "not_offered" });
    else if (!features[f.key]) locked.push({ feature: f.key, label: f.label, reason: "tier", ...(ADDON_KEYS.includes(f.key as any) ? { addon: true } : {}) });
  }

  // --- missing
  const missing: Missing[] = [];
  const need = (path: string, label: string, reason: Missing["reason"], step = stepOf(path)) => missing.push({ path, label, step, reason });
  let total = 0;
  const themeOk = THEME_KEYS.includes(draft.theme);
  for (const step of BUILDER_STEPS) {
    for (const field of step.fields) {
      if (!field.required) continue;
      if (field.feature && !features[field.feature]) continue;               // hidden: not asked, not counted
      total++;
      const present = field.path === "theme" ? themeOk : hasValue(getPath(draft, field.path));
      if (!present) need(field.path, field.label, "required", step.id);
    }
  }
  // data every switched-on feature must come with (a ticked gallery with no photo would publish an empty page)
  const featureData: [string, string, string, boolean][] = [
    ["gallery", "gallery", "Galeri (sekurang-kurangnya satu gambar)", hasValue(draft.gallery)],
    ["gifts", "gifts.items", "Senarai hadiah (sekurang-kurangnya satu)", hasValue(draft.gifts?.items)],
    ["duitnow", "duitnow.image", labelFor("duitnow.image") ?? "Kod QR DuitNow", hasValue(draft.duitnow?.image)],
    ["dressCode", "dressCode.colors", "Tema warna (sekurang-kurangnya satu warna)", hasValue(draft.dressCode?.colors)],
    ["music", "music.src", labelFor("music.src") ?? "Lagu latar", hasValue(draft.music?.src)]
  ];
  for (const [feature, path, label, present] of featureData) {
    if (!features[feature]) continue;
    total++; if (!present) need(path, label, "feature");
  }
  if (features.music && draft.music?.src) {
    for (const p of ["music.title", "music.artist"]) { total++; if (!hasValue(getPath(draft, p))) need(p, labelFor(p) ?? p, "feature", "gaya"); }
  }
  // uploaded files the card will point at
  if (assets) {
    const files: [string, string][] = [];
    if (typeof draft.meta?.ogImage === "string" && draft.meta.ogImage) files.push([draft.meta.ogImage, "Gambar pratonton (bila pautan dikongsi)"]);   // an empty cover is already reported as a missing field
    if (features.portraits) files.push(["portrait/groom.webp", "Potret pengantin lelaki"], ["portrait/bride.webp", "Potret pengantin perempuan"]);
    if (features.gallery) list(draft.gallery).forEach((g: any, i: number) => files.push([typeof g?.src === "string" ? g.src : "", `Galeri, gambar ${i + 1}`]));
    if (features.duitnow && draft.duitnow?.image) files.push([draft.duitnow.image, "Kod QR DuitNow"]);
    if (features.music && draft.music?.src) files.push([draft.music.src, "Lagu latar"]);
    if (features.gifts) list(draft.gifts?.items).forEach((g: any, i: number) => files.push([typeof g?.id === "string" ? `gifts/${g.id}.webp` : "", `Gambar hadiah ${i + 1}`]));
    for (const [path, label] of files) {
      total++;
      if (!path || !assets.has(path)) need(path || "assets", label, "asset", /portrait|cover|ogImage/.test(path) || /Galeri|pratonton|Potret/.test(label) ? "gambar" : /music|Lagu/.test(path + label) ? "gaya" : "tambahan");
    }
  }

  // --- problems: what the schema says about the card once sample filler and system fields are added, plus links, limits and the address
  const theme: ThemeKey = themeOk ? draft.theme : "lover";
  const problems: Problem[] = [];
  try {
    const completed = completeDraft(previewDraft({ ...draft, features }, theme, lang), { slug: options.slug || "kad-semakan", lang });
    const result = validateEvent(completed);
    if (!result.ok) {
      const requiredPaths = new Set(missing.map((m) => m.path));
      for (const p of result.problems) {
        if (requiredPaths.has(p.path)) continue;                                // already listed as missing
        if (Object.entries(OWNED).some(([feature, prefixes]) => !wanted[feature] && prefixes.some((x) => p.path === x || p.path.startsWith(x + ".")))) continue;
        problems.push(p);
      }
    }
  } catch {
    problems.push({ path: "", field: "Draf", message: "Draf mengandungi data yang tidak sah. Sila semak semula setiap ruangan." });
  }
  const replace = (path: string, field: string, message: string) => {
    const i = problems.findIndex((p) => p.path === path);
    if (i >= 0) problems[i] = { path, field, message }; else problems.push({ path, field, message });
  };
  const linkChecks: [string, "maps" | "waze" | "shop"][] = [["venue.maps", "maps"], ["venue.waze", "waze"]];
  if (features.gifts) list(draft.gifts?.items).forEach((_: any, i: number) => linkChecks.push([`gifts.items.${i}.url`, "shop"]));
  for (const [path, kind] of linkChecks) {
    const value = getPath(draft, path);
    if (!hasValue(value)) continue;
    const r = checkUrl(kind, value);
    if (!r.ok) replace(path, labelFor(path) ?? path, r.problem);
  }
  for (const [path, max] of Object.entries(LIMITS)) {
    const list = getPath(draft, path);
    if (Array.isArray(list) && list.length > max && features[path === "aturcara" ? "programme" : path.split(".")[0]] !== false) replace(path, labelFor(path) ?? path, `${labelFor(path) ?? path} terlalu banyak (maksimum ${max}).`);
  }
  if (options.slug !== undefined) {
    const sp = slugProblem(options.slug);
    if (sp) replace("slug", "Alamat kad", sp);
  }

  const stepIndex = (id: string) => { const i = BUILDER_STEPS.findIndex((x) => x.id === id); return i < 0 ? 99 : i; };
  missing.sort((x, y) => stepIndex(x.step) - stepIndex(y.step));   // stable: form order inside a step
  const done = Math.max(0, total - missing.length);
  return { problems, missing, locked, changes, features, completeness: { done, total }, ready: problems.length === 0 && missing.length === 0 && locked.length === 0 };
}
