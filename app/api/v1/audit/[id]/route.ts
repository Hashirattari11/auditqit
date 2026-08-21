import { NextRequest, NextResponse } from 'next/server';
import { validateApiRequest } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { runAuditInline } from '@/lib/audit-runner';
import { runGitHubAuditInline } from '@/lib/github-audit-runner';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await validateApiRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = params;

  // Try web audit first, then GitHub audit
  let audit = await db.getAudit(id);
  let type = 'website';

  if (!audit) {
    audit = await db.getRepoAudit(id);
    type = 'github';
  }

  if (!audit) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });

  // If pending, claim and run inline
  if (audit.status === 'pending') {
    if (type === 'website') {
      const claimed = await db.claimAudit(id);
      if (claimed) {
        const result = await runAuditInline(audit.url || (audit as any).repo_url, id);
        return NextResponse.json({
          id, type, status: result.status,
          scores: calculateScores(result.results),
          results: result.results,
          aiSummary: result.aiSummary,
        });
      }
    } else {
      const claimed = await db.claimRepoAudit(id);
      if (claimed) {
        const result = await runGitHubAuditInline((audit as any).repo_url, id);
        return NextResponse.json({
          id, type, status: result.status,
          scores: calculateScores(result.results),
          results: result.results,
          aiSummary: result.aiSummary,
        });
      }
    }
  }

  // Already running or completed
  const scores = calculateScores(audit.results);
  return NextResponse.json({
    id, type, status: audit.status,
    scores,
    results: audit.results,
    aiSummary: type === 'website' ? (audit as any).ai_summary : (audit as any).ai_summary,
  });
}

function calculateScores(results: any) {
  if (!results) return { overall: 0, performance: 0, seo: 0, security: 0 };
  const scores: Record<string, number> = {};
  let count = 0;
  let total = 0;

  if (results.lighthouse?.performance) { scores.performance = results.lighthouse.performance; total += results.lighthouse.performance; count++; }
  if (results.lighthouse?.seo) { scores.seo = results.lighthouse.seo; total += results.lighthouse.seo; count++; }
  if (results.seo?.score !== undefined) { scores.seo = scores.seo || results.seo.score; total += results.seo.score; count++; }
  if (results.headers?.securityHeaders) {
    const present = Object.values(results.headers.securityHeaders).filter((h: any) => h?.present).length;
    const total2 = Object.values(results.headers.securityHeaders).length;
    scores.security = total2 > 0 ? Math.round((present / total2) * 100) : 0;
    total += scores.security; count++;
  }

  scores.overall = count > 0 ? Math.round(total / count) : 0;
  return scores;
}
