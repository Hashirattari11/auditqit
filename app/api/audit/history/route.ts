import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    if (!url) return NextResponse.json({ error: 'url param required' }, { status: 400 });

    const { data: audits, error } = await supabase
      .from('audits')
      .select('id, url, score, overall_score, results, created_at, status')
      .eq('url', url)
      .eq('status', 'completed')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const history = (audits || []).map(a => {
      const r = a.results as any;
      return {
        id: a.id,
        date: a.created_at,
        overall: a.overall_score || a.score || 0,
        performance: r?.lighthouse?.performance || 0,
        seo: r?.lighthouse?.seo || r?.seo?.score || 0,
        security: r?.headers ? Math.round((Object.values(r.headers.securityHeaders || {}).filter((h: any) => h.present).length / Math.max(Object.keys(r.headers.securityHeaders || {}).length, 1)) * 100) : 0,
      };
    });

    return NextResponse.json({ url, history });
  } catch (error) {
    console.error('History error:', error);
    return NextResponse.json({ url: '', history: [] });
  }
}
