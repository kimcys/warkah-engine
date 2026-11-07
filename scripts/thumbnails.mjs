// npm run thumbnails: photographs every theme for the builder's theme chooser.
//   samples/thumbnails/<theme>/opening.webp      the opening screen
//   samples/thumbnails/<theme>/classic.webp      the first page, theme as designed
//   samples/thumbnails/<theme>/<palette>.webp    the first page in each colour option
//   ...-details.webp                             the same, for the Details page (where the accent colours show, even on themes whose artwork is not recoloured)
// It builds each theme's sample card (npm run sample), serves it, and takes phone-size (390 x 844) screenshots in headless Chrome.
// Chrome: set CHROME_PATH if it is not the macOS default. Run it again whenever a theme's look or palettes change.
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { ROOT, fail, run } from "./lib.mjs";

const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (!existsSync(CHROME)) fail(`Chrome not found at ${CHROME}. Set CHROME_PATH.`);
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".json": "application/json", ".mp3": "audio/mpeg", ".m4a": "audio/mp4" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log("▶ reading the catalogue");
await run("node", [join("scripts", "run.mjs"), "build", "minimal-demo", "--catalogue"]);
const catalogue = JSON.parse(readFileSync(join(ROOT, "generated", "catalogue.json"), "utf8"));
const themes = catalogue.themes.map((t) => ({ key: t.key, palettes: t.palettes.map((p) => p.id) }));

for (const t of themes) {
  console.log(`▶ building the ${t.key} sample`);
  await run("node", [join("scripts", "sample.mjs"), t.key, "--build"]);
}

function serve(dir) {
  const server = createServer((req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
    let file = join(dir, path);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(readFileSync(file));
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port })));
}

async function photograph(t, index) {
  const { server, port } = await serve(join(ROOT, "dist", `sample-${t.key}-ms`));
  const debug = 9600 + index;
  const profile = join(ROOT, ".stage", `thumb-profile-${t.key}`);
  const chrome = spawn(CHROME, [`--remote-debugging-port=${debug}`, "--headless=new", "--no-first-run", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
  let targets;
  for (let i = 0; i < 60; i++) { try { targets = await (await fetch(`http://127.0.0.1:${debug}/json`)).json(); break; } catch { await sleep(200); } }
  const ws = new WebSocket(targets.find((x) => x.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = (expression) => send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  const out = join(ROOT, "samples", "thumbnails", t.key);
  mkdirSync(out, { recursive: true });
  const shot = async (name) => {
    const r = await send("Page.captureScreenshot", { format: "webp", quality: 82 });
    writeFileSync(join(out, `${name}.webp`), Buffer.from(r.result.data, "base64"));
  };
  for (const palette of ["classic", ...t.palettes]) {
    await send("Page.navigate", { url: `http://127.0.0.1:${port}/?palette=${palette}` });
    await sleep(4500);
    if (palette === "classic") await shot("opening");
    await evaluate(`document.querySelector('#openInvite').click()`);
    await sleep(7500);
    await evaluate(`document.querySelector('#card').scrollTo(0, 0)`);
    await sleep(800);
    await shot(palette);
    await evaluate(`(document.getElementById('details') || [...document.querySelectorAll('#card > section')][6]).scrollIntoView({ block: 'start' })`);
    await sleep(3500);
    await shot(`${palette}-details`);
    console.log(`  ✔ ${t.key}/${palette}`);
  }
  chrome.kill(); ws.close(); server.close();
}

await Promise.all(themes.map((t, i) => photograph(t, i)));
console.log("▶ updating the catalogue");
await run("node", [join("scripts", "run.mjs"), "build", "minimal-demo", "--catalogue"]);
console.log("✔ samples/thumbnails/ written");
