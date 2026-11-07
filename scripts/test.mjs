// npm test: bundles each tests/*.test.ts (so it runs in plain Node, as the builder's Worker would) and runs it.
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ROOT, run } from "./lib.mjs";

const tmp = mkdtempSync(join(tmpdir(), "warkah-tests-"));
let failed = 0;
try {
  for (const file of readdirSync(join(ROOT, "tests")).filter((f) => f.endsWith(".test.ts"))) {
    const out = join(tmp, file.replace(".ts", ".mjs"));
    console.log(`\n▶ ${file}`);
    await run(join(ROOT, "node_modules", ".bin", "rolldown"), [join("tests", file), "--platform", "node", "-f", "esm", "-o", out, "--silent"]).catch(() => { failed++; });
    await run("node", [out]).catch(() => { failed++; });
  }
} finally { rmSync(tmp, { recursive: true, force: true }); }
if (failed) { console.log(`\n✖ ${failed} test file(s) failed`); process.exit(1); }
console.log("\n✔ all tests passed");
