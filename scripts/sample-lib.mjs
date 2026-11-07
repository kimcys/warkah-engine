// Writes events/sample-<theme>-<lang>/ (the theme's sample card and its sample photos). Shared by `npm run sample` and `npm run previews`.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { EVENTS_DIR, ROOT } from "./lib.mjs";
import { sampleEvent } from "../src/lib/sample-merge.js";
import { completeDraft } from "../src/lib/system-fields.js";

const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

/**
 * options.builder  give it the system fields exactly as the builder would (card domain + /<slug>/, no Firebase site)
 * options.hosting  use this hosting instead (e.g. { site: "previews", base: "/preview/lover-ms/" })
 * Returns the slug (the folder name under events/).
 */
export function writeSample(theme, lang, options = {}) {
  const themeSample = read(`src/themes/${theme}/sample.json`);
  const slug = `sample-${theme}-${lang}`;
  let event = sampleEvent(read(`samples/base.${lang}.json`), themeSample);
  if (options.builder) {
    const { hosting, store, meta, package: pkg, ...customerFields } = event;     // what a customer would have typed
    event = completeDraft(customerFields, { slug, lang });
  } else {
    event.hosting = { ...event.hosting, site: `sample-${theme}` };
  }
  if (options.hosting) event.hosting = options.hosting;
  const dir = join(EVENTS_DIR, slug);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "event.json"), JSON.stringify(event, null, 2));
  cpSync(join(ROOT, "samples", "assets", themeSample.assetSet), join(dir, "assets"), { recursive: true });
  return { slug, photos: themeSample.assetSet };
}
