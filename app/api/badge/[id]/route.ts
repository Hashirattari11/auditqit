import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const type = request.nextUrl.searchParams.get('type') || 'overall';
    const audit = await db.getAudit(params.id);
    if (!audit) return new Response('Not found', { status: 404 });

    const results = audit.results as any;
    let score = 0;
    let label = 'Score';

    switch (type) {
      case 'performance':
        score = results?.lighthouse?.performance || 0;
        label = 'Performance';
        break;
      case 'seo':
        score = results?.lighthouse?.seo || results?.seo?.score || 0;
        label = 'SEO';
        break;
      case 'security':
        score = results?.headers ? Math.round((Object.values(results.headers.securityHeaders || {}).filter((h: any) => h.present).length / Math.max(Object.keys(results.headers.securityHeaders || {}).length, 1)) * 100) : 0;
        label = 'Security';
        break;
      default:
        score = audit.score || 0;
        label = 'Overall';
    }

    const color = score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';
    const bgColor = score >= 80 ? '#0d3320' : score >= 50 ? '#422006' : '#450a0a';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="28" viewBox="0 0 200 28">
  <rect width="200" height="28" rx="6" fill="${bgColor}"/>
  <rect x="0" width="90" height="28" rx="6" fill="#1e293b"/>
  <text x="45" y="18" text-anchor="middle" fill="#94a3b8" font-family="system-ui" font-size="11" font-weight="500">AuditIQ</text>
  <text x="135" y="18" text-anchor="middle" fill="${color}" font-family="system-ui" font-size="12" font-weight="700">${label}: ${score}</text>
</svg>`;

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new Response('Error', { status: 500 });
  }
}
