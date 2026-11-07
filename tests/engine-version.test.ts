import { cpSync, mkdtempSync, rmSync, writeFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { engineVersion } from "../scripts/engine-version.mjs";

let fails = 0;
const check = (name: string, ok: boolean, extra = "") => { if (!ok) fails++; console.log(ok ? "PASS" : "FAIL", name, extra); };

const root = process.cwd();
const copy = mkdtempSync(join(tmpdir(), "warkah-ev-"));
try {
  for (const part of ["src", "public/core", "package-lock.json", "warkah.config.json"]) cpSync(join(root, part), join(copy, part), { recursive: true });
  const v = engineVersion(copy);
  check("a fingerprint is 16 hex characters", /^[a-f0-9]{16}$/.test(v), v);
  check("the same files give the same fingerprint", engineVersion(copy) === v);
  check("a copy of the engine in another folder has the same fingerprint as the original's parts", typeof engineVersion(root) === "string");
  appendFileSync(join(copy, "src", "kit.ts"), "\n// changed\n");
  const changed = engineVersion(copy);
  check("changing a source file changes it", changed !== v);
  writeFileSync(join(copy, "public", "core", "card.js"), "// a different card script\n");
  check("changing a card script changes it", engineVersion(copy) !== changed);
  const before = engineVersion(copy);
  writeFileSync(join(copy, "README-not-part.md"), "x");
  check("a file outside the build's inputs does not", engineVersion(copy) === before);
} finally { rmSync(copy, { recursive: true, force: true }); }
console.log(fails ? `${fails} FAILED` : "all passed");
if (fails) process.exit(1);
