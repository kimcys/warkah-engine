// npm run kit: packages the card kit into kit/ so Kenang's Worker and app can depend on it ("@warkah/card-kit": "file:../warkah-engine/kit").
//   kit/index.js        one ESM file (validation, draftStatus, system fields, slugs, samples, sanitiser, ...) plus KIT_VERSION
//   kit/index.d.ts      the types (a copy of src/kit.d.ts)
//   kit/catalogue.json  the catalogue (themes, palettes, models, features, tiers, steps, samples, thumbnails list)
//   kit/package.json
// The engine repository itself stays private: only these files are used by other projects.
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, fail, run } from "./lib.mjs";
import { sourceHash } from "./kit-hash.mjs";

console.log("▶ catalogue");
await run("node", [join("scripts", "run.mjs"), "build", "minimal-demo", "--catalogue"]);

const out = join(ROOT, "kit");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
console.log("▶ bundling");
await run(join(ROOT, "node_modules", ".bin", "rolldown"), [join("src", "kit.ts"), "--platform", "browser", "-f", "esm", "-o", join("kit", "index.js")]);
const version = sourceHash(ROOT);
appendFileSync(join(out, "index.js"), `\nexport const KIT_VERSION = "${version}";\n`);
copyFileSync(join(ROOT, "src", "kit.d.ts"), join(out, "index.d.ts"));
copyFileSync(join(ROOT, "generated", "catalogue.json"), join(out, "catalogue.json"));
writeFileSync(join(out, "package.json"), JSON.stringify({
  name: "@warkah/card-kit", version: "0.1.0", private: true, type: "module", main: "index.js", types: "index.d.ts",
  exports: { ".": { types: "./index.d.ts", default: "./index.js" }, "./catalogue.json": "./catalogue.json" },
  description: "What a valid Warkah card is: validation, draft status, system fields, slugs, samples, sanitiser. Built by `npm run kit` in warkah-engine; do not edit."
}, null, 2));
writeFileSync(join(out, "README.md"), `# @warkah/card-kit\n\nBuilt from warkah-engine by \`npm run kit\` (version ${version}). Do not edit; rebuild instead.\nPrivate: it is used by the builder (Kenang's Worker and app) and is never shared with customers.\n`);

// a smoke test of the bundle as another project would load it
const kit = await import(pathToFileURL(join(out, "index.js")).href);
const names = readFileSync(join(ROOT, "src", "kit.d.ts"), "utf8").match(/^export (?:function|const) (\w+)/gm).map((m) => m.split(" ").pop());
const missing = names.filter((n) => !(n in kit));
if (missing.length) fail(`The bundle does not export what kit.d.ts promises: ${missing.join(", ")}`);
if (kit.KIT_VERSION !== version) fail("KIT_VERSION was not written.");
const sample = kit.sampleFor("lover", "ms");
if (!kit.validateEvent(sample).ok) fail("The bundled validateEvent rejects the sample card.");
console.log(`✔ kit/ (version ${version}, ${names.length} exports, ${(readFileSync(join(out, "index.js")).length / 1024).toFixed(0)} KB)`);
