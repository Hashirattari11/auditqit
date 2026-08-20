import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runAuditInline } from '@/lib/audit-runner';

export const dynamic = 'force-dynamic';
// Vercel Pro allows up to 300s for serverless functions
export const maxDuration = 300;

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

    // AUDIT RUNNING: another instance claimed it — just return progress
    if (audit.status === 'running') {
      return NextResponse.json({
        id: audit.id,
        url: audit.url,
        status: 'running',
        currentStep: audit.current_step || 'Working...',
        createdAt: audit.created_at,
      }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    }

    // AUDIT COMPLETED/FAILED: just return the result
    if (audit.status === 'completed' || audit.status === 'failed') {
      return NextResponse.json({
        id: audit.id,
        url: audit.url,
        status: audit.status,
        currentStep: '',
        results: audit.results,
        aiSummary: audit.ai_summary,
        createdAt: audit.created_at,
      }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    }

    // AUDIT PENDING: atomically claim it (prevents duplicate runs across instances)
    const claimed = await db.claimAudit(audit.id);

    if (!claimed) {
      // Someone else claimed it — return running status
      const fresh = await db.getAudit(audit.id);
      return NextResponse.json({
        id: audit.id,
        url: audit.url,
        status: fresh?.status || 'running',
        currentStep: fresh?.current_step || 'Starting...',
        createdAt: audit.created_at,
      }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    }

    // WE WON THE RACE: run audit SYNCHRONOUSLY within this request
    // Vercel keeps the function alive as long as we're processing
    console.log(`Audit ${audit.id} claimed — running synchronously...`);
    await runAuditInline(audit.url, audit.id);

    // Return the final result
    const completed = await db.getAudit(audit.id);
    return NextResponse.json({
      id: completed!.id,
      url: completed!.url,
      status: completed!.status,
      currentStep: '',
      results: completed!.results,
      aiSummary: completed!.ai_summary,
      createdAt: completed!.created_at,
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });

  } catch (error) {
    console.error('Failed to get audit status:', error);
    return NextResponse.json(
      { error: 'Failed to get audit status' },
      { status: 500 }
    );
  }
}
