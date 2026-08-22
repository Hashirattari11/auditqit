'use client';

import { useState } from 'react';
import Link from 'next/link';

const CHECKLIST_ITEMS = [
  { id: 'https',       category: 'Security',    label: 'HTTPS enabled',                  critical: true  },
  { id: 'meta_title',  category: 'SEO',         label: 'Title tag present (30-60 chars)', critical: true  },
  { id: 'meta_desc',   category: 'SEO',         label: 'Meta description present',        critical: true  },
  { id: 'viewport',    category: 'Mobile',      label: 'Viewport meta tag',               critical: true  },
  { id: 'h1',         category: 'SEO',         label: 'Exactly one H1 tag',              critical: false },
  { id: 'robots',     category: 'SEO',         label: 'robots.txt exists',               critical: false },
  { id: 'sitemap',    category: 'SEO',         label: 'sitemap.xml exists',              critical: false },
  { id: 'og_tags',    category: 'Social',      label: 'Open Graph tags',                critical: false },
  { id: 'perf_score', category: 'Performance', label: 'Performance score > 70',          critical: true  },
  { id: 'no_errors',  category: 'Quality',     label: 'No JS console errors',            critical: true  },
  { id: 'no_404',     category: 'Quality',     label: 'No broken links',                critical: false },
  { id: 'csp',        category: 'Security',    label: 'Content Security Policy header',  critical: false },
  { id: 'hsts',       category: 'Security',    label: 'HSTS header',                    critical: false },
  { id: 'x_frame',    category: 'Security',    label: 'X-Frame-Options header',         critical: false },
  { id: 'canonical',  category: 'SEO',         label: 'Canonical tag',                  critical: false },
  { id: 'favicon',    category: 'UI',          label: 'Favicon present',                critical: false },
  { id: 'mobile_ok',  category: 'Mobile',      label: 'Mobile responsive',              critical: true  },
  { id: 'fast_load',  category: 'Performance', label: 'Page loads under 3 seconds',     critical: true  },
];

export default function ChecklistPage() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'done'>('idle');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  const runChecklist = async () => {
    if (!url) return;
    setStatus('checking');
    setError('');
    try {
      const res = await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to check URL');
        setStatus('idle');
        return;
      }
      setResults(data);
      setStatus('done');
    } catch {
      setError('Network error. Please try again.');
      setStatus('idle');
    }
  };

  const criticalFails = results?.items?.filter((i: any) => !i.pass && i.critical) ?? [];
  const isLaunchReady = criticalFails.length === 0;
  const passCount = results?.items?.filter((i: any) => i.pass).length ?? 0;

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white">
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">A</div>
            <span className="font-bold text-lg">AuditIQ</span>
          </Link>
          <Link href="/" className="text-white/50 hover:text-white text-sm">&larr; Back to Home</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-2 text-indigo-300 text-sm mb-6">
            Pre-Launch Checklist
          </div>
          <h1 className="text-4xl font-black text-white mb-4">
            Is Your Site<br />Ready to Launch?
          </h1>
          <p className="text-white/50 text-lg">
            Run 18 critical checks before going live. Catch issues before your users do.
          </p>
        </div>

        <div className="flex gap-3 mb-8">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runChecklist()}
            placeholder="https://yoursite.com"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/20 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-lg"
          />
          <button
            onClick={runChecklist}
            disabled={status === 'checking'}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors whitespace-nowrap"
          >
            {status === 'checking' ? 'Checking...' : 'Check Now'}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8 text-red-400 text-sm text-center">{error}</div>
        )}

        {status === 'idle' && !results && (
          <div className="grid grid-cols-2 gap-3">
            {CHECKLIST_ITEMS.map((item) => (
              <div key={item.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="w-5 h-5 border border-white/20 rounded flex-shrink-0" />
                <span className="text-white/50 text-sm">{item.label}</span>
                {item.critical && <span className="ml-auto text-red-400 text-xs">Critical</span>}
              </div>
            ))}
          </div>
        )}

        {status === 'done' && results && (
          <div>
            <div className={`rounded-2xl p-8 text-center mb-8 border ${
              isLaunchReady ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="text-6xl mb-4">{isLaunchReady ? '✅' : '🚫'}</div>
              <h2 className="text-3xl font-black text-white mb-2">
                {isLaunchReady ? 'Ready to Launch!' : 'Not Ready Yet'}
              </h2>
              <p className="text-white/60">
                {isLaunchReady
                  ? `All critical checks passed. ${passCount}/${CHECKLIST_ITEMS.length} total checks passed.`
                  : `${criticalFails.length} critical issue${criticalFails.length > 1 ? 's' : ''} must be fixed before launch.`}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 bg-white/10 rounded-full px-6 py-3">
                <span className="text-white font-bold text-2xl">{passCount}/{CHECKLIST_ITEMS.length}</span>
                <span className="text-white/50">checks passed</span>
              </div>
              {isLaunchReady && (
                <div className="mt-6">
                  <button
                    onClick={() => {
                      const text = `${url} passed the AuditIQ Pre-Launch Checklist!\n${passCount}/${CHECKLIST_ITEMS.length} checks passed.\n\nCheck your site: auditiq.com/checklist`;
                      navigator.clipboard.writeText(text);
                      alert('Launch Ready badge copied to clipboard!');
                    }}
                    className="bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-lg font-medium"
                  >
                    Share Launch Ready Badge
                  </button>
                </div>
              )}
            </div>

            {criticalFails.length > 0 && (
              <div className="mb-6">
                <h3 className="text-red-400 font-semibold mb-3 text-sm uppercase tracking-wide">
                  Fix These Before Launch ({criticalFails.length})
                </h3>
                <div className="space-y-2">
                  {criticalFails.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <span className="text-red-400 text-lg">✗</span>
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm">{item.label}</div>
                        <div className="text-white/50 text-xs mt-1">{item.fix}</div>
                      </div>
                      <span className="text-red-400 text-xs font-medium">CRITICAL</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3 className="text-white/50 font-semibold mb-3 text-sm uppercase tracking-wide">All Checks</h3>
            <div className="space-y-2">
              {results.items?.map((item: any) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-lg p-3 border ${
                    item.pass ? 'bg-green-500/5 border-green-500/20'
                      : item.critical ? 'bg-red-500/5 border-red-500/20'
                      : 'bg-yellow-500/5 border-yellow-500/20'
                  }`}
                >
                  <span className={item.pass ? 'text-green-400' : item.critical ? 'text-red-400' : 'text-yellow-400'}>
                    {item.pass ? '✓' : '✗'}
                  </span>
                  <span className="text-white/70 text-sm flex-1">{item.label}</span>
                  <span className="text-white/30 text-xs">{item.category}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <p className="text-white/50 text-sm mb-4">Want the full audit with AI fix suggestions?</p>
              <Link href={`/?url=${encodeURIComponent(url)}`}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-medium inline-block">
                Run Full Audit
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
