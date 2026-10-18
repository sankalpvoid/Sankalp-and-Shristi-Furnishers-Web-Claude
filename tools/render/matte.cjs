// Renders an object matte (white object on black, same camera as the beauty render) for one job.
//   NODE_PATH=$(npm root -g) node tools/render/matte.cjs products/slatted-headboard-bed out.png [scale]
const fs = require("node:fs"), path = require("node:path");
const { chromium } = require("playwright");
const serve = require("./serve.cjs");
(async () => {
  const [name, out, scale = "2", only = "item"] = process.argv.slice(2);
  const { srv, port } = await serve();
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox", "--use-angle=swiftshader", "--use-gl=angle", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await b.newPage();
  page.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction("window.__ready", null, { timeout: 30000 });
  const url = await page.evaluate(([n, s, o]) => window.renderMatteJob(n, s, o), [name, Number(scale), only]);
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, Buffer.from(url.split(",")[1], "base64"));
  console.log("matte →", out);
  await b.close(); srv.close();
})();
