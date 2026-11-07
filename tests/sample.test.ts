import { sampleFor, previewDraft, assetSetFor } from "../src/lib/sample";
import { validateEvent } from "../src/lib/validate";
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
const v = validateEvent(p);
check("merged preview validates", v.ok, v.ok ? "" : JSON.stringify((v as any).problems.slice(0, 3)));
const e = previewDraft({ theme: "glasshouse" }, "glasshouse", "en");
check("blank draft validates (en)", validateEvent(e).ok);
check("blank draft keeps no features (defaults apply)", !("features" in e));
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
