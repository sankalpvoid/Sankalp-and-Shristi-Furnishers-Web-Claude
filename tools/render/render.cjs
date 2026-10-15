// Offline renderer for temporary studio imagery.
//   node tools/render/render.cjs [--draft] [--only name,name] [--list]
// Needs Playwright + Chromium (NODE_PATH=$(npm root -g)). Output: public/renders/*.webp + manifest.json
const fs = require("node:fs"), path = require("node:path");
const sharp = require("sharp");
const { chromium } = require("playwright");
const serve = require("./serve.cjs");

const args = process.argv.slice(2);
const draft = args.includes("--draft");
const onlyArg = args.find((a) => a.startsWith("--only="))?.slice(7) || (args.includes("--only") ? args[args.indexOf("--only") + 1] : "");
const scaleArg = Number(args.find((a) => a.startsWith("--scale="))?.slice(8)) || 1;
const only = onlyArg ? onlyArg.split(",") : null;
const outDir = path.resolve(__dirname, "..", "..", "public", "renders");

(async () => {
  const { srv, port } = await serve();
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-angle=swiftshader", "--use-gl=angle", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await b.newPage();
  page.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/404/.test(m.text())) console.log("console:", m.text()); });
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction("window.__ready", null, { timeout: 30000 });
  const jobs = await page.evaluate("window.__jobs");
  if (args.includes("--list")) { console.log(jobs.join("\n")); await b.close(); srv.close(); return; }
  fs.mkdirSync(outDir, { recursive: true });
  for (const name of jobs) {
    if (only && !only.includes(name)) continue;
    const t0 = Date.now();
    const q = draft ? { scale: 0.45, samples: { sunSamples: 10, skySamples: 14, fillSamples: 3, shadowRes: 2048 } } : { scale: scaleArg };
    const url = await page.evaluate(([n, q]) => window.renderJob(n, q), [name, q]);
    const buf = Buffer.from(url.split(",")[1], "base64");
    const dest = path.join(outDir, (draft ? "_draft-" : "") + name + ".webp");
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    await sharp(buf).webp({ quality: draft ? 70 : 82, effort: 5 }).toFile(dest);
    if (!draft) await sharp(buf).resize({ width: 800 }).webp({ quality: 80, effort: 5 }).toFile(dest.replace(/\.webp$/, "-sm.webp"));
    console.log(`${name} → ${path.relative(process.cwd(), dest)} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
  await b.close(); srv.close();
})();
