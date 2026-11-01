# muteeb.in — Baba Muteeb, personal website

Dark-minimal personal site for Baba Muteeb, live at **[muteeb.in](https://muteeb.in)**.

Near-black canvas (`hsl(0 0% 4%)`), layered surfaces, crisp 1px borders and a single
code-green accent (`#22d472`) with glowing hover effects. Typography is **Sora** for
display/UI and **JetBrains Mono** for code, labels and terminal chrome.

## Stack

- React 19 + Vite 7 + TypeScript
- Tailwind CSS v4 (CSS-first `@theme` design tokens in `src/index.css`)
- Framer Motion (animation, drag, springs)
- Supabase (data + storage) via Vercel serverless functions in `api/`
- Web3Forms for contact email delivery
- Aceternity UI components in `src/components/ui/`

## Aceternity UI components used

| Component                    | Where                                                    |
| ---------------------------- | -------------------------------------------------------- |
| FloatingNavbar               | `Navbar.tsx` — pill nav that floats in on scroll          |
| NavbarMenu                   | `Navbar.tsx` — "Explore" dropdown with smooth spring menu |
| Floating terminal + cursor   | `Hero.tsx` — self-typing `muteeb.ts` code block           |
| PointerHighlight             | `Hero.tsx` — "Baba Muteeb" and the location chip          |
| FlipWords                    | `Hero.tsx` — rotating roles line                          |
| TextGenerateEffect           | Section intros (hero bio, projects, thoughts…)            |
| GridBackground               | Hero + contact sections                                   |
| ThreeDMarquee                | Projects + guestbook — live, continuously looping cards    |
| ExpandableCard               | Projects + thoughts — inline detail reveal                 |
| PlaceholdersAndVanishInput   | Thoughts search                                           |

## Develop

```bash
npm install
npm run dev
```

Optional `.env.local` (not required for the UI, used by Supabase auth):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Build

```bash
npm run build
npm run preview
```

## Data + admin

All content (profile, projects, thoughts, skills, guestbook, messages) lives in
Supabase and is served through the serverless functions in `api/`. The secret admin
studio is unchanged: open `/admin`, `#admin`, press `Ctrl/Cmd/Alt+Shift+A`, or type
`muteeb` anywhere. Guestbook entries require admin approval before going public.
The passcode is verified by the API and kept only in page memory for the active
admin session; saving content updates React state without reloading the document.
Closing the studio or reloading the page clears that session.

## Site controls

The admin studio's **SITE CONTROLS** tab can turn the website off (visitors see a
maintenance page; the admin studio stays reachable), set the default colour palette,
show or hide sections, close the guestbook, and show an announcement banner.

Run once in Supabase (SQL Editor) before using it:

```sql
alter table public.profile add column if not exists site_settings jsonb;
```

(also in `supabase/migrations/`). Settings are read from `/api/settings` (public, cached
about 30 seconds) and written with `PUT /api/settings` (owner only, strictly validated).
If the column is missing, the site keeps running with the default settings.

`vercel.json` sets HSTS, `nosniff`, `X-Frame-Options: DENY`, a strict referrer policy and
a restrictive permissions policy on every response.

## Admin two-factor login (email codes via Resend)

Owner login is two steps: the admin password, then a 6-digit code emailed through
[Resend](https://resend.com). A successful login gives an 8-hour session. The password
alone no longer unlocks the admin API.

Setup:

1. Run `supabase/migrations/2026-11-01_admin_2fa.sql` in Supabase (SQL Editor).
2. In Vercel (project → Settings → Environment Variables), set as **Secret** for Production and Preview:

| Variable | Value |
| --- | --- |
| `ADMIN_PASSWORD` | the admin password (step 1) |
| `RESEND_API_KEY` | Resend API key with sending access |
| `ADMIN_2FA_EMAIL` | the inbox that receives login codes |
| `ADMIN_2FA_FROM` | sender on a verified Resend domain, e.g. `alerts@muteeb.in` |
| `ADMIN_2FA_SECRET` | random 64+ character string, used to sign sessions and codes |

3. Redeploy. Until every variable is set, the login returns "not configured" and the admin studio stays closed.

Codes expire after 10 minutes, lock after 3 wrong tries, and at most 5 codes can be requested per 15 minutes.
Changing `ADMIN_2FA_SECRET` signs everyone out.

## Keeping the database awake

Supabase free projects pause after about a week without API activity. The workflow
`.github/workflows/keep-supabase-awake.yml` runs every 3 days and reads from the
database. It needs two repository secrets (GitHub → Settings → Secrets and variables → Actions):

| Secret              | Value                                   |
| ------------------- | --------------------------------------- |
| `SUPABASE_URL`      | Same as `NEXT_PUBLIC_SUPABASE_URL`      |
| `SUPABASE_ANON_KEY` | Same as `VITE_SUPABASE_ANON_KEY`        |

Public read endpoints (`/api/profile`, `/api/projects`, `/api/thoughts`, `/api/skills`,
`/api/guestbook`) send `Cache-Control: public, s-maxage=60, stale-while-revalidate=3600`,
so repeat visitors get content from the CDN immediately. Admin responses are never cached.

## Security

The site is protected in three layers:

1. **Supabase RLS** — enabled on every table with no public policies, so the anon
   key (held by the browser) can never read or write data directly.
2. **`api/` serverless functions** — the only data gateway (service-role key).
   Every mutation, every PII read (the messages inbox contains sender e-mails) and
   every write to the public `images` bucket requires the `X-Admin-Auth` header
   matching the `ADMIN_PASSWORD` env var (constant-time compare, fails closed when
   the env var is unset). Public endpoints are read-only and return no secrets
   (`admin_passcode` is stripped from every response).
3. **Shared hardening helpers** (`api/_security.js`) — origin allowlist CORS
   (never `*`, unknown origins get no headers / 403 preflight), input validation
   (lengths, e-mail format, http(s)-only URLs, whitelisted visual options),
   strict JSON body parsing, and 500s that never echo internals.

The browser's failed-attempt pause is a user-interface safeguard, not a substitute
for server-side rate limiting. Use a long, unique `ADMIN_PASSWORD` and apply
hosting-level rate limits to `/api/profile` if brute-force resistance is required.

Environment variables:

| Var                    | Required | Notes                                        |
| ---------------------- | -------- | -------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes  | Supabase project URL                         |
| `SUPABASE_SERVICE_ROLE_KEY` | yes  | Used only inside `api/` functions            |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | yes | Browser (auth only) |
| `ADMIN_PASSWORD`       | yes      | Admin studio passcode; all mutations 401 without it |
| `CORS_ALLOWED_ORIGINS` | no       | Comma-separated extra exact origins (default: `https://muteeb.in`, localhost, `*.vercel.app`) |

Security regression suite (25 tests, runs the real API handlers in-process
against an in-memory Supabase — no network, no live keys):

```bash
npm ci
node security-recovery/run-security-tests.mjs   # expect: 25 passed
```

## Structure

| Section             | Component                |
| ------------------- | ------------------------ |
| Floating navbar     | `src/components/Navbar.tsx`   |
| Hero + terminal     | `src/components/Hero.tsx`     |
| Projects (+ stack)  | `src/components/ProjectsSection.tsx` |
| Now & quick facts   | `src/components/NowSection.tsx` |
| Stack / tools       | `src/components/TechMatrix.tsx` |
| Thoughts & articles | `src/components/ThoughtsSection.tsx` |
| Guestbook           | `src/components/GuestbookSection.tsx` |
| Contact terminal    | `src/components/ContactTerminal.tsx` |
| Footer              | `src/components/Footer.tsx`    |
| Admin studio        | `src/components/AdminModal.tsx` |
