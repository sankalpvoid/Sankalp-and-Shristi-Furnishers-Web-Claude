# Deployment

## The one rule: SQLite needs a persistent disk

This app stores everything (products, enquiries, saved designs, settings) in a single SQLite file, and photos as files, under `DATA_DIR` (default `./data`).

**Do not deploy it to a host with an ephemeral filesystem** (Vercel, Netlify, most serverless/"scale to zero" containers, Heroku-style dynos, or any container without a mounted volume). Data would silently vanish on each restart or deploy. Also run **exactly one instance**: SQLite is not for multiple app servers sharing a file over a network drive.

Suitable: a small VPS/VM with a normal disk, or a container host that gives you a durable volume. (Pricing and free-tier/commercial-use terms differ per provider — check the current terms yourself; nothing is assumed here.)

## Option A — Docker (recommended)

```bash
cp .env.example .env.production       # edit: ADMIN_PASSWORD (12+ chars), SESSION_SECRET, optionally NEXT_PUBLIC_SITE_URL
docker compose up -d --build
curl -s http://127.0.0.1:3000/api/health      # {"ok":true}
```
The compose file mounts the named volume `ssfi-data` at `/data`; the database, uploads and backups live there and survive rebuilds and upgrades. Put Caddy or nginx in front for HTTPS (proxy to `127.0.0.1:3000`, overwrite `X-Forwarded-For`). *The Dockerfile was written but not built in the development environment — do a test build before relying on it.*

## Option B — plain Node on a VM

```bash
npm ci && npm run build
export NODE_ENV=production DATA_DIR=/var/lib/ssfi ADMIN_PASSWORD=… SESSION_SECRET=…
mkdir -p $DATA_DIR && npm start            # run under systemd/pm2 with these variables, bound behind HTTPS proxy
```

## Upgrades keep your data
- The database is never recreated. Starter data is only loaded when the `categories` table is empty (first run).
- Schema changes ship as forward-only entries in `MIGRATIONS` (`src/db/schema.ts`), applied automatically at start-up and recorded in `meta.schema_version`.
- Upgrade = take a backup → pull new code → rebuild/restart. Never run `npm run db:reset` in production (it deletes the database).

## Backups (do this before launch)
```bash
npm run backup                         # → $DATA_DIR/backups/<timestamp>/ssfi.db + uploads/ (keeps newest 14)
BACKUP_DIR=/mnt/offsite npm run backup # elsewhere
```
Schedule with cron (e.g. nightly) and copy off the machine. In Docker: `docker compose exec web npm run backup`, then copy from the volume.

**Restore:** stop the app, replace `$DATA_DIR/ssfi.db` (and delete any `ssfi.db-wal`/`-shm`) with the backup file, copy `uploads/` back, start the app. Practise this once.

## Go-live checklist
- [ ] Strong `ADMIN_PASSWORD` and `SESSION_SECRET` set as secrets (never in git; the app refuses admin on a default/short password in production).
- [ ] HTTPS in front; port 3000 not exposed publicly.
- [ ] Persistent volume confirmed (restart the container and check data is still there).
- [ ] Backups scheduled and one restore tested.
- [ ] Admin → Brand & contact: phone, WhatsApp, address, hours, map filled in.
- [ ] Owner has verified (or left hidden) the “oldest showroom” claim and the five-year guarantee — both are hidden publicly until ticked.
- [ ] Sample products reviewed: verify, edit with real photos, or unpublish.
- [ ] No payment gateway is configured or needed; checkout does not exist.
