import { NextRequest, NextResponse } from 'next/server';
import { validateApiRequest } from '@/lib/api-auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const auth = await validateApiRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { url } = body;
    if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 });

    const audit = await db.createAudit(url, auth.user?.id);
    return NextResponse.json({ auditId: audit.id, status: 'queued', estimatedTime: 60 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
