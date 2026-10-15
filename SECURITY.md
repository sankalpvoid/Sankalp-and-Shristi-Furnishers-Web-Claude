# Security notes

## What is protected, and how

| Area | Control |
|---|---|
| Admin pages (`/admin/*`) | Every page and the admin layout call `requireAdmin()`; unauthenticated requests are redirected to `/admin/login` and receive no admin data. |
| Admin changes | All admin writes are server actions. Each one (except `login`/`logout`) calls `await requireAdmin()` first, so replaying a captured action request without a session changes nothing. `tests/security.test.ts` fails the build if a new action forgets this, if the actions file exports anything other than async functions, or if a client component references a secret. |
| Session | Signed (HMAC-SHA256) cookie, `HttpOnly`, `SameSite=Lax`, `Secure` in production, 8-hour lifetime, constant-time signature and password comparison. Secrets come only from environment variables. |
| Login abuse | 8 attempts / 15 min per IP, plus a global 40 / 15 min limit (because `X-Forwarded-For` can be spoofed unless a trusted proxy sets it). |
| Production password | In production, admin stays locked unless `ADMIN_PASSWORD` is 12+ characters and not the placeholder, and `SESSION_SECRET` is 16+ characters. |
| Customer data | Enquiries and saved-design notes are readable only through admin. Public product data passes through a whitelist mapper (`toPublic`), so stock quantity, internal notes, cost/rate and source references never reach a browser. |
| Shared design links | `/design/saved/<ref>` shows only the chosen options. It never includes name, phone, email, notes, or enquiry data (verified by `e2e/configurators.cjs`). References are 6 random characters from a 31-symbol alphabet (~887 million combinations), the page is `noindex`, but **anyone with the link can see the design** — it is not secret. |
| Public forms | Server-side zod validation, per-IP rate limits, honeypot field; product and configuration references are resolved on the server (client-supplied names/prices are ignored). |
| Uploads | Decoded and re-encoded to WebP by `sharp` (not served as uploaded), random filenames, 12 MB cap, served only from a strict filename pattern (no path traversal). |
| Injection / XSS | Parameterised SQL everywhere; React escapes output; URL settings must be `https://` or `/uploads/…`. |
| Secrets in git | `.env`, `.env.local`, `.env.production` and the database are git-ignored; `.env.example` holds no values. |

## Limitations of the shared-login approach (please read)

- **One shared account.** Everyone with the password is "owner". There are no per-person accounts, roles, or audit trail of who changed what (notes record only the shared username).
- **No password reset or MFA.** To change the password, change `ADMIN_PASSWORD` and restart; this also invalidates nothing already issued.
- **No server-side session revocation.** Signing out only deletes the browser cookie. A stolen cookie stays valid until it expires (8 hours) unless you change `SESSION_SECRET` and restart, which invalidates **all** sessions.
- **Rate limiting is per-IP and best effort.** Behind a proxy, make sure it overwrites (not appends to) `X-Forwarded-For`; otherwise the per-IP limit can be evaded (the global limit still applies).
- **Staff leaving = rotate the password.** Treat the password like a shared key.
- **Not hardened for a hostile admin.** Admin users are trusted: they can edit any content, view all enquiries and delete data.
- **No automatic security headers beyond the basics** (`nosniff`, frame, referrer). Add HSTS and a CSP at the reverse proxy.
- Enquiry data contains personal phone numbers/emails. Back-ups contain them too — store them privately.

## Recommended before going live
1. Set a long random `ADMIN_PASSWORD` and `SESSION_SECRET` (`openssl rand -base64 24` / `openssl rand -hex 32`) in the host's secret store.
2. Serve only over HTTPS; keep the app bound to localhost behind the proxy.
3. Schedule `npm run backup` and copy backups off the machine.
4. If more than one or two people need access, plan per-user accounts (the next step up from this design).
