// Dotted paths into a draft ("couple.groom.name", "gallery.2.alt"). Plain JavaScript (see sample-merge.js for why).

export function getPath(obj, path) {
  let value = obj;
  for (const key of path.split(".")) {
    if (value === null || typeof value !== "object") return undefined;
    value = value[key];
  }
  return value;
}

/** Sets a value, creating objects on the way (a numeric key makes an array). Returns the same object. */
export function setPath(obj, path, value) {
  const keys = path.split(".");
  let target = obj;
  keys.forEach((key, i) => {
    if (i === keys.length - 1) { target[key] = value; return; }
    if (target[key] === null || typeof target[key] !== "object") target[key] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    target = target[key];
  });
  return obj;
}

/** true when there is something there: not missing, not "", not an empty list, not an empty object. */
export function hasValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}
