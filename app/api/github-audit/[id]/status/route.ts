import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runGitHubAuditInline, isGitHubAuditRunning } from '@/lib/github-audit-runner';

export const dynamic = 'force-dynamic';

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

    // Serverless pattern: trigger audit when status is "pending"
    if (audit.status === 'pending' && !isGitHubAuditRunning(audit.id)) {
      runGitHubAuditInline(audit.repo_url, audit.id).catch(() => {});

      return NextResponse.json({
        id: audit.id,
        repoUrl: audit.repo_url,
        owner: audit.owner,
        repo: audit.repo,
        status: 'running',
        currentStep: 'Starting audit...',
        createdAt: audit.created_at,
      });
    }

    return NextResponse.json({
      id: audit.id,
      repoUrl: audit.repo_url,
      owner: audit.owner,
      repo: audit.repo,
      status: audit.status,
      currentStep: audit.current_step,
      createdAt: audit.created_at,
    });
  } catch (error) {
    console.error('Failed to get GitHub audit status:', error);
    return NextResponse.json({ error: 'Failed to get audit status' }, { status: 500 });
  }
}
