# Project Context

## CRITICAL: Fixing Supabase lazy init for Vercel build
- Error: `supabaseUrl is required` during `next build` "Collecting page data"
- Fix needed: `lib/db.ts` line 10-11 — `createClient()` runs at module load, env vars not available at build time
- Solution: Make `supabase` export a lazy getter function

## Repo
- GitHub: https://github.com/Hashirattari11/auditqit  
- Latest commit: `9c66117`
- Local: D:\auditiq, git clean

## Vercel Build Errors Fixed So Far
1. Missing deps (commit 0a9215f): @sparticuz/chromium, puppeteer-core, resend
2. Type errors (commit 9c66117): PDF chromium types, Buffer.from, Stripe lazy init, rpc().catch(), spread types
3. CURRENT: supabaseUrl required — db.ts module-level createClient

## Fixes Already Applied to local files (not yet committed)
- `next.config.js` — standalone output, all externals listed
- `.npmrc` — playwright_skip_browser_download=true
- `package.json` — build script: `prisma generate && next build`
- `vercel.json` — buildCommand with prisma generate

## Still Need
- Fix lib/db.ts lazy supabase client
- Commit all fixes and push
- Verify build passes locally
