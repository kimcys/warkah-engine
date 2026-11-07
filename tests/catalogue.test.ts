// Reads generated/catalogue.json (npm run catalogue) and checks the theme chooser has everything it needs.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
let fails = 0;
const check = (name: string, ok: boolean, extra = "") => { if (!ok) fails++; console.log(ok ? "PASS" : "FAIL", name, extra); };
const catalogue = JSON.parse(readFileSync(join(root, "generated", "catalogue.json"), "utf8"));

check("four themes", catalogue.themes.length === 4);
for (const t of catalogue.themes) {
  const words = (s: string) => typeof s === "string" && s.trim().length > 8;
  check(`${t.key}: label and description in both languages`, ["ms", "en"].every((l) => t.label[l] && words(t.description[l])));
  check(`${t.key}: culture`, t.culture === "malay" || t.culture === "modern");
  check(`${t.key}: opening thumbnail exists`, !!t.thumbnails.opening && existsSync(join(root, t.thumbnails.opening)));
  const all = [["classic", t.thumbnails.classic], ...Object.entries(t.thumbnails.palettes)] as [string, { home: string | null; details: string | null }][];
  for (const [id, th] of all) check(`${t.key}/${id}: home + details thumbnails exist`, !!th.home && !!th.details && existsSync(join(root, th.home)) && existsSync(join(root, th.details)));
  check(`${t.key}: every palette has an English and a Malay name`, t.palettes.every((p: any) => p.label.ms && p.label.en));
  check(`${t.key}: one thumbnail set per palette`, t.palettes.length === Object.keys(t.thumbnails.palettes).length);
}
check("there is no Kenang feature, and gifts are offered", !catalogue.features.some((f: any) => f.key === "kenang") && catalogue.features.find((f: any) => f.key === "gifts")?.offered !== false);
check("models have English names", catalogue.models.every((m: any) => m.labelEn));
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
