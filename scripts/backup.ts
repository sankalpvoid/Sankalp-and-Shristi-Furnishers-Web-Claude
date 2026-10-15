import fs from "node:fs";
import path from "node:path";
import { DATA_DIR, db } from "../src/db";

/**
 * Consistent online backup of the SQLite database (safe while the site is running),
 * plus a copy of uploaded photos. Keeps the newest KEEP backups.
 *   npm run backup            → DATA_DIR/backups/<timestamp>/
 *   BACKUP_DIR=/mnt/offsite npm run backup
 */
const KEEP = Number(process.env.BACKUP_KEEP || 14);
const root = path.resolve(process.env.BACKUP_DIR || path.join(DATA_DIR, "backups"));
const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
const dest = path.join(root, stamp);

(async () => {
  fs.mkdirSync(dest, { recursive: true });
  await db().backup(path.join(dest, "ssfi.db"));
  const up = path.join(DATA_DIR, "uploads");
  if (fs.existsSync(up)) fs.cpSync(up, path.join(dest, "uploads"), { recursive: true });
  const all = fs.readdirSync(root).filter((d) => /^\d{4}-/.test(d)).sort();
  for (const old of all.slice(0, Math.max(0, all.length - KEEP))) fs.rmSync(path.join(root, old), { recursive: true, force: true });
  console.log(`Backup written to ${dest} (${Math.min(all.length, KEEP)} kept).`);
  console.log("Copy it OFF this machine too — a backup on the same disk is not a safety net.");
})();
