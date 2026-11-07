import { sampleFor, previewDraft, assetSetFor } from "../src/lib/sample";
import { validateEvent } from "../src/lib/validate";
import { completeDraft as complete } from "../src/lib/system-fields.js";
import { THEME_KEYS } from "../src/lib/theme-keys";
let fails = 0;
const check = (name: string, ok: boolean, extra = "") => { if (!ok) fails++; console.log(ok ? "PASS" : "FAIL", name, extra); };
for (const t of THEME_KEYS) for (const l of ["ms", "en"] as const) {
  const r = validateEvent(sampleFor(t, l));
  check(`sample ${t}/${l} validates`, r.ok, r.ok ? "" : JSON.stringify(r.problems.slice(0, 2)));
}
check("asset sets", assetSetFor("royal-gold") === "malay" && assetSetFor("lover") === "modern");
// a draft with a few typed fields
const draft = { theme: "lover", palette: "peach", couple: { groom: { name: "Ali" }, model: { bride: "bride-2" } }, venue: { name: "" }, features: { gifts: false, ayat: true }, aturcara: [] };
const p = previewDraft(draft, "lover", "ms");
check("typed name kept", p.couple.groom.name === "Ali");
check("empty sibling filled", p.couple.groom.full === "bin Hj. Rahman" && p.couple.bride.name === "Nur Aisyah");
check("model choice kept + other model filled", p.couple.model.bride === "bride-2" && p.couple.model.groom === "groom-3");
check("empty string filled", p.venue.name === "Dewan Seri Kenanga");
check("empty list filled", p.aturcara.length === 4);
check("features exactly the draft's", JSON.stringify(p.features) === JSON.stringify({ gifts: false, ayat: true }));
check("palette kept", p.palette === "peach");
const v = validateEvent(complete(p, { slug: "ali-aisyah" }));
check("merged preview validates", v.ok, v.ok ? "" : JSON.stringify((v as any).problems.slice(0, 3)));
const e = previewDraft({ theme: "glasshouse" }, "glasshouse", "en");
check("blank draft validates (en), once the system fields are added", validateEvent(complete(e, { slug: "blank-draft" })).ok);
check("blank draft keeps no features (defaults apply)", !("features" in e));
// --- the sample must never put its own people into a customer's card
import { completeDraft } from "../src/lib/system-fields.js";
const dina: any = { theme: "lover", couple: { first: "bride", groom: { name: "Muhammad Farid", full: "bin Hj. Anuar", short: "Farid", parentsHtml: "Hj. Anuar" }, bride: { name: "Nur Dina", full: "binti Hj. Rashid", short: "Dina", parentsHtml: "Hj. Rashid" } },
  host: { parents: ["Hj. Rashid"] }, date: { start: "2027-05-15T11:00:00+08:00", end: "2027-05-15T16:00:00+08:00" },
  venue: { name: "Dewan Anggerik", area: "Kuantan, Pahang", address: "Jalan Contoh, Kuantan", maps: "https://maps.google.com/?q=a", waze: "https://waze.com/ul?q=a" }, features: { gifts: true } };
const built = completeDraft(previewDraft(dina, "lover", "ms"), { slug: "dina-farid" });
const text = JSON.stringify(built);
const strangers = ["Aisyah", "Hafiz", "Rohani", "Kamal", "Zainab", "Rahman", "AisyahHafiz", "012-345", "1 Mac 2027", "Seri Kenanga"];
check("no sample person, hashtag, phone or date in the customer's card", strangers.every((w) => !text.includes(w)), strangers.filter((w) => text.includes(w)).join(","));
check("their own names are there (title, calendar text)", /Dina/.test(built.meta.title) && /Nur Dina/.test(built.calendarDescription));
check("contacts stay empty, wishes and text stay at the defaults", built.contacts === undefined && built.defaultWishes === undefined && built.text === undefined);
check("generic filler is still used (gifts the customer ticked)", built.gifts.items.length === 4);
console.log(fails ? `${fails} FAILED` : "all passed");


process.exit(fails ? 1 : 0);
