# Project Context: AuditIQ

## Environment
- **Deployed**: https://auditqit-0-eight.vercel.app
- **Repo**: https://github.com/Hashirattari11/auditqit
- **DB**: Supabase (remote) + Prisma (minimal Audit model only)
- **AI**: NVIDIA NIM via OpenAI SDK (nvidia/llama-3.3-nemotron-super-49b-v1)
- **Auth**: NextAuth v5 beta; admin: hashirattari73@gmail.com
- **Payments**: Stripe; **Email**: Resend

## Architecture Summary
- **Frontend**: Next.js 14.2.29 (App Router), React 18, Tailwind CSS
- **Backend**: Next.js API routes (30+ routes in `app/api/`)
- **Workers**: 11 audit workers in `workers/` (fetch, security, seo, links, playwright, ai-summary, lighthouse, linkchecker, github-audit, headers)
- **Lib**: 15 modules in `lib/` (auth, db, audit-runner, llm, queue, etc.)
- **Components**: 23 React components
- **Additional**: Browser extension (`extension/`), mobile app (`mobile/`), GitHub Action (`github-action/`)
- **Key deps**: Playwright, Cheerio, Lighthouse, Puppeteer-core, BullMQ/ioredis, Octokit

## Completed Work
1. **Engine rewrite** (commit e4b3c75): 6 workers rewritten, sequential 7-step pipeline
2. **Bug detection fix** (commit b508954): Playwright 10-point frontend bug detection
3. **Three viral features** (commits 0b73ce1, bc112bc, d6a61a6):
   - 🔥 Roast My Website (`/roast` + `/api/roast`)
   - ⚔️ VS Battle (`/vs` + `/api/vs`)
   - 🏢 Agency White-Label (`/agency`, `/portal/[slug]`, 5 API routes)
4. **DB Migration**: tables `roasts`, `vs_battles`, `agencies`, `agency_clients`, `client_audits`
5. **All deployed to production** ✅

## Current Task (INTERRUPTED)
User asked for **analysis-only** of the project — determine app type, frontend, backend, DB, architecture, and which specialist agents should improve it. No modifications allowed.
- Read `package.json`, directory listings for `app/`, `lib/`, `workers/`, `components/`
- **NOT YET READ**: key source files like `lib/audit-runner.ts`, `lib/db.ts`, `workers/index.ts`, `app/layout.tsx`, `app/page.tsx`, `middleware.ts`, `prisma/schema.prisma`, `tailwind.config.js`, `next.config.js`
- **NOT YET DONE**: Delegate analysis to specialist agents, produce final report
