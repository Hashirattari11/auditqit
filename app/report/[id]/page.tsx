'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AuditProgress from '@/components/AuditProgress';

interface AuditData {
  id: string;
  url: string;
  status: string;
  results: any;
  aiSummary: string | null;
  createdAt: string;
}

interface Bug {
  type: string;
  severity: string;
  element?: string;
  fix: string;
  category?: string;
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;

  const [report, setReport] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('pending');

  const pollCount = useRef(0);
  const MAX_POLLS = 90;

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/audit/${auditId}/status`);
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.status);

      if (data.status === 'completed' || data.status === 'failed') {
        if (data.results && Object.keys(data.results).length > 0) {
          setReport({
            id: data.id,
            url: data.url,
            status: data.status,
            results: data.results,
            aiSummary: data.aiSummary || null,
            createdAt: data.createdAt,
          });
        }
        setLoading(false);
        return true; // done polling
      }
    } catch { /* retry */ }
    return false;
  }, [auditId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (status === 'completed' || status === 'failed') return;

    const interval = setInterval(async () => {
      pollCount.current++;
      if (pollCount.current >= MAX_POLLS) {
        clearInterval(interval);
        setStatus('failed');
        setLoading(false);
        return;
      }
      const done = await fetchStatus();
      if (done) clearInterval(interval);
    }, 2000);

    return () => clearInterval(interval);
  }, [status, fetchStatus]);

  const handleRerun = async () => {
    try {
      await fetch(`/api/audit/${auditId}/rerun`, { method: 'POST' });
      setReport(null);
      setLoading(true);
      setStatus('pending');
      pollCount.current = 0;
      fetchStatus();
    } catch { /* ignore */ }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const handlePrint = () => {
    window.print();
  };

  // Progress view
  if (loading || status === 'pending' || status === 'running') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto px-4">
          <h1 className="text-2xl font-bold mb-2">Analyzing Website</h1>
          <p className="text-text-muted text-sm mb-8 truncate max-w-md mx-auto">
            {report?.url || 'Loading...'}
          </p>
          <AuditProgress auditId={auditId} onRerun={handleRerun} />
          <p className="text-text-muted text-xs mt-8">This usually takes 30-90 seconds</p>
        </div>
      </main>
    );
  }

  // Failed view
  if (status === 'failed' && !report) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Audit Failed</h1>
          <p className="text-text-secondary mb-6">
            The audit failed. This might be because the website is unreachable or timed out.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={handleRerun} className="px-6 py-3 rounded-xl bg-accent-purple text-white font-semibold hover:opacity-90">
              Re-run Audit
            </button>
            <button onClick={() => router.push('/')} className="px-6 py-3 rounded-xl bg-bg-surface border border-border-subtle text-text-primary font-semibold hover:opacity-90">
              Try Another URL
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center text-text-secondary">No report data available.</div>
      </main>
    );
  }

  const r = report.results;
  const overallScore = r?.overallScore ?? 0;
  const security = r?.security;
  const seo = r?.seo;
  const perf = r?.performance;
  const links = r?.links;
  const errors = r?.errors;
  const ai = r?.ai;

  // ====== COMBINE ALL BUGS FROM ALL SOURCES ======
  const allBugs: Bug[] = [
    ...(errors?.frontendBugs ?? []).map((b: any) => ({
      type: b.type, severity: b.severity, element: b.element, fix: b.fix, category: 'Frontend',
    })),
    ...(errors?.consoleErrors ?? []).map((e: any) => ({
      type: 'JavaScript Console Error', severity: 'high', element: e.message, fix: e.fix, category: 'JavaScript',
    })),
    ...(errors?.failedRequests ?? []).map((r: any) => ({
      type: `Failed to load ${r.resourceType}`, severity: 'medium', element: r.url, fix: r.fix, category: 'Network',
    })),
    ...(security?.issues ?? []).map((i: any) => ({
      type: i.issue, severity: i.severity, element: i.description, fix: i.fix, category: 'Security',
    })),
    ...(seo?.issues ?? []).map((i: any) => ({
      type: i.issue, severity: i.severity, element: i.location, fix: i.fix, category: 'SEO',
    })),
    ...(links?.broken ?? []).map((l: any) => ({
      type: 'Broken Link', severity: 'medium', element: `${l.url} (HTTP ${l.status})`, fix: l.fix, category: 'Links',
    })),
  ].sort((a, b) => {
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
  });

  return (
    <main className="min-h-screen pb-20">
      {/* Header — no-print */}
      <header className="border-b border-border-subtle sticky top-0 bg-bg/95 backdrop-blur z-50 no-print">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 hover:opacity-80">
            <div className="w-7 h-7 bg-gradient-to-br from-accent-blue to-accent-purple rounded-lg flex items-center justify-center text-xs font-bold">A</div>
            <span className="font-bold">AuditIQ</span>
          </button>
          <div className="flex items-center gap-3">
            <button onClick={handleRerun} className="px-4 py-2 rounded-lg bg-accent-purple/10 border border-accent-purple/20 text-accent-purple text-sm hover:bg-accent-purple/20">Re-run</button>
            <button onClick={handleShare} className="px-4 py-2 rounded-lg bg-bg-surface border border-border-subtle text-sm">Share</button>
            <button onClick={handlePrint} className="px-4 py-2 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm hover:bg-accent-blue/20">Download PDF</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-8">
        {/* 1. Header — URL + Overall Score */}
        <div className="mb-8">
          <p className="text-text-muted text-sm mb-1">{report.url}</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <ScoreCircle score={overallScore} size={128} />
            <div className="flex-1">
              <p className="text-text-muted text-sm">
                Audited on {new Date(report.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Score Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <ScoreCard label="Performance" score={perf?.performance ?? 0} icon="⚡" />
          <ScoreCard label="SEO" score={seo?.score ?? 0} icon="🔍" />
          <ScoreCard label="Security" score={security?.score ?? 0} icon="🔒" />
          <ScoreCard label="Overall" score={overallScore} icon="📊" />
        </div>

        {/* 3. BUGS FOUND — THE MAIN EVENT */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            🐛 Bugs Found
            {allBugs.length > 0 && (
              <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">{allBugs.length}</span>
            )}
          </h2>
          {allBugs.length > 0 ? (
            <>
              {(['critical', 'high', 'medium', 'low'] as const).map(severity => {
                const bugs = allBugs.filter(b => b.severity === severity);
                if (bugs.length === 0) return null;
                const colorMap: Record<string, string> = { critical: 'red', high: 'orange', medium: 'yellow', low: 'blue' };
                const color = colorMap[severity];
                return (
                  <div key={severity} className="mb-4">
                    <h3 className={`text-${color}-400 font-semibold mb-2 uppercase text-sm`}>{severity} ({bugs.length})</h3>
                    {bugs.map((bug, i) => (
                      <div key={i} className={`border border-${color}-500/30 bg-${color}-500/5 rounded-lg p-4 mb-2`}>
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-white font-medium">{bug.type}</span>
                          <div className="flex items-center gap-2">
                            {bug.category && <span className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded">{bug.category}</span>}
                            <span className={`text-xs bg-${color}-500/20 text-${color}-400 px-2 py-1 rounded`}>{bug.severity?.toUpperCase()}</span>
                          </div>
                        </div>
                        {bug.element && <div className="bg-black/30 rounded p-2 mb-2 font-mono text-xs text-white/60 overflow-x-auto">{bug.element}</div>}
                        <div className="flex items-start gap-2">
                          <span className="text-green-400 text-xs mt-0.5">💡</span>
                          <span className="text-white/70 text-sm">{bug.fix}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          ) : (
            <div className="border border-green-500/30 bg-green-500/5 rounded-lg p-6 text-center">
              <span className="text-4xl">✅</span>
              <p className="text-green-400 font-medium mt-2">No bugs detected!</p>
              <p className="text-white/50 text-sm">This site passed all automated checks</p>
            </div>
          )}
        </section>

        {/* 4. AI Executive Summary */}
        {ai?.summary && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-accent-purple/10 via-bg-surface/50 to-accent-blue/10 border border-accent-purple/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🤖</span>
              <h2 className="text-lg font-bold">AI Analysis</h2>
            </div>
            <div className="text-text-primary whitespace-pre-wrap leading-relaxed text-sm">
              {ai.summary}
            </div>
          </div>
        )}
        {!ai?.summary && (
          <div className="mb-8 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
            <p className="text-yellow-400 text-sm">🤖 AI analysis unavailable — all bug data above is still valid from automated scanning.</p>
          </div>
        )}

        {/* 5. Performance Metrics */}
        {perf && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><span>⚡</span> Performance Metrics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard label="LCP" value={perf.metrics?.lcp ? (perf.metrics.lcp / 1000).toFixed(2) + 's' : 'N/A'}
                color={perf.metrics?.lcp ? (perf.metrics.lcp < 2500 ? 'green' : perf.metrics.lcp < 4000 ? 'yellow' : 'red') : 'gray'} />
              <MetricCard label="FCP" value={perf.metrics?.fcp ? (perf.metrics.fcp / 1000).toFixed(2) + 's' : 'N/A'}
                color={perf.metrics?.fcp ? (perf.metrics.fcp < 1800 ? 'green' : perf.metrics.fcp < 3000 ? 'yellow' : 'red') : 'gray'} />
              <MetricCard label="CLS" value={perf.metrics?.cls != null ? perf.metrics.cls.toFixed(3) : 'N/A'}
                color={perf.metrics?.cls != null ? (perf.metrics.cls < 0.1 ? 'green' : perf.metrics.cls < 0.25 ? 'yellow' : 'red') : 'gray'} />
              <MetricCard label="TBT" value={perf.metrics?.tbt ? perf.metrics.tbt + 'ms' : 'N/A'}
                color={perf.metrics?.tbt ? (perf.metrics.tbt < 200 ? 'green' : perf.metrics.tbt < 600 ? 'yellow' : 'red') : 'gray'} />
              <MetricCard label="TTFB" value={perf.metrics?.ttfb ? (perf.metrics.ttfb / 1000).toFixed(2) + 's' : 'N/A'}
                color={perf.metrics?.ttfb ? (perf.metrics.ttfb < 800 ? 'green' : perf.metrics.ttfb < 1800 ? 'yellow' : 'red') : 'gray'} />
              <MetricCard label="Accessibility" value={perf.accessibility ? perf.accessibility + '/100' : 'N/A'}
                color={perf.accessibility ? (perf.accessibility >= 80 ? 'green' : perf.accessibility >= 50 ? 'yellow' : 'red') : 'gray'} />
            </div>
          </div>
        )}

        {/* 6. Security Headers */}
        {security && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><span>🔒</span> Security Headers (Score: {security.score}/100)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left py-2 text-text-muted font-medium">Header</th>
                    <th className="text-left py-2 text-text-muted font-medium">Status</th>
                    <th className="text-left py-2 text-text-muted font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'strict-transport-security', label: 'HSTS', desc: 'Enforces HTTPS' },
                    { name: 'content-security-policy', label: 'CSP', desc: 'Prevents XSS' },
                    { name: 'x-frame-options', label: 'X-Frame-Options', desc: 'Prevents clickjacking' },
                    { name: 'x-content-type-options', label: 'X-Content-Type-Options', desc: 'Prevents MIME sniffing' },
                    { name: 'referrer-policy', label: 'Referrer-Policy', desc: 'Controls referrer info' },
                    { name: 'permissions-policy', label: 'Permissions-Policy', desc: 'Controls browser features' },
                    { name: 'x-xss-protection', label: 'X-XSS-Protection', desc: 'Legacy XSS protection' },
                  ].map((h) => (
                    <tr key={h.name} className="border-b border-border-subtle/50">
                      <td className="py-2 font-mono text-xs">{h.label}</td>
                      <td className="py-2">
                        {security.headers?.[h.name] ? (
                          <span className="text-green-400">✓ Present</span>
                        ) : (
                          <span className="text-red-400">✗ Missing</span>
                        )}
                      </td>
                      <td className="py-2 text-text-muted">{h.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-6 text-sm text-text-secondary">
              <span>HTTPS: {security.isHttps ? '✅ Yes' : '❌ No'}</span>
              <span>Status: {security.statusCode}</span>
            </div>
          </div>
        )}

        {/* 7. SEO Checklist */}
        {seo && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><span>🔍</span> SEO Checklist (Score: {seo.score}/100)</h2>
            <div className="space-y-2">
              {[
                { label: 'Title Tag', detail: seo.details?.title || 'Missing', pass: seo.details?.title && seo.details.title.length >= 30 },
                { label: 'Meta Description', detail: seo.details?.metaDescription ? 'Present (' + seo.details.metaDescription.length + ' chars)' : 'Missing', pass: !!seo.details?.metaDescription },
                { label: 'H1 Tag', detail: seo.details?.h1Count ? seo.details.h1Count + ' found' : 'Missing', pass: seo.details?.h1Count === 1 },
                { label: 'Viewport Meta', detail: seo.details?.hasViewport ? 'Present' : 'Missing', pass: !!seo.details?.hasViewport },
                { label: 'Canonical Tag', detail: seo.details?.canonical ? 'Present' : 'Missing', pass: !!seo.details?.canonical },
                { label: 'Open Graph', detail: seo.details?.hasOpenGraph ? 'Present' : 'Missing', pass: !!seo.details?.hasOpenGraph },
                { label: 'robots.txt', detail: seo.details?.hasRobotsTxt ? 'Exists' : 'Not found', pass: !!seo.details?.hasRobotsTxt },
                { label: 'sitemap.xml', detail: seo.details?.hasSitemap ? 'Exists' : 'Not found', pass: !!seo.details?.hasSitemap },
              ].map((check) => (
                <div key={check.label} className={`flex items-center gap-3 p-3 rounded-lg border ${check.pass ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
                  <span>{check.pass ? '✅' : '⚠️'}</span>
                  <span className="font-medium text-sm">{check.label}</span>
                  <span className="text-text-muted text-sm ml-auto">{check.detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. Broken Links */}
        {links && links.brokenCount > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>🔗</span> Broken Links ({links.brokenCount} found)
            </h2>
            <div className="space-y-2">
              {links.broken.map((link: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-red-400">{link.status || 'ERR'}</span>
                    <span className="text-sm truncate flex-1">{link.url}</span>
                  </div>
                  {link.fix && <p className="text-text-muted text-xs mt-1">{link.fix}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. JavaScript Errors */}
        {errors && (errors.errorCount > 0 || errors.failedRequestCount > 0) && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>🐛</span> JavaScript Errors ({errors.errorCount} console, {errors.failedRequestCount} network)
            </h2>
            <div className="space-y-2">
              {errors.consoleErrors?.slice(0, 10).map((e: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <p className="font-mono text-xs text-red-400">console.error</p>
                  <p className="text-sm mt-1">{e.message}</p>
                </div>
              ))}
              {errors.failedRequests?.slice(0, 10).map((r: any, i: number) => (
                <div key={`net-${i}`} className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                  <p className="font-mono text-xs text-yellow-400">Failed: {r.resourceType}</p>
                  <p className="text-sm mt-1 truncate">{r.url}</p>
                  <p className="text-text-muted text-xs mt-1">{r.error}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. Screenshots */}
        {errors && (errors.desktopScreenshot || errors.mobileScreenshot) && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><span>📸</span> Screenshots</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {errors.desktopScreenshot && (
                <div className="rounded-xl overflow-hidden border border-border-subtle">
                  <div className="p-2 bg-bg-surface text-center text-xs text-text-muted">Desktop (1280×720)</div>
                  <img src={`data:image/jpeg;base64,${errors.desktopScreenshot}`} alt="Desktop screenshot" className="w-full" />
                </div>
              )}
              {errors.mobileScreenshot && (
                <div className="rounded-xl overflow-hidden border border-border-subtle">
                  <div className="p-2 bg-bg-surface text-center text-xs text-text-muted">Mobile (375×812)</div>
                  <img src={`data:image/jpeg;base64,${errors.mobileScreenshot}`} alt="Mobile screenshot" className="w-full max-w-xs mx-auto" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function ScoreCircle({ score, size = 128 }: { score: number; size?: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return '#22c55e';
    if (s >= 50) return '#eab308';
    return '#ef4444';
  };
  const getTextColor = (s: number) => {
    if (s >= 80) return 'text-green-400';
    if (s >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };
  const r = size / 2 - 8;
  const circumference = 2 * Math.PI * r;
  const dashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={getColor(score)} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={dashoffset} strokeLinecap="round"
          className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className={`font-bold ${getTextColor(score)}`} style={{ fontSize: size * 0.25 }}>{score}</span>
          <span className="block text-text-muted text-xs">/100</span>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ label, score, icon }: { label: string; score: number; icon: string }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (s >= 50) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  return (
    <div className={`p-4 rounded-xl border text-center ${getColor(score)}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold">{score}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    green: 'border-green-500/30',
    yellow: 'border-yellow-500/30',
    red: 'border-red-500/30',
    gray: 'border-border-subtle',
  };

  return (
    <div className={`p-4 rounded-xl bg-bg-surface border ${colorMap[color] || colorMap.gray}`}>
      <div className="text-text-muted text-sm mb-1">{label}</div>
      <div className="font-mono font-semibold text-lg">{value}</div>
    </div>
  );
}
