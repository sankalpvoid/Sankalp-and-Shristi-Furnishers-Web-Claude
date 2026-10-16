#!/usr/bin/env node
// Builds the scroll-scrubbed homepage sequence from the clips in assets/manufacturing-videos.
//   npm run prepare:making [-- --dir path/to/folder]
// Requires ffmpeg + ffprobe. See assets/manufacturing-videos/README.md.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const dirArg = args.includes("--dir") ? args[args.indexOf("--dir") + 1] : "assets/manufacturing-videos";
const dir = path.resolve(dirArg);
const outDir = path.resolve("public/making");
const cfg = JSON.parse(fs.readFileSync(path.join(dir, "sequence.json"), "utf8"));
const W = cfg.width || 1280, H = cfg.height || 720, FPS = cfg.fps || 24, GOP = cfg.gop || 4, CRF = cfg.crf || 23, CRF_SMALL = cfg.crfSmall || CRF + 2;

const run = (cmd, a) => execFileSync(cmd, a, { stdio: ["ignore", "pipe", "pipe"] }).toString();
const duration = (f) => parseFloat(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", f]));

// A clip is either { file } (video) or { image, duration } (a still held for `duration` seconds).
const clips = (cfg.clips || []).map((c) => ({ ...c, isImage: !!c.image, file: c.file || c.image, path: path.join(dir, c.file || c.image) }));
const missing = clips.filter((c) => !fs.existsSync(c.path));
if (!clips.length || missing.length) {
  console.error(missing.length ? `Missing clips: ${missing.map((c) => c.file).join(", ")}` : "sequence.json lists no clips.");
  process.exit(1);
}

// Per-clip trimmed lengths
for (const c of clips) {
  const full = c.isImage ? c.duration || 2 : duration(c.path);
  c.start = Math.max(0, c.start || 0);
  c.end = Math.min(full, c.end ?? full);
  c.len = c.end - c.start;
  if (c.len <= 0.2) { console.error(`Clip ${c.file} has no usable length after trimming.`); process.exit(1); }
}

function build(width, height, out, crf) {
  const inputs = clips.flatMap((c) => (c.isImage ? ["-loop", "1", "-framerate", String(FPS), "-t", String(c.len + 0.5), "-i", c.path] : ["-i", c.path]));
  const prep = clips.map((c, i) =>
    `[${i}:v]trim=start=${c.start}:end=${c.end},setpts=PTS-STARTPTS,fps=${FPS},scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1,format=yuv420p[v${i}]`);
  let graph = prep.join(";");
  let label = "v0", elapsed = clips[0].len;
  for (let i = 1; i < clips.length; i++) {
    const xf = Math.min(Math.max(0, clips[i - 1].crossfade || 0), clips[i - 1].len - 0.1, clips[i].len - 0.1);
    if (xf > 0.05) {
      graph += `;[${label}][v${i}]xfade=transition=fade:duration=${xf}:offset=${(elapsed - xf).toFixed(3)}[x${i}]`;
      elapsed += clips[i].len - xf;
    } else {
      graph += `;[${label}][v${i}]concat=n=2:v=1:a=0[x${i}]`;
      elapsed += clips[i].len;
    }
    label = `x${i}`;
  }
  const finalMap = clips.length === 1 ? "[v0]" : `[${label}]`;
  run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...inputs, "-filter_complex", graph, "-map", finalMap, "-an",
    "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-g", String(GOP), "-keyint_min", String(GOP), "-sc_threshold", "0",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]);
}

fs.mkdirSync(outDir, { recursive: true });
const big = path.join(outDir, "sequence.mp4"), small = path.join(outDir, "sequence-sm.mp4");
console.log(`Encoding ${clips.length} clips → ${W}×${H} …`);
build(W, H, big, CRF);
const sw = Math.round((W * 0.67) / 2) * 2, sh = Math.round((H * 0.67) / 2) * 2;
console.log(`Encoding phone version → ${sw}×${sh} …`);
build(sw, sh, small, CRF_SMALL);
const total = duration(big);
run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", big, "-frames:v", "1", "-q:v", "3", path.join(outDir, "poster.jpg")]);
run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-sseof", "-0.1", "-i", big, "-frames:v", "1", "-q:v", "3", "-update", "1", path.join(outDir, "final.jpg")]);
fs.writeFileSync(path.join(outDir, "sequence.meta.json"), JSON.stringify({ duration: +total.toFixed(3), width: W, height: H, clips: clips.map((c) => ({ file: c.file, length: +c.len.toFixed(2) })) }, null, 2) + "\n");
const mb = (f) => (fs.statSync(f).size / 1048576).toFixed(1) + " MB";
console.log(`Done: ${total.toFixed(1)} s · sequence.mp4 ${mb(big)} · sequence-sm.mp4 ${mb(small)}`);
