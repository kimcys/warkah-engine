// node scripts/build-job.mjs --job <folder> --out <folder>
// What the build server runs for one preview job. <folder> holds what the server downloaded from the builder:
//   job.json     { id, token, tier, lang? }       draft.json   the customer's draft        assets/   their files (gallery/1.webp, portrait/groom.webp ...)
// It builds the card to be served at /p/<token>/ and leaves the finished files in --out. Exit code 0 = built; anything else = failed (the message goes to the customer as "try again").
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { EVENTS_DIR, ROOT, run } from "./lib.mjs";
import { DraftError, previewEventFor } from "./preview-lib.mjs";

export const PREVIEW_BASE = (token) => `/p/${token}/`;

export async function buildJob({ jobDir, outDir }) {
  const job = JSON.parse(readFileSync(join(jobDir, "job.json"), "utf8"));
  const draft = JSON.parse(readFileSync(join(jobDir, "draft.json"), "utf8"));
  if (!/^[a-f0-9]{32}$/.test(job.token)) throw new Error("bad token");
  const slug = `preview-${job.token.slice(0, 12)}`;
  const { event, assetSet } = previewEventFor(draft, { slug, tier: job.tier, base: PREVIEW_BASE(job.token) });
  const dir = join(EVENTS_DIR, slug);
  const clean = () => { for (const p of [dir, join(ROOT, "dist", slug), join(ROOT, ".stage", slug)]) rmSync(p, { recursive: true, force: true }); };
  clean();
  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "event.json"), JSON.stringify(event, null, 2));
    cpSync(join(ROOT, "samples", "assets", assetSet), join(dir, "assets"), { recursive: true });
    if (existsSync(join(jobDir, "assets"))) cpSync(join(jobDir, "assets"), join(dir, "assets"), { recursive: true, force: true });
    await run("node", [join("scripts", "run.mjs"), "build", slug]);
    rmSync(outDir, { recursive: true, force: true });
    cpSync(join(ROOT, "dist", slug), outDir, { recursive: true });
  } finally { clean(); }
  return { files: slug };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const args = process.argv.slice(2);
  const flag = (n) => args[args.indexOf(n) + 1];
  try { await buildJob({ jobDir: resolve(flag("--job")), outDir: resolve(flag("--out")) }); }
  catch (e) { console.error(e instanceof DraftError ? `draft: ${e.message}` : e.message); process.exit(1); }
}
