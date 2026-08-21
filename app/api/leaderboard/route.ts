import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: audits, error } = await supabase
      .from('audits')
      .select('id, url, score, overall_score, results, created_at')
      .eq('is_public', true)
      .eq('status', 'completed')
      .order('overall_score', { ascending: false })
      .limit(50);

    if (error) throw error;

    const entries = (audits || []).map(a => {
      const r = a.results as any;
      return {
        id: a.id,
        url: a.url,
        performance: r?.lighthouse?.performance || 0,
        seo: r?.lighthouse?.seo || r?.seo?.score || 0,
        security: r?.headers ? Math.round((Object.values(r.headers.securityHeaders || {}).filter((h: any) => h.present).length / Math.max(Object.keys(r.headers.securityHeaders || {}).length, 1)) * 100) : 0,
        overall: Number(a.overall_score) || a.score || 0,
        created_at: a.created_at,
      };
    });

    return NextResponse.json({ entries }, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch (error) {
    return NextResponse.json({ entries: [] });
  }
}
