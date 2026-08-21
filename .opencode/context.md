# Project Context — AuditIQ

## Environment
- **Deployed**: `https://auditqit-0-eight.vercel.app`
- **GitHub**: `https://github.com/Hashirattari11/auditqit`
- **DB**: Supabase `https://iewczdhpgrgvqmohubgp.supabase.co`
- **AI**: NVIDIA NIM via OpenAI SDK
- **Tech**: Next.js 14.2.29, Supabase, NextAuth, Stripe, Resend, Playwright

## COMPLETED THIS SESSION
1. Bug detection fix (commit `b508954`)
2. Engine rewrite (commit `e4b3c75`)
3. Supabase tables: roasts, vs_battles, agencies, agency_clients, client_audits
4. DB helpers in lib/db.ts for all new tables
5. Navbar: 🔥 Roast + ⚔️ VS Battle links
6. Pricing: Agency $99/month tier

## THREE VIRAL FEATURES — IN PROGRESS

### Written Files:
- `app/api/roast/route.ts` ✅ — POST: runs audit, generates roast via AI, saves to DB
- `app/api/roast/recent/route.ts` ✅ — GET: last 5 public roasts
- `app/roast/page.tsx` ✅ — Full roast UI with fire card, share buttons, Twitter
- `app/api/vs/route.ts` ✅ — POST: parallel audit, category winners, AI commentary
- `app/api/vs/recent/route.ts` ✅ — GET: last 5 battles
- `app/vs/page.tsx` ✅ — Full battle UI with 3-col grid, table, commentary, share
- `app/api/agency/route.ts` ✅ — GET/POST/PUT agency CRUD
- `app/api/agency/clients/route.ts` ✅ — GET/POST clients

### STILL NEED TO WRITE:
- `app/api/agency/clients/[id]/route.ts` — client CRUD (GET/PUT/DELETE)
- `app/api/agency/clients/[id]/audit/route.ts` — run audit on client's site
- `app/api/agency/clients/[id]/report/route.ts` — email PDF report
- `app/agency/page.tsx` — Agency dashboard with tabs (Clients, Branding, Settings)
- `app/agency/setup/page.tsx` — Onboarding wizard (4 steps)
- `app/portal/[slug]/page.tsx` — Client portal login
- `app/portal/[slug]/dashboard/page.tsx` — Client dashboard (their data only)
- `app/portal/[slug]/reports/page.tsx` — Client report history
- `app/portal/[slug]/issues/page.tsx` — Client current issues

### AFTER ALL FILES:
1. `npx tsc --noEmit` — fix TS errors
2. `npm run build` — verify
3. git commit + push
4. Vercel deploy
