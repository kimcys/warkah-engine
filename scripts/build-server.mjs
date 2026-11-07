// The build server: asks the builder (Warkah Kenang's Worker) for jobs (a preview, or publishing the real card), builds each one and uploads the result.
//   KENANG_URL=https://kad.example.com BUILD_SECRET=... node scripts/build-server.mjs [--once] [--interval 3000]
// It only ever calls out (no inbound port): POST /api/build/claim → download the draft and the customer's files → scripts/build-job.mjs →
// upload every file of the built card → POST done (or fail). One build at a time. --once handles the queue until it is empty, then exits (for tests).
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { buildJob } from "./build-job.mjs";

const args = process.argv.slice(2);
const flag = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const BASE = (process.env.KENANG_URL || "").replace(/\/$/, "");
const SECRET = process.env.BUILD_SECRET || "";
const ONCE = args.includes("--once");
const INTERVAL = Number(flag("--interval", 3000));
if (!BASE || !SECRET) { console.error("Set KENANG_URL and BUILD_SECRET."); process.exit(2); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const call = (method, path, body, headers = {}) => fetch(`${BASE}/api/build${path}`, {
  method, headers: { Authorization: `Bearer ${SECRET}`, ...(body && typeof body === "object" && !(body instanceof Uint8Array) ? { "Content-Type": "application/json" } : {}), ...headers },
  body: body === undefined ? undefined : body instanceof Uint8Array ? body : JSON.stringify(body)
});
const encodePath = (p) => p.split("/").map(encodeURIComponent).join("/");

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full); else yield full;
  }
}

async function withRetry(label, fn, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) { try { return await fn(); } catch (e) { last = e; await sleep(500 * (i + 1)); } }
  throw new Error(`${label}: ${last.message}`);
}

async function handle({ job, draft, assets }) {
  const work = mkdtempSync(join(tmpdir(), "warkah-build-"));
  const started = Date.now();
  try {
    writeFileSync(join(work, "job.json"), JSON.stringify({ id: job.id, kind: job.kind, token: job.token, slug: job.slug, tier: job.tier, lang: job.lang }));
    writeFileSync(join(work, "draft.json"), JSON.stringify(draft));
    for (const a of assets) {
      const bytes = await withRetry(`download ${a.path}`, async () => {
        const res = await call("GET", `/jobs/${job.id}/files/${encodePath(a.path)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return new Uint8Array(await res.arrayBuffer());
      });
      const target = join(work, "assets", a.path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, bytes);
    }
    const out = join(work, "out");
    await buildJob({ jobDir: work, outDir: out });
    const files = [...walk(out)].map((f) => relative(out, f).split("\\").join("/"));
    for (let i = 0; i < files.length; i += 6) {
      await Promise.all(files.slice(i, i + 6).map((path) => withRetry(`upload ${path}`, async () => {
        const res = await call("PUT", `/jobs/${job.id}/out/${encodePath(path)}`, new Uint8Array(readFileSync(join(out, path))));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      })));
    }
    const done = await call("POST", `/jobs/${job.id}/done`, { files });
    if (!done.ok) throw new Error(`done: HTTP ${done.status}`);
    console.log(`✔ job ${job.id.slice(0, 8)}  ${files.length} files  ${((Date.now() - started) / 1000).toFixed(1)}s`);
  } catch (e) {
    console.error(`✘ job ${job.id.slice(0, 8)}: ${e.message}`);
    await call("POST", `/jobs/${job.id}/fail`, { error: String(e.message).slice(0, 300) }).catch(() => {});
  } finally { rmSync(work, { recursive: true, force: true }); }
}

console.log(`build server → ${BASE}${ONCE ? " (once)" : ""}`);
for (;;) {
  let res;
  try { res = await call("POST", "/claim"); } catch (e) { console.error("cannot reach the builder:", e.message); if (ONCE) process.exit(1); await sleep(INTERVAL * 2); continue; }
  if (res.status === 200) { await handle(await res.json()); continue; }
  if (res.status !== 204) { console.error(`claim: HTTP ${res.status}`); if (ONCE) process.exit(1); await sleep(INTERVAL * 2); continue; }
  if (ONCE) break;
  await sleep(INTERVAL);
}
