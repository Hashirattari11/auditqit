import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const [webCount, repoCount, todayWebCount, todayRepoCount] = await Promise.all([
      supabase.from('audits').select('id', { count: 'exact', head: true }),
      supabase.from('repo_audits').select('id', { count: 'exact', head: true }),
      supabase.from('audits').select('id', { count: 'exact', head: true }).gte('created_at', todayStr),
      supabase.from('repo_audits').select('id', { count: 'exact', head: true }).gte('created_at', todayStr),
    ]);

    const totalAudits = (webCount.count || 0) + (repoCount.count || 0);
    const todayAudits = (todayWebCount.count || 0) + (todayRepoCount.count || 0);

    return NextResponse.json({
      totalAudits,
      todayAudits,
    }, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ totalAudits: 0, todayAudits: 0 });
  }
}
