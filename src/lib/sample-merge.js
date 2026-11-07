// Sample content for the builder preview. Plain JavaScript (no types, no imports) so the builder's Worker, the build scripts and Node tests can all use it.
//
//   sampleEvent(base, themeSample)         the full sample card for one theme and language: the language's base content + the theme's own bits
//   fillWithSample(draft, sample)          a draft with every EMPTY field filled from the sample, so the preview is never blank
//
// "Empty" = missing, null, "" or []. Anything the customer typed is kept. Their choices are never replaced: features (what is switched on),
// theme, palette, lang, hosting, store, package and couple.model stay exactly as in the draft.

const KEEP_AS_DRAFT = ["features", "theme", "palette", "lang", "hosting", "store", "package"];

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

export function fillWithSample(draft, sample, path = "") {
  if (isEmpty(draft)) return structuredClone(sample);
  if (!isObject(draft) || !isObject(sample)) return draft;
  const out = {};
  for (const key of new Set([...Object.keys(sample), ...Object.keys(draft)])) {
    const here = path ? `${path}.${key}` : key;
    if (!path && KEEP_AS_DRAFT.includes(key)) { if (key in draft) out[key] = draft[key]; else if (key !== "features") out[key] = sample[key]; continue; }
    if (key in draft && !(key in sample)) { out[key] = draft[key]; continue; }
    out[key] = fillWithSample(draft[key], sample[key], here);
  }
  return out;
}
