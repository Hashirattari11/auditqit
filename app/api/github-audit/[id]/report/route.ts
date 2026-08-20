import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    return NextResponse.json({
      id: audit.id,
      repoUrl: audit.repo_url,
      owner: audit.owner,
      repo: audit.repo,
      status: audit.status,
      results: audit.results,
      aiSummary: audit.ai_summary,
      createdAt: audit.created_at,
    });
  } catch (error) {
    console.error('Failed to get GitHub audit report:', error);
    return NextResponse.json(
      { error: 'Failed to get audit report' },
      { status: 500 }
    );
  }
}
