// A fingerprint of everything that goes into the card kit. kit/index.js carries it as KIT_VERSION; the test fails when the kit is out of date.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const LIB = ["validate.ts", "draft-status.ts", "system-fields.js", "sample.ts", "sample-merge.js", "slug.js", "lines.js", "datetime.js", "sanitize.js", "urls.js", "images.js", "paths.js",
  "builder-steps.ts", "features.ts", "tiers.ts", "asset-rules.ts", "theme-keys.ts", "dates.js", "event-schema.ts"];

export function kitFiles(root) {
  const files = ["src/kit.ts", "src/kit.d.ts", ...LIB.map((f) => `src/lib/${f}`), "models/library.json", "samples/base.ms.json", "samples/base.en.json", "generated/catalogue.json"];
  for (const theme of readdirSync(join(root, "src", "themes"))) if (existsSync(join(root, "src", "themes", theme, "sample.json"))) files.push(`src/themes/${theme}/sample.json`);
  return files.sort();
}

export function sourceHash(root) {
  const hash = createHash("sha256");
  for (const file of kitFiles(root)) { hash.update(file); hash.update(readFileSync(join(root, file))); }
  return hash.digest("hex").slice(0, 12);
}
