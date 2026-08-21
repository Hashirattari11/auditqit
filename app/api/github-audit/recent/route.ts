import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const audits = await db.getRecentRepoAudits(10);

    return NextResponse.json({
      audits: audits.map((a) => ({
        id: a.id,
        repo_url: a.repo_url,
        status: a.status,
        created_at: a.created_at,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch recent GitHub audits:', error);
    return NextResponse.json({ audits: [] });
  }
}
