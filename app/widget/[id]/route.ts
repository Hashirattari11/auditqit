import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const audit = await db.getAudit(params.id);
    if (!audit) return new Response('Not found', { status: 404 });

    const results = audit.results as any;
    const perf = results?.lighthouse?.performance || 0;
    const seo = results?.lighthouse?.seo || 0;
    const sec = results?.headers ? Math.round((Object.values(results.headers.securityHeaders || {}).filter((h: any) => h.present).length / Math.max(Object.keys(results.headers.securityHeaders || {}).length, 1)) * 100) : 0;
    const overall = audit.score || Math.round((perf + seo + sec) / 3);

    const makeColor = (s: number) => s >= 80 ? '#22c55e' : s >= 50 ? '#eab308' : '#ef4444';
    const hostname = new URL(audit.url).hostname;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;background:#0a0e1a;color:#e2e8f0;padding:16px}
.card{background:#111827;border:1px solid #1e293b;border-radius:12px;padding:16px;max-width:300px}
.header{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.logo{width:24px;height:24px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;color:#fff}
.hostname{font-size:13px;color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.scores{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
.score-item{background:#0a0e1a;border-radius:8px;padding:8px;text-align:center}
.score-label{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.5px}
.score-value{font-size:20px;font-weight:700;font-family:monospace}
.overall{text-align:center;background:linear-gradient(135deg,#6366f120,#8b5cf620);border:1px solid #6366f130;border-radius:8px;padding:12px;margin-bottom:8px}
.overall .score-value{font-size:32px}
.footer{text-align:center;font-size:10px;color:#475569}
.footer a{color:#6366f1;text-decoration:none}
</style></head>
<body>
<div class="card">
  <div class="header"><div class="logo">A</div><span style="font-weight:600;font-size:14px">AuditIQ Score</span></div>
  <div class="hostname">${hostname}</div>
  <div class="overall"><div class="score-label">Overall</div><div class="score-value" style="color:${makeColor(overall)}">${overall}</div></div>
  <div class="scores">
    <div class="score-item"><div class="score-label">Performance</div><div class="score-value" style="color:${makeColor(perf)}">${perf}</div></div>
    <div class="score-item"><div class="score-label">SEO</div><div class="score-value" style="color:${makeColor(seo)}">${seo}</div></div>
    <div class="score-item"><div class="score-label">Security</div><div class="score-value" style="color:${makeColor(sec)}">${sec}</div></div>
  </div>
  <div class="footer">Powered by <a href="https://auditqit-0-eight.vercel.app">AuditIQ</a></div>
</div>
</body></html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch {
    return new Response('Error', { status: 500 });
  }
}
