import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runGitHubAuditInline } from '@/lib/github-audit-runner';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const audit = await db.getRepoAudit(id);

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    if (audit.status === 'running') {
      return NextResponse.json({
        id: audit.id,
        repoUrl: audit.repo_url,
        owner: audit.owner,
        repo: audit.repo,
        status: 'running',
        currentStep: audit.current_step || 'Working...',
        createdAt: audit.created_at,
      });
    }

    if (audit.status === 'completed' || audit.status === 'failed') {
      return NextResponse.json({
        id: audit.id,
        repoUrl: audit.repo_url,
        owner: audit.owner,
        repo: audit.repo,
        status: audit.status,
        currentStep: '',
        results: audit.results,
        aiSummary: audit.ai_summary,
        createdAt: audit.created_at,
      });
    }

    // PENDING: atomically claim and run
    const claimed = await db.claimRepoAudit(audit.id);

    if (!claimed) {
      const fresh = await db.getRepoAudit(audit.id);
      return NextResponse.json({
        id: audit.id,
        repoUrl: audit.repo_url,
        owner: audit.owner,
        repo: audit.repo,
        status: fresh?.status || 'running',
        currentStep: fresh?.current_step || 'Starting...',
        createdAt: audit.created_at,
      });
    }

    console.log(`GitHub audit ${audit.id} claimed — running synchronously...`);
    const runResult = await runGitHubAuditInline(audit.repo_url, audit.id);

    return NextResponse.json({
      id: audit.id,
      repoUrl: audit.repo_url,
      owner: audit.owner,
      repo: audit.repo,
      status: runResult.status,
      currentStep: '',
      results: runResult.results,
      aiSummary: runResult.aiSummary,
      createdAt: audit.created_at,
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    console.error('Failed to get GitHub audit status:', error);
    return NextResponse.json({ error: 'Failed to get audit status' }, { status: 500 });
  }
}
