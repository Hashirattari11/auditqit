import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const audits = await db.getRecentAudits(10);

    return NextResponse.json({
      audits: audits.map((a) => ({
        id: a.id,
        url: a.url,
        status: a.status,
        score: a.score,
        created_at: a.created_at,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch recent audits:', error);
    return NextResponse.json({ audits: [] });
  }
}
