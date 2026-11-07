// npm run previews: builds the 8 sample cards (4 themes x 2 languages) for the builder's instant design preview into previews/<theme>-<lang>/.
// They are built to live at /preview/<theme>-<lang>/ and ship ALL the groom and bride models, so the builder can swap models with
// ?groom=<id>&bride=<id> and colours with ?palette=<id>. previews/ is generated (git-ignored): Warkah Kad's build copies it into its public/preview/.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { EVENTS_DIR, ROOT, run } from "./lib.mjs";
import { writeSample } from "./sample-lib.mjs";

const THEMES = ["royal-gold", "lover", "glasshouse", "enchanted-garden"];
const out = join(ROOT, "previews");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const index = [];
for (const theme of THEMES) {
  for (const lang of ["ms", "en"]) {
    const name = `${theme}-${lang}`;
    const { slug } = writeSample(theme, lang, { hosting: { site: "previews", base: `/preview/${name}/` } });
    console.log(`▶ ${name}`);
    await run("node", [join("scripts", "run.mjs"), "build", slug], { WARKAH_ALL_MODELS: "1" });
    cpSync(join(ROOT, "dist", slug), join(out, name), { recursive: true });
    rmSync(join(ROOT, "dist", slug), { recursive: true, force: true });
    rmSync(join(EVENTS_DIR, slug), { recursive: true, force: true });
    index.push({ theme, lang, path: `/preview/${name}/` });
  }
}
writeFileSync(join(out, "index.json"), JSON.stringify(index, null, 2));
console.log(`✔ previews/ (${index.length} cards)`);
