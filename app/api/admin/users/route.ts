import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, plan, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Get audit counts per user
    const usersWithCounts = await Promise.all(
      (users || []).map(async (user) => {
        const { count } = await supabase
          .from('audits')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        return { ...user, auditCount: count || 0 };
      })
    );

    return NextResponse.json({ users: usersWithCounts }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ users: [] });
  }
}
