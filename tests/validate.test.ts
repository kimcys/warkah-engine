import { validateEvent } from "../src/lib/validate";
import { sampleFor } from "../src/lib/sample";

let fails = 0;
const check = (name: string, ok: boolean, extra = "") => { if (!ok) fails++; console.log(ok ? "PASS" : "FAIL", name, extra); };

check("a good card validates", validateEvent(sampleFor("lover", "ms")).ok);

const bad: any = structuredClone(sampleFor("lover", "ms"));
delete bad.couple.groom.name; bad.venue.maps = "not a link"; bad.date.start = "tomorrow"; bad.aturcara = [];
bad.couple.model = { groom: "groom-9" }; bad.theme = "disco"; bad.host.parents = ["a", "b", "c"]; bad.rsvp.maxGuests = 50; bad.palette = 3;
const r = validateEvent(bad);
check("a bad card is refused", !r.ok);
if (!r.ok) {
  const by = Object.fromEntries(r.problems.map((p) => [p.path, p.message]));
  check("names the missing field in Malay", /Sila isi Nama panggilan pengantin lelaki/.test(by["couple.groom.name"] ?? ""));
  check("explains a bad link", /bermula dengan https/.test(by["venue.maps"] ?? ""));
  check("lists the valid models", /groom-1, groom-2, groom-3/.test(by["couple.model.groom"] ?? ""));
  check("limits the parents", /maksimum 2/.test(by["host.parents"] ?? ""));
}
const noProgramme: any = structuredClone(sampleFor("lover", "ms")); noProgramme.aturcara = [];
const np = validateEvent(noProgramme);
check("a programme is required while the programme page is on", !np.ok && /atur cara majlis/i.test(np.problems.find((p) => p.path === "aturcara")?.message ?? ""));
noProgramme.features.programme = false;
check("...and not required once the programme page is switched off", validateEvent(noProgramme).ok);
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
