import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const audit = await db.getRepoAudit(id);

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    // Reset the existing audit to pending
    await db.updateRepoAudit(id, {
      status: 'pending',
      current_step: '',
      results: {} as any,
      ai_summary: '',
    });

    return NextResponse.json({
      auditId: id,
      status: 'pending',
      message: 'Re-run started',
      repoUrl: audit.repo_url,
    });
  } catch (error) {
    console.error('Failed to re-run GitHub audit:', error);
    return NextResponse.json(
      { error: 'Failed to re-run GitHub audit' },
      { status: 500 }
    );
  }
}
