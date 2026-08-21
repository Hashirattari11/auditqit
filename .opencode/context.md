# Project Context — AuditIQ

## Environment
- **Deployed**: `https://auditqit-0-eight.vercel.app`
- **GitHub**: `https://github.com/Hashirattari11/auditqit`
- **Database**: Supabase `https://iewczdhpgrgvqmohubgp.supabase.co`
- **Admin**: `hashirattari73@gmail.com` / `Hashir@098`
- **Vercel Token**: (stored in env, not committed)
- **AI**: NVIDIA NIM — `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`
- **Tech**: Next.js 14.2.29, Supabase (NOT Prisma), OpenAI SDK for NVIDIA NIM

## ACTIVE: Bug Detection System Fix — IN PROGRESS

### Completed (this session):
- `workers/playwright.ts` — REWRITTEN: Added 10-point `page.evaluate()` frontend bug detection (alt text, empty links, form labels, buttons, mixed content, H1 count, viewport, inline styles, console.log in prod, render-blocking scripts). Returns `frontendBugs[]` + `frontendBugCount`.
- `workers/ai-summary.ts` — REWRITTEN: Now includes `frontendBugs` in allIssues, updated prompt to focus on TOP 5 bugs with real data references.
- `workers/index.ts` — Updated catch fallback to include `frontendBugs: []` and `frontendBugCount: 0`.

### IN PROGRESS (Worker timed out — DO THIS NEXT):
- `app/report/[id]/page.tsx` — NEEDS REWRITE: Add Bug interface, combine allBugs from 6 sources (frontendBugs + consoleErrors + failedRequests + security issues + SEO issues + broken links), add "Bugs Found" section with severity grouping ABOVE AI summary, add AI unavailable fallback message.

### Key changes needed in report page:
1. Add `Bug` interface
2. Move Score Cards ABOVE AI summary
3. Add bug aggregation code (allBugs array sorted by severity)
4. Add "🐛 Bugs Found" section with severity-colored groups (critical=red, high=orange, medium=yellow, low=blue)
5. Each bug shows: type, category badge, severity badge, element code snippet, fix suggestion
6. Empty state: "✅ No bugs detected!" with green border
7. AI summary comes AFTER bugs section
8. Add AI unavailable message if no ai.summary

### After report page fix:
- `npx tsc --noEmit` to verify
- `git add` + `git commit` + `git push`
- Vercel auto-deploys

## Previously Committed
- `e4b3c75` — Complete audit engine + UI overhaul (12 files, 1168 insertions)
- `131609c` — Earlier bug fixes
- `fd2ddd9` — Audit stuck auto-fail + reduced timeouts

## Key Lessons
- Supabase 406 error: use RPC
- `.catch()` doesn't work on Supabase query builder
- Local machine can't reach NVIDIA API (Vercel-only)
- OpenCode 13 agents in `.opencode/agents/`
- `lib/audit-runner.ts` `runAuditInline()` is actual execution path (status endpoint polling)
- Tailwind dynamic classes need safelist or use inline styles for dynamic colors
