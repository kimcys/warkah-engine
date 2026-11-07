// Card addresses: https://<card domain>/<slug>/ (kad.aimanhakimcy.com for now, see system-fields.js). A slug must never collide with something else at the top of that domain
// (the builder's own pages, the API, shared folders) or with Warkah Kenang's routes (same list as warkah-kenang/shared/slugs.ts, plus ours).
// Plain JavaScript so the builder's Worker, the build scripts and tests can all use it.

export const RESERVED_SLUGS = [
  // Kenang's list
  "api", "media", "site", "papan", "app", "studio", "w", "join", "assets", "brand", "admin", "login", "upgrade", "help", "terms", "privacy", "harga", "pricing", "demo", "privasi", "terma",
  // ours
  "kad", "builder", "dashboard", "status", "new", "edit", "preview", "publish", "catalogue", "samples", "sample", "thumbnails", "models", "core", "theme", "event", "warkah", "index", "favicon", "robots", "sitemap", "static", "public", "dist"
];

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;      // 3 to 40 characters, no dash at either end

/** null when the slug is fine, otherwise a Malay sentence saying what to change. */
export function slugProblem(slug) {
  if (typeof slug !== "string" || slug.length < 3) return "Alamat kad mesti sekurang-kurangnya 3 huruf atau nombor.";
  if (slug.length > 40) return "Alamat kad terlalu panjang (maksimum 40).";
  if (!/^[a-z0-9-]+$/.test(slug)) return "Alamat kad hanya boleh guna huruf kecil, nombor dan tanda sengkang (-).";
  if (!SLUG_RE.test(slug)) return "Alamat kad tidak boleh bermula atau berakhir dengan tanda sengkang (-).";
  if (RESERVED_SLUGS.includes(slug) || slug.startsWith("sample-")) return "Alamat ini dikhaskan. Sila pilih yang lain.";
  return null;
}

export const isValidSlug = (slug) => slugProblem(slug) === null;

const plain = (text) => String(text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * A free address from the couple's names, in the order of the card: "aisyah-hafiz", then "aisyah-hafiz-2" ... when taken.
 * `taken` is a list (or Set) of slugs already in use.
 */
export function suggestSlug(first, second, taken = []) {
  const used = new Set(taken);
  let base = [plain(first), plain(second)].filter(Boolean).join("-").slice(0, 36).replace(/-+$/, "");
  if (base.length < 3) base = "kad-" + (base || "kami");
  for (let n = 1; n < 1000; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    if (isValidSlug(slug) && !used.has(slug)) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}
