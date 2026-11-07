// Entry point of the builder container: a tiny health server for the Worker's pings, and the build server in a loop.
// Environment: KAD_URL (the Warkah Kad site), BUILD_SECRET (shared with its Worker). The Worker pings this server while jobs are waiting, so the
// container stays awake exactly while there is work and goes to sleep (costing nothing) when there is not.
import { createServer } from "node:http";
import { spawn } from "node:child_process";

const port = Number(process.env.PORT || 8080);
let child = null;
let restarts = 0;

function start() {
  child = spawn("node", ["scripts/build-server.mjs", "--interval", "3000"], { stdio: "inherit", env: process.env });
  child.on("exit", (code) => {
    console.error(`build server exited (${code}); restarting in 3 s`);
    restarts++;
    setTimeout(start, 3000);
  });
}
start();

createServer((req, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: true, running: !!child && child.exitCode === null, restarts }));
}).listen(port, () => console.log(`builder container listening on ${port}`));

for (const sig of ["SIGTERM", "SIGINT"]) process.on(sig, () => { child?.kill(sig); process.exit(0); });
