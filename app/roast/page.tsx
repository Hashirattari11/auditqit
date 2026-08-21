'use client';

import { useState } from 'react';
import Link from 'next/link';

interface RoastResult {
  id: string;
  roastText: string;
  domain: string;
  perfScore: number;
  seoScore: number;
  secScore: number;
  bugCount: number;
}

export default function RoastPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RoastResult | null>(null);
  const [error, setError] = useState('');

  const handleRoast = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to roast this website');
    } finally {
      setLoading(false);
    }
  };

  const shareToTwitter = () => {
    if (!result) return;
    const text = `🔥 I got my website roasted by AI:\n\n"${result.roastText.slice(0, 200)}..."\n\nPerformance: ${result.perfScore}/100\nSEO: ${result.seoScore}/100\n\nTry yours: auditiq.com/roast\n\n#webdev #AuditIQ`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyRoast = () => {
    if (!result) return;
    navigator.clipboard.writeText(`🔥 AuditIQ Roast of ${result.domain}:\n\n"${result.roastText}"\n\nPerformance: ${result.perfScore}/100 | SEO: ${result.seoScore}/100 | Security: ${result.secScore}/100`);
    alert('Copied to clipboard!');
  };

  return (
    <main className="min-h-screen pb-20">
      <div className="max-w-3xl mx-auto px-4 pt-32">
        {!result && !loading && (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Get Your Website Brutally <span className="text-orange-400">Roasted</span> by AI 🔥
              </h1>
              <p className="text-text-secondary text-lg mb-4">We&apos;ll tell you exactly what&apos;s wrong — no sugar coating</p>
              <span className="inline-block px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                ⚠️ Warning: AI has no chill
              </span>
            </div>

            <div className="card p-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRoast()}
                  placeholder="Enter website URL (e.g., example.com)"
                  className="flex-1 px-4 py-3 rounded-xl bg-bg border border-border-subtle text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-orange"
                />
                <button
                  onClick={handleRoast}
                  disabled={loading || !url.trim()}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  Roast Me 😬
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}
          </>
        )}

        {loading && (
          <div className="text-center py-20">
            <div className="text-6xl mb-6 animate-bounce">🔥</div>
            <h2 className="text-2xl font-bold mb-2">Roasting in progress...</h2>
            <p className="text-text-muted text-sm">AI is preparing your roast. This might sting a little.</p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* Roast Card */}
            <div
              className="relative rounded-2xl p-8 border border-orange-500/50"
              style={{ background: 'linear-gradient(135deg, #1a0a00, #0f0a00)' }}
            >
              <div className="text-4xl mb-4">🔥</div>
              <p className="text-orange-100 text-lg leading-relaxed font-medium mb-6">
                &quot;{result.roastText}&quot;
              </p>

              {/* Score badges */}
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
                  Performance: {result.perfScore}/100
                </span>
                <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                  SEO: {result.seoScore}/100
                </span>
                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
                  Security: {result.secScore}/100
                </span>
                {result.bugCount > 0 && (
                  <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm">
                    Bugs: {result.bugCount}
                  </span>
                )}
              </div>

              {/* Share buttons */}
              <div className="flex flex-wrap gap-3">
                <button onClick={shareToTwitter} className="bg-black border border-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white/10 transition-colors">
                  𝕏 Share Roast
                </button>
                <button onClick={copyRoast} className="bg-orange-500/20 border border-orange-500/30 text-orange-300 px-4 py-2 rounded-lg hover:bg-orange-500/30 transition-colors">
                  Copy Text
                </button>
              </div>

              {/* CTA */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-white/50 text-sm">Want the full diagnosis?</p>
                <Link href={`/report/${result.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                  View Complete Audit Report →
                </Link>
              </div>
            </div>

            {/* Roast another */}
            <div className="text-center">
              <button
                onClick={() => { setResult(null); setUrl(''); }}
                className="px-6 py-3 rounded-xl bg-bg-surface border border-border-subtle text-text-primary hover:opacity-90 transition-all"
              >
                Roast Another Website 🔥
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
