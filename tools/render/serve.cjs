// Tiny static server for the offline render tool: serves tools/render and node_modules/three.
const http = require("node:http"), fs = require("node:fs"), path = require("node:path");
const root = path.resolve(__dirname, "..", ".."), types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json" };
module.exports = function serve(port = 0) {
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split("?")[0]);
    const f = u.startsWith("/three/") ? path.join(root, "node_modules", u) : path.join(__dirname, u);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
  });
  return new Promise((ok) => srv.listen(port, "127.0.0.1", () => ok({ srv, port: srv.address().port })));
};
