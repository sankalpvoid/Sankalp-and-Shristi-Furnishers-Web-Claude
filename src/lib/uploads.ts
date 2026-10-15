import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { DATA_DIR } from "@/db";

const UPLOAD_DIR = () => path.join(DATA_DIR, "uploads");
export function removeUpload(url: string) {
  const m = /^\/uploads\/([a-f0-9]{16}\.webp)$/.exec(url);
  if (m) fs.rmSync(path.join(UPLOAD_DIR(), m[1]), { force: true });
}
export async function saveUpload(file: File): Promise<string> {
  if (!file || !file.size) throw new Error("Choose an image file.");
  if (file.size > 12 * 1024 * 1024) throw new Error("Image is larger than 12 MB.");
  const buf = Buffer.from(await file.arrayBuffer());
  let out: Buffer;
  try { out = await sharp(buf).rotate().resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(); }
  catch { throw new Error("That file isn't a readable image (use JPG, PNG or WebP)."); }
  fs.mkdirSync(UPLOAD_DIR(), { recursive: true });
  const name = `${crypto.randomBytes(8).toString("hex")}.webp`;
  fs.writeFileSync(path.join(UPLOAD_DIR(), name), out);
  return `/uploads/${name}`;
}
