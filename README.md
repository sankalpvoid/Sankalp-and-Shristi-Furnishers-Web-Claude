# Sankalp & Shristi Furnishers — website

*Crafted for Living.* A furniture showroom + workshop website: catalogue, four
"design your own" configurators with shareable reference numbers, enquiry and
showroom-visit workflows, and a private owner/staff admin.

Stack: Next.js 16 (App Router) · TypeScript · SQLite (`better-sqlite3`) · plain CSS · zod. No paid services.

## Run it

```bash
npm install
cp .env.example .env.local     # then edit: ADMIN_PASSWORD, SESSION_SECRET
npm run dev                    # http://localhost:3000
```

The database (`data/ssfi.db`) is created and seeded automatically on first run.
`npm run db:reset` wipes it and re-seeds. Uploaded photos live in `data/uploads/`.

| Variable | Required | Purpose |
|---|---|---|
| `ADMIN_USERNAME` | no (default `owner`) | Admin sign-in name |
| `ADMIN_PASSWORD` | **yes** for `/admin` | Admin password (never in code; admin stays locked until it is set) |
| `SESSION_SECRET` | **yes** for `/admin` | 16+ random chars signing the session cookie (`openssl rand -hex 32`) |
| `DATA_DIR` | no | Where the DB + uploads live |
| `NEXT_PUBLIC_SITE_URL` | no | Canonical site URL |

Checks: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

Browser journeys (need a running server and Playwright; they create test data, so use a throw-away database):
```bash
DATA_DIR=/tmp/ssfi-test npm run dev &                       # or: npm run build && npm start
export NODE_PATH=$(npm root -g) ADMIN_PASSWORD=… DATA_DIR=/tmp/ssfi-test BASE_URL=http://localhost:3000
node e2e/configurators.cjs   # all four configurators: save, share link, restore, privacy, admin retrieval
node e2e/admin.cjs           # admin security, product management, image upload, CSV import, login throttle
node e2e/claims.cjs          # owner claims hidden until verified
```

See also [SECURITY.md](SECURITY.md) (controls and shared-login limitations) and [DEPLOYMENT.md](DEPLOYMENT.md) (persistent-disk requirement, Docker, backups, restore).

## Look and feel

Contemporary editorial design: ivory paper, charcoal, one brass accent, large type, squared quiet buttons, big 5:4 product images. Temporary imagery is **studio renders generated locally** (`tools/render`, three.js) and always labelled "Studio render · placeholder" — they are not photographs of our stock, showroom or workshop. Real photos uploaded in admin always override them. See [docs/design/README.md](docs/design/README.md) for the design critique, before/after screenshots, how to swap in real photography, and how to regenerate renders.

## What's here

- **Storefront**: homepage, categories, product pages, shortlist (browser-only), showroom + "Plan your visit", contact, The Art of Making (scroll story; static fallback for no-JS / reduced motion), privacy note.
- **Configurators** (bed, sofa, sofa-cum-bed, dining table): options come from the database and are editable in admin; per-product option limits; "unavailable combination" rules; server-side validation. Saving gives a reference such as `SSFI-BED-AB12CD` and a shareable link (`/design/saved/<ref>`) that restores the design. Saved designs never contain contact details. **The preview is a layered SVG illustration — not 3D and not a photograph**, and is labelled as such. `Product.model_url` is reserved for a future real 3D viewer.
- **Sales workflow**: intent choices (exploring / quotation / visit / ready to order) → enquiries saved to the DB, linked to product and configuration. Nothing is priced automatically; there is **no checkout and no payment**.
- **Admin** (`/admin`): dashboard + launch checklist, enquiry pipeline (New → Contacted → Quotation sent → Negotiating → Converted/Lost) with filters, notes, follow-up dates, call/WhatsApp/email shortcuts; saved-design lookup by reference; products (status, source, verification, price visibility, sales method, photos with automatic resize to WebP); categories; configurator options; brand/contact/story settings; inventory CSV import.
- **Privacy/security**: admin pages and every admin action re-check a signed HttpOnly session; the public product mapper whitelists fields (quantity, notes, source refs never leave the server); server-side zod validation; rate limits and a honeypot on public forms; login throttling; prices only shown when the owner sets "Fixed price" + "Show".

## Tally inventory: honest status

**No Tally export or inventory file existed in the workspace** (searched the whole machine for `.xlsx/.xls/.csv/.json/.xml` and names containing "tally"/"inventory"). Nothing was imported or invented.

- The 18 starter products are **"Proposed seed product"**, *Unverified*, with no price, quantity, SKU, dimensions or photograph. Customers see a "Sample design" tag, a notice on the product page and an "Illustration" label. Unverified products can never show a public price or an "in stock" claim (enforced in the admin form and again in the public data mapper), and cannot be one-click published from the product list. Review each one in Admin → Products: verify, edit or unpublish.
- When you have the export: Admin → **Import inventory** (or `npm run import:tally -- file.csv`). It finds the header row, recognises Tally-style columns (`Particulars`, `Stock Group`, `Closing Balance`, `Part No`, …) and the template at `public/templates/ssfi-catalogue-import-template.csv`. Imported items arrive as *Needs review*, **not on the public site, prices hidden**; duplicates (compared on a normalised name), total rows, blank names, invalid quantities/prices and unknown categories are skipped or left blank and listed in the report; quantities and Tally "rate/value" go to internal fields/notes only. A per-import report is stored. Excel files must be saved as CSV first.

## Unverified / placeholder content (check before launch)

- Contact details, address, hours, map and social links are **empty placeholders** (Admin → Brand & contact). WhatsApp/call buttons stay hidden until numbers are set.
- **"Oldest furniture showroom on Ring Road / first in the market" is HIDDEN from the public site.** The wording is kept as an editable draft in Admin → Brand & contact; it appears only after the owner ticks "I have verified…".
- **The five-year guarantee is HIDDEN everywhere publicly** (home page and product pages, including any per-product guarantee text). Draft wording is preserved in admin and shows only after the owner ticks the guarantee confirmation. No terms are invented.
- Option lists (sizes, finishes, fabrics, storage, mechanisms) are **suggested defaults** — mark what you really offer. Size labels are indicative only. The default "unavailable combination" rules for dining tables are suggestions.
- "Solid teak" wording is limited to our solid-teak range; seed products say "owner-stated, confirm for this design".
- All imagery is temporary: studio renders and illustration artwork, each labelled as such. Replace via admin uploads (hero, logo, workshop stages, product photos) — no code changes. Temporary logo "SSFI" is replaced by setting a logo image.
- The privacy note is draft wording, not legal advice.

## Database & production notes

Schema is in `src/db/schema.ts` and applies automatically (no manual setup); forward-only `MIGRATIONS` there keep existing data safe on upgrade. **Supabase is not used in this demo**; the app is SQLite so it runs with zero credentials. Data access is concentrated in `src/lib/repo.ts`, `src/lib/settings.ts` and a few `db()` calls in API routes/actions, so moving to Postgres/Supabase later is a contained job (port the schema, swap the driver, add Row Level Security so enquiries stay private). **SQLite + local uploads need a host with a persistent disk (a small VPS or a container with a mounted volume) and a single app instance — serverless/ephemeral hosts like Vercel will lose `data/`.** Full instructions, backups and restore are in [DEPLOYMENT.md](DEPLOYMENT.md). Check each provider's free-tier terms for commercial use before choosing; none were assumed.

## Not done / simulated

- No real 3D models (previews are SVG illustrations); no online checkout/payments (data model has `online_purchase_approved` and `online_future` for later).
- No email/SMS notifications; staff see enquiries in the dashboard. Follow-up dates are shown on the dashboard, not pushed as reminders.
- Single shared admin login (no per-staff accounts, MFA, password reset or server-side session revocation — see SECURITY.md); "Assigned to" is free text.
- No automated appointment booking (by design).
