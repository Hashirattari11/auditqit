import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: audits, error } = await supabase
      .from('audits')
      .select('id, url, status, results, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Enrich with user emails
    const enriched = await Promise.all(
      (audits || []).map(async (audit) => {
        if (!audit.user_id) return { ...audit, userEmail: 'Guest' };
        const { data: user } = await supabase
          .from('users')
          .select('email')
          .eq('id', audit.user_id)
          .single();
        return { ...audit, userEmail: user?.email || 'Unknown' };
      })
    );

    return NextResponse.json({ audits: enriched }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Admin audits error:', error);
    return NextResponse.json({ audits: [] });
  }
}
