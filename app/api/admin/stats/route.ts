import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [totalUsers, totalWebAudits, totalRepoAudits, todayAudits, weekAudits, recentUsers] =
      await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('audits').select('id', { count: 'exact', head: true }),
        supabase.from('repo_audits').select('id', { count: 'exact', head: true }),
        supabase.from('audits').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('audits').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
        supabase.from('users').select('id, name, email, plan, created_at').order('created_at', { ascending: false }).limit(10),
      ]);

    return NextResponse.json({
      totalUsers: totalUsers.count || 0,
      totalAudits: (totalWebAudits.count || 0) + (totalRepoAudits.count || 0),
      todayAudits: todayAudits.count || 0,
      weekAudits: weekAudits.count || 0,
      recentUsers: recentUsers.data || [],
      dbConnected: true,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
