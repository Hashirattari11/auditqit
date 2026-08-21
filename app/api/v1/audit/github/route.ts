import { NextRequest, NextResponse } from 'next/server';
import { validateApiRequest } from '@/lib/api-auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const auth = await validateApiRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { repoUrl } = body;
    if (!repoUrl) return NextResponse.json({ error: 'repoUrl is required' }, { status: 400 });

    const url = new URL(repoUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });

    const [owner, repo] = parts;
    const audit = await db.createRepoAudit(repoUrl, owner, repo, auth.user?.id);
    return NextResponse.json({ auditId: audit.id, status: 'queued' });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
