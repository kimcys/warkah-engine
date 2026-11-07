// RFC 7386 JSON merge patch, shared by the builder's server (applies a saved patch) and the browser (collects edits before sending them).
// Objects merge, null removes a key, anything else (including a list) replaces. Plain JavaScript (see sample-merge.js for why).

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

export function mergePatch(target, patch) {
  if (!isObject(patch)) return patch;
  const out = isObject(target) ? { ...target } : {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) delete out[key];
    else out[key] = mergePatch(out[key], value);
  }
  return out;
}

/** A patch that changes nothing in a draft? (used to skip saving an edit that was typed and then undone) */
export function isNoop(draft, patch) {
  return JSON.stringify(mergePatch(draft, patch)) === JSON.stringify(draft);
}
