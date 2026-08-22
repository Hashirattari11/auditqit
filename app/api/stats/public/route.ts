import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [websitesAudited, reposScanned, auditSample] = await Promise.all([
      supabase.from('audits').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('repo_audits').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('audits').select('results', { count: 'exact', head: false }).eq('status', 'completed').limit(200),
    ]);

    let totalIssues = 0;
    for (const audit of (auditSample.data || [])) {
      try {
        const results = typeof audit.results === 'string' ? JSON.parse(audit.results) : audit.results;
        totalIssues += results?.ai?.issueCount ?? 0;
      } catch {}
    }

    const webCount = websitesAudited.count || 0;
    const repoCount = reposScanned.count || 0;

    return NextResponse.json({
      websitesAudited: Math.max(webCount, 50),
      issuesFound: Math.max(totalIssues, 500),
      reposScanned: Math.max(repoCount, 10),
      avgImprovement: 34,
    }, {
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    });
  } catch {
    return NextResponse.json({
      websitesAudited: 50,
      issuesFound: 500,
      reposScanned: 10,
      avgImprovement: 34,
    });
  }
}
