import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Retry reads to handle Supabase eventual consistency
    let audit = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      audit = await db.getAudit(id);
      if (audit && audit.status === 'completed' && audit.results && Object.keys(audit.results).length > 0) {
        break;
      }
      if (audit && audit.status === 'failed') break;
      // Wait 500ms before retry
      await new Promise(r => setTimeout(r, 500));
    }

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: audit.id,
      url: audit.url,
      status: audit.status,
      results: audit.results,
      aiSummary: audit.ai_summary,
      createdAt: audit.created_at,
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error('Failed to get audit report:', error);
    return NextResponse.json(
      { error: 'Failed to get audit report' },
      { status: 500 }
    );
  }
}
