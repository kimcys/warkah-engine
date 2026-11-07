import { draftStatus, effectiveFeatures, LIMITS } from "../src/lib/draft-status";
import { sampleFor } from "../src/lib/sample";

let fails = 0;
const check = (name: string, ok: boolean, extra = "") => { if (!ok) fails++; console.log(ok ? "PASS" : "FAIL", name, extra); };
const clone = (o: any) => structuredClone(o);

// a complete customer draft: the sample's own text, minus everything the system or the sample would fill in
const full: any = sampleFor("lover", "ms");
const { hosting, store, meta, package: pkg, calendarDescription, contacts, text, defaultWishes, gifts: _g, duitnow: _d, dressCode: _c, ...base } = full;
base.meta = { ogImage: "cover/og-preview.jpg" };
base.features = { mempelai: true, countdown: true, programme: true, portraits: true, gallery: true, doa: true, rsvp: true, wishes: true, music: false, ayat: false, venueSign: false, gifts: false, duitnow: false, dressCode: false };
const assets = ["cover/og-preview.jpg", "portrait/groom.webp", "portrait/bride.webp", ...base.gallery.map((g: any) => g.src)];

const ok = draftStatus(base, { tier: "basic", assets, slug: "aisyah-hafiz" });
check("a complete basic draft is ready", ok.ready, JSON.stringify({ p: ok.problems, m: ok.missing, l: ok.locked }));
check("completeness counts everything", ok.completeness.done === ok.completeness.total && ok.completeness.total > 15);

// --- an empty draft
const empty = draftStatus({}, { tier: "basic" });
check("an empty draft is not ready and lists what to fill in, in form order", !empty.ready && empty.missing.length >= 14);
const order = ["pasangan", "majlis", "gaya", "gambar", "tambahan"];
check("missing items carry their step and follow the form order", empty.missing.every((m) => order.includes(m.step)) && empty.missing.map((m) => order.indexOf(m.step)).every((v, i, a) => i === 0 || v >= a[i - 1]), empty.missing.map((m) => m.step).join(","));
check("the theme is among them", empty.missing.some((m) => m.path === "theme"));
check("no schema noise from sample filler on an empty draft", empty.problems.length === 0, JSON.stringify(empty.problems));

// --- missing, one at a time
const without = (path: string) => { const d = clone(base); const keys = path.split("."); let t = d; for (const k of keys.slice(0, -1)) t = t[k]; delete t[keys[keys.length - 1]]; return draftStatus(d, { tier: "basic", assets }); };
check("missing groom name", without("couple.groom.name").missing.some((m) => m.path === "couple.groom.name" && m.step === "pasangan"));
check("missing venue", without("venue.name").missing.some((m) => m.path === "venue.name" && m.step === "majlis"));
check("missing cover", without("meta.ogImage").missing.some((m) => m.path === "meta.ogImage" && m.step === "gambar"));
const noProg = clone(base); noProg.aturcara = [];
check("empty programme is missing while the programme page is on", draftStatus(noProg, { tier: "basic", assets }).missing.some((m) => m.path === "aturcara"));
noProg.features.programme = false;
check("...and not asked for once it is off", draftStatus(noProg, { tier: "basic", assets }).ready);

// --- problems
const bad = clone(base); bad.venue.maps = "https://example.com/x"; bad.venue.waze = "https://maps.google.com/?q=a"; bad.date.start = "tomorrow";
const badStatus = draftStatus(bad, { tier: "basic", assets });
check("a bad Maps link gets the friendly message", /Google Maps/.test(badStatus.problems.find((p) => p.path === "venue.maps")?.message ?? ""));
check("a Maps link in the Waze box is caught", /Waze/.test(badStatus.problems.find((p) => p.path === "venue.waze")?.message ?? ""));
check("a bad date is reported", badStatus.problems.some((p) => p.path === "date.start"));
check("a bad value is a problem, not 'missing'", !badStatus.missing.some((m) => m.path === "venue.maps"));
const tooMany = clone(base); tooMany.contacts = Array.from({ length: LIMITS.contacts + 1 }, (_, i) => ({ name: `N${i}`, role: "Ibu", phone: "012-345 6789" }));
check("too many rows", draftStatus(tooMany, { tier: "basic", assets }).problems.some((p) => p.path === "contacts" && /terlalu banyak/.test(p.message)));
check("a bad address", draftStatus(base, { assets, slug: "admin" }).problems.some((p) => p.path === "slug" && /dikhaskan/.test(p.message)) && draftStatus(base, { assets, slug: "aisyah-hafiz" }).ready);
const evil = clone(base); evil.couple.groom.parentsHtml = "A<script>alert(1)</script>";
const evilStatus = draftStatus(evil, { tier: "basic", assets });
check("the sanitiser's work is reported and the draft stays ready", evilStatus.changes.some((c) => c.path === "couple.groom.parentsHtml") && evilStatus.ready);

// --- tiers and features
const gifts = clone(base); gifts.features.gifts = true;
const g = draftStatus(gifts, { tier: "basic", assets });
check("a feature outside the package is locked", g.locked.some((l) => l.feature === "gifts" && l.reason === "tier") && !g.ready && g.features.gifts === false);
check("...and fine on the full package once its data is there", (() => { const d = clone(gifts); d.gifts = { items: [{ id: "g1", name: "Set", price: "100.00", url: "https://shopee.com.my/x", note: "" }] }; return draftStatus(d, { tier: "full", assets: [...assets, "gifts/g1.webp"] }).ready; })());
const fullGifts = draftStatus(gifts, { tier: "full", assets });
check("a ticked feature without its data is missing (gifts: no items)", fullGifts.missing.some((m) => m.path === "gifts.items" && m.reason === "feature"));
const duit = clone(base); duit.features.duitnow = true;
check("duitnow needs its QR", draftStatus(duit, { tier: "full", assets }).missing.some((m) => m.path === "duitnow.image"));
const music = clone(base); music.features.music = true; music.music = { src: "audio/song.m4a", type: "audio/mp4" };
const ms = draftStatus(music, { tier: "basic", assets });
check("music needs title and artist, and the file", ms.missing.some((m) => m.path === "music.title") && ms.missing.some((m) => m.path === "music.artist") && ms.missing.some((m) => m.reason === "asset" && m.path === "audio/song.m4a"));
const gal = clone(base); gal.gallery = [];
check("a ticked gallery needs a photo", draftStatus(gal, { tier: "basic", assets }).missing.some((m) => m.path === "gallery"));
const kenang = clone(base); kenang.features.kenang = true;
check("Kenang is not offered to builder customers", draftStatus(kenang, { tier: "custom", assets }).locked.some((l) => l.feature === "kenang" && l.reason === "not_offered"));
check("a switched-off feature's bad data is ignored", (() => { const d = clone(base); d.gifts = { items: [{ id: "g1", name: "x", price: "1", url: "javascript:1" }] }; return draftStatus(d, { tier: "basic", assets }).ready; })());

// --- a missing cover is reported once, not twice (as a field and as a file)
check("a missing cover is listed once", draftStatus((() => { const d = clone(base); delete d.meta; return d; })(), { tier: "basic", assets }).missing.filter((m) => /ogImage|og-preview/.test(m.path)).length === 1);

// --- files
const noFiles = draftStatus(base, { tier: "basic", assets: ["cover/og-preview.jpg"] });
check("files that were never uploaded are listed", noFiles.missing.filter((m) => m.reason === "asset").length === 2 + base.gallery.length);
check("the file check is skipped when no list is given", draftStatus(base, { tier: "basic" }).ready);

// --- effective features
const eff = effectiveFeatures({ features: { gifts: true, kenang: true } }, "basic");
check("effectiveFeatures: package applied, defaults kept", eff.gifts === false && eff.kenang === false && eff.mempelai === true && eff.dressCode === false);
check("effectiveFeatures: full package", effectiveFeatures({ features: { gifts: true, ayat: true } }, "full").gifts === true && effectiveFeatures({}, "full").dressCode === true);
// --- garbage in must never crash the API
const garbage: unknown[] = [null, undefined, 5, "x", [], [1, 2], true, { features: "x" }, { features: [1] }, { gallery: "x" }, { gallery: [null, 5, "x"] }, { gifts: { items: "x" } }, { gifts: "x" }, { date: { start: "tomorrow" } },
  { date: { start: 5 } }, { date: "x" }, { couple: { groom: "x", bride: 5 } }, { couple: null }, { venue: { maps: 5 } }, { aturcara: "x" }, { aturcara: [null] }, { theme: { a: 1 } }, { lang: 5 }, { palette: [] },
  { music: "x" }, { duitnow: 5 }, { dressCode: [1] }, { text: { doaHtml: "x" } }, JSON.parse('{"a":' .repeat(30) + "1" + "}".repeat(30))];
let crashed = 0;
for (const g of garbage) { try { const r = draftStatus(g, { tier: "basic", assets: ["x"], slug: "ab" }); if (typeof r.ready !== "boolean" || r.ready) crashed++; } catch (e) { crashed++; console.log("  threw for", JSON.stringify(g)?.slice(0, 60), String(e)); } }
check("garbage drafts never throw and are never ready", crashed === 0, `${crashed} of ${garbage.length}`);
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
