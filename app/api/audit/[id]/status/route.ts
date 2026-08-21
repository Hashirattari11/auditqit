import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runAuditInline } from '@/lib/audit-runner';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log(`[status] GET /api/audit/${id}/status`);
    const audit = await db.getAudit(id);

    if (!audit) {
      console.log(`[status] Audit ${id} not found`);
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    console.log(`[status] Audit ${id} status=${audit.status} step=${audit.current_step}`);

    if (audit.status === 'running') {
      return NextResponse.json({
        id: audit.id, url: audit.url, status: 'running',
        currentStep: audit.current_step || 'Working...',
        createdAt: audit.created_at,
      }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    }

    if (audit.status === 'completed' || audit.status === 'failed') {
      return NextResponse.json({
        id: audit.id, url: audit.url, status: audit.status,
        currentStep: '', results: audit.results, aiSummary: audit.ai_summary,
        createdAt: audit.created_at,
      }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    }

    console.log(`[status] Audit ${id} is pending — attempting claim...`);
    const claimed = await db.claimAudit(audit.id);
    console.log(`[status] Audit ${id} claimed=${claimed}`);

    if (!claimed) {
      const fresh = await db.getAudit(audit.id);
      console.log(`[status] Audit ${id} not claimed — fresh status=${fresh?.status}`);
      return NextResponse.json({
        id: audit.id, url: audit.url,
        status: fresh?.status || 'running',
        currentStep: fresh?.current_step || 'Starting...',
        createdAt: audit.created_at,
      }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    }

    console.log(`[status] Audit ${id} claimed — running synchronously...`);
    const startTime = Date.now();
    const runResult = await runAuditInline(audit.url, audit.id);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[status] Audit ${id} finished in ${elapsed}s — status=${runResult.status}`);

    // Return results directly from runAuditInline (no DB re-read needed)
    return NextResponse.json({
      id: audit.id, url: audit.url, status: runResult.status,
      currentStep: '', results: runResult.results, aiSummary: runResult.aiSummary,
      createdAt: audit.created_at,
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });

  } catch (error) {
    console.error('[status] Failed:', error);
    return NextResponse.json(
      { error: 'Failed to get audit status' },
      { status: 500 }
    );
  }
}
