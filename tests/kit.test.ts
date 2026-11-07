// The kit in kit/ must be built from the current sources, and must export what its types promise.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { sourceHash } from "../scripts/kit-hash.mjs";

let fails = 0;
const check = (name: string, ok: boolean, extra = "") => { if (!ok) fails++; console.log(ok ? "PASS" : "FAIL", name, extra); };
const root = process.cwd();
const bundle = join(root, "kit", "index.js");
check("kit/ exists (run npm run kit)", existsSync(bundle));
if (existsSync(bundle)) {
  const text = readFileSync(bundle, "utf8");
  const built = /KIT_VERSION = "([0-9a-f]+)"/.exec(text)?.[1];
  check("kit/ is up to date with the sources (run npm run kit if this fails)", built === sourceHash(root), `kit ${built} vs sources ${sourceHash(root)}`);
  const promised = (readFileSync(join(root, "src", "kit.d.ts"), "utf8").match(/^export (?:function|const) (\w+)/gm) ?? []).map((m) => m.split(" ").pop()!);
  const exported = new Set([...text.matchAll(/export \{([^}]*)\}/g)].flatMap((m) => m[1].split(",").map((x) => x.trim().split(/\s+as\s+/).pop()!)).concat(["KIT_VERSION"]));
  const absent = promised.filter((n) => !exported.has(n));
  check("every export in kit.d.ts is in the bundle", absent.length === 0, absent.join(","));
  check("no Astro, Node or DOM code in the bundle", !/from "astro|from "node:|document\.|window\./.test(text));
}
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
