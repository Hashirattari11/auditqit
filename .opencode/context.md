# Project Context

## Status: Vercel build failing — needs fix

## Problem
Vercel is building commit `decc8be` (first commit, missing deps) instead of `0a9215f` (latest with deps). But `git log origin/main` shows `0a9215f` is on GitHub. So either Vercel is caching, or the user triggered deploy from an old commit.

## Current State
- Repo: https://github.com/Hashirattari11/auditqit
- Commits on main: `0a9215f` (latest, has deps) → `decc8be` (initial)
- Local: D:\auditiq, git synced with origin/main
- Dev server was running on localhost:3000

## Last Action
- Verified git log shows `0a9215f` is latest on both local and remote
- User said Vercel still shows old commit in build log

## Possible Causes
1. Vercel auto-deploy triggered from old commit before push completed
2. Vercel build cache showing old result
3. User needs to trigger a new deployment from Vercel dashboard

## Fix Options
1. Tell user to click "Redeploy" in Vercel dashboard on the latest deployment
2. Make a small empty commit and push to trigger fresh build
3. Check if `next.config.js` has wrong `serverComponentsExternalPackages` config — `@sparticuz/chromium` and `resend` should NOT be in external packages if they need to be bundled

## Also Need to Check
- `next.config.js` may be misconfigured — external packages list may cause issues
- PDF routes use dynamic import which is good, but webpack still resolves at build time
- Need to verify all pages compile after deps added

## Next Steps
1. Make a small commit to force Vercel rebuild from latest
2. Also fix next.config.js if needed
3. Verify build works locally first: `npm run build`
4. Tell user to redeploy
