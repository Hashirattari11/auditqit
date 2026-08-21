import { NextRequest, NextResponse } from 'next/server';
import { validateApiRequest } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { runAuditInline } from '@/lib/audit-runner';

export async function POST(request: NextRequest) {
  const auth = await validateApiRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { url } = body;
    if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 });

    // Validate URL
    try { new URL(url); } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const audit = await db.createAudit(url, auth.user?.id);

    // Run audit inline (synchronous)
    const result = await runAuditInline(url, audit.id);

    return NextResponse.json({
      auditId: audit.id,
      status: result.status,
      results: result.results,
      aiSummary: result.aiSummary,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
