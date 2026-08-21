import { NextRequest, NextResponse } from 'next/server';
import { validateApiRequest } from '@/lib/api-auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = await validateApiRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);
  const type = url.searchParams.get('type') || 'all';

  const audits = await db.getUserAudits(auth.user?.id, limit);
  const filtered = type === 'all' ? audits : audits.filter((a: any) => (type === 'github' ? a.repo_url : a.url));

  return NextResponse.json({
    audits: filtered.map((a: any) => ({
      id: a.id,
      type: a.repo_url ? 'github' : 'website',
      url: a.url || a.repo_url,
      status: a.status,
      score: a.score || 0,
      createdAt: a.created_at,
    })),
    total: filtered.length,
  });
}
