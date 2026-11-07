// Sample content for the builder preview. Plain JavaScript (no types, no imports) so the builder's Worker, the build scripts and Node tests can all use it.
//
//   sampleEvent(base, themeSample)         the full sample card for one theme and language: the language's base content + the theme's own bits
//   fillWithSample(draft, sample)          a draft with every EMPTY field filled from the sample, so the preview is never blank
//                                          (except PERSONAL_FIELDS: those are only ever the customer's own)
//
// "Empty" = missing, null, "" or []. Anything the customer typed is kept. Their choices are never replaced: features (what is switched on),
// theme, palette, lang, hosting, store, package and couple.model stay exactly as in the draft.

const KEEP_AS_DRAFT = ["features", "theme", "palette", "lang", "hosting", "store", "package"];

// Fields about the people or the day that must NEVER be copied from the sample into a customer's card (a stranger's hashtag, phone numbers, RSVP date...).
// If the customer left one empty it stays empty, or is derived from their own details (page title and calendar text: see system-fields.js).
export const PERSONAL_FIELDS = ["meta", "calendarDescription", "contacts", "couple.hashtag", "duitnow.accountName", "text", "defaultWishes"];

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isEmpty = (v) => v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);

export function sampleEvent(base, themeSample) {
  const { _comment, assetSet, ...theme } = themeSample;
  const out = structuredClone(base);
  for (const [key, value] of Object.entries(theme)) {
    out[key] = isObject(value) && isObject(out[key]) ? { ...out[key], ...value } : value;
  }
  return out;
}

// A copy of a sample subtree without anything personal inside it (a whole `duitnow` object is cloned when the draft has none: its accountName must not come along).
function withoutPersonal(value, path) {
  if (PERSONAL_FIELDS.includes(path)) return undefined;
  if (Array.isArray(value)) return structuredClone(value);
  if (!isObject(value)) return value;
  const out = {};
  for (const [key, inner] of Object.entries(value)) {
    const kept = withoutPersonal(inner, path ? `${path}.${key}` : key);
    if (kept !== undefined) out[key] = kept;
  }
  return out;
}

export function fillWithSample(draft, sample, path = "") {
  if (PERSONAL_FIELDS.includes(path)) return isEmpty(draft) ? undefined : draft;
  if (isEmpty(draft)) return withoutPersonal(sample, path);
  if (!isObject(draft) || !isObject(sample)) return draft;
  const out = {};
  for (const key of new Set([...Object.keys(sample), ...Object.keys(draft)])) {
    const here = path ? `${path}.${key}` : key;
    if (!path && KEEP_AS_DRAFT.includes(key)) { if (key in draft) out[key] = draft[key]; else if (key !== "features") out[key] = sample[key]; continue; }
    if (key in draft && !(key in sample)) { out[key] = draft[key]; continue; }
    const value = fillWithSample(draft[key], sample[key], here);
    if (value !== undefined) out[key] = value;
  }
  return out;
}
