import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runAuditInline, isAuditRunning } from '@/lib/audit-runner';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const audit = await db.getAudit(id);

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    // If audit is still "pending", trigger it NOW (serverless pattern)
    // The polling client keeps this endpoint alive long enough for the audit to run
    if (audit.status === 'pending' && !isAuditRunning(audit.id)) {
      // Fire and forget — but the polling client keeps the function alive
      runAuditInline(audit.url, audit.id).catch(() => {});

      // Return "running" so the UI shows progress
      return NextResponse.json({
        id: audit.id,
        url: audit.url,
        status: 'running',
        currentStep: 'Starting audit...',
        createdAt: audit.created_at,
      }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }

    return NextResponse.json({
      id: audit.id,
      url: audit.url,
      status: audit.status,
      currentStep: audit.current_step,
      createdAt: audit.created_at,
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error('Failed to get audit status:', error);
    return NextResponse.json(
      { error: 'Failed to get audit status' },
      { status: 500 }
    );
  }
}
