import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [totalUsers, totalWebAudits, totalRepoAudits, todayAudits, weekAudits, proUsers, recentUsers, waitlist] =
      await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('audits').select('id', { count: 'exact', head: true }),
        supabase.from('repo_audits').select('id', { count: 'exact', head: true }),
        supabase.from('audits').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('audits').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('plan', 'pro'),
        supabase.from('users').select('id, name, email, plan, audits_this_month, created_at').order('created_at', { ascending: false }).limit(20),
        supabase.from('waitlist').select('id, email, plan, source, created_at').order('created_at', { ascending: false }),
      ]);

    return NextResponse.json({
      totalUsers: totalUsers.count || 0,
      totalAudits: (totalWebAudits.count || 0) + (totalRepoAudits.count || 0),
      todayAudits: todayAudits.count || 0,
      weekAudits: weekAudits.count || 0,
      proUsers: proUsers.count || 0,
      recentUsers: recentUsers.data || [],
      waitlist: waitlist.data || [],
      waitlistCount: waitlist.data?.length || 0,
      dbConnected: true,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
