import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runAuditInline } from '@/lib/audit-runner';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const audit = await db.getAudit(id);

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    // Reset the existing audit to pending
    await db.updateAudit(id, {
      status: 'pending',
      current_step: '',
      results: {} as any,
      ai_summary: '',
    });

    // The status endpoint will pick it up and run it synchronously
    return NextResponse.json({
      auditId: id,
      status: 'pending',
      message: 'Re-run started',
      url: audit.url,
    });
  } catch (error) {
    console.error('Failed to re-run audit:', error);
    return NextResponse.json(
      { error: 'Failed to re-run audit' },
      { status: 500 }
    );
  }
}
