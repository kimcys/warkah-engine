// npm run i18n: is the English table complete and tidy?
//  - every t("...") in src/**/*.astro and every T("...") in public/core/card.js has an English entry
//  - every T("...") in card.js is listed in src/lib/i18n/browser-keys.ts (the browser only receives those)
//  - warns about English entries nothing uses any more
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib.mjs";

const walk = (dir) => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const unq = (raw) => JSON.parse(`"${raw}"`);

const astro = walk(join(ROOT, "src")).filter((f) => f.endsWith(".astro"));
const used = new Set();
for (const f of astro) for (const m of readFileSync(f, "utf8").matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) used.add(unq(m[1]));
used.add("Kad oleh");   // t(credit.label) in FooterCredit.astro

const cardJs = readFileSync(join(ROOT, "public/core/card.js"), "utf8");
const browserUsed = new Set([...cardJs.matchAll(/\bT\(\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => unq(m[1])));
for (const k of browserUsed) used.add(k);

const enSource = readFileSync(join(ROOT, "src/lib/i18n/en.ts"), "utf8");
const en = new Set([...enSource.matchAll(/^\s*"((?:[^"\\]|\\.)*)":/gm)].map((m) => unq(m[1])));

const bkSource = readFileSync(join(ROOT, "src/lib/i18n/browser-keys.ts"), "utf8");
const browserListed = new Set(JSON.parse(bkSource.slice(bkSource.indexOf("= [") + 2, bkSource.lastIndexOf("]") + 1)));

let problems = 0;
const say = (label, list) => { if (list.length) { problems++; console.log(`\n${label} (${list.length}):`); list.forEach((k) => console.log("  " + k)); } };
say("Missing an English entry in src/lib/i18n/en.ts", [...used].filter((k) => !en.has(k)));
say("Used by card.js but missing from src/lib/i18n/browser-keys.ts", [...browserUsed].filter((k) => !browserListed.has(k)));
const unused = [...en].filter((k) => !used.has(k));
if (unused.length) { console.log(`\nNote: ${unused.length} English entries are not used by any t()/T() call (fine, or remove):`); unused.forEach((k) => console.log("  " + k)); }
console.log(problems ? "\n✖ English table needs attention." : `\n✔ English table complete: ${used.size} strings.`);
process.exit(problems ? 1 : 0);
