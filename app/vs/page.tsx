'use client';

import { useState } from 'react';

interface BattleResult {
  id: string;
  domain1: string;
  domain2: string;
  scores1: { performance: number; seo: number; security: number };
  scores2: { performance: number; seo: number; security: number };
  categoryWinners: { category: string; winner: string }[];
  overallWinner: string;
  commentary: string;
}

const EXAMPLES = [
  { label: 'React vs Vue docs', url1: 'react.dev', url2: 'vuejs.org' },
  { label: 'Vercel vs Netlify', url1: 'vercel.com', url2: 'netlify.com' },
  { label: 'Stripe vs PayPal', url1: 'stripe.com', url2: 'paypal.com' },
];

export default function VsBattlePage() {
  const [url1, setUrl1] = useState('');
  const [url2, setUrl2] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [error, setError] = useState('');

  const handleBattle = async () => {
    if (!url1.trim() || !url2.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/vs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url1: url1.trim(), url2: url2.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Battle failed');
    } finally {
      setLoading(false);
    }
  };

  const shareToTwitter = () => {
    if (!result) return;
    const s1 = Math.round((result.scores1.performance + result.scores1.seo + result.scores1.security) / 3);
    const s2 = Math.round((result.scores2.performance + result.scores2.seo + result.scores2.security) / 3);
    const text = `⚔️ Website Battle Results:\n\n${result.domain1}: ${s1}/100\n${result.domain2}: ${s2}/100\n\nWinner: 🏆 ${result.overallWinner === 'url1' ? result.domain1 : result.overallWinner === 'url2' ? result.domain2 : 'Tie'}\n\n${result.commentary.slice(0, 150)}\n\nBattle yours: auditiq.com/vs\n\n#webdev #AuditIQ`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getOverall = (s: { performance: number; seo: number; security: number }) =>
    Math.round((s.performance + s.seo + s.security) / 3);

  const categories = ['performance', 'seo', 'security'] as const;

  return (
    <main className="min-h-screen pb-20">
      <div className="max-w-5xl mx-auto px-4 pt-32">
        {!result && !loading && (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                ⚔️ Head-to-Head <span className="text-yellow-400">Website Battle</span>
              </h1>
              <p className="text-text-secondary text-lg mb-6">Which site wins? Let the data decide.</p>

              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <input
                  type="text"
                  value={url1}
                  onChange={(e) => setUrl1(e.target.value)}
                  placeholder="Your site URL"
                  className="w-full sm:w-64 px-4 py-3 rounded-xl bg-bg border border-border-subtle text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue"
                />
                <span className="text-2xl font-black text-text-muted">VS</span>
                <input
                  type="text"
                  value={url2}
                  onChange={(e) => setUrl2(e.target.value)}
                  placeholder="Competitor URL"
                  className="w-full sm:w-64 px-4 py-3 rounded-xl bg-bg border border-border-subtle text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-purple"
                />
              </div>

              {/* Example battles */}
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => { setUrl1(ex.url1); setUrl2(ex.url2); }}
                    className="px-3 py-1 rounded-full bg-bg-surface border border-border-subtle text-xs text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleBattle}
                disabled={loading || !url1.trim() || !url2.trim()}
                className="mt-6 px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                Start Battle ⚔️
              </button>

              {error && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center max-w-md mx-auto">
                  {error}
                </div>
              )}
            </div>
          </>
        )}

        {loading && (
          <div className="text-center py-20">
            <div className="text-6xl mb-6 animate-pulse">⚔️</div>
            <h2 className="text-2xl font-bold mb-2">Battle in progress...</h2>
            <p className="text-text-muted text-sm">Analyzing both websites. May the best site win.</p>
          </div>
        )}

        {result && (
          <div className="space-y-8">
            {/* Battle Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Site 1 */}
              <div className={`rounded-xl p-6 border ${result.overallWinner === 'url1' ? 'border-green-500/50 bg-green-500/5' : result.overallWinner === 'tie' ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                <div className="text-sm text-white/50 mb-1">Challenger</div>
                <div className="text-white font-bold text-lg mb-4 truncate">{result.domain1}</div>
                <div className="text-center">
                  <span className={`text-4xl font-bold ${result.overallWinner === 'url1' ? 'text-green-400' : 'text-white/70'}`}>
                    {getOverall(result.scores1)}
                  </span>
                  <span className="text-white/50 text-sm block">/100</span>
                </div>
                <div className="mt-4 space-y-2">
                  {categories.map(cat => (
                    <div key={cat} className="flex justify-between text-sm">
                      <span className="text-white/50 capitalize">{cat}</span>
                      <span className={`font-mono ${result.scores1[cat] > result.scores2[cat] ? 'text-green-400' : 'text-white/50'}`}>
                        {result.scores1[cat]}
                      </span>
                    </div>
                  ))}
                </div>
                {result.overallWinner === 'url1' && <div className="text-center mt-4 text-2xl">🏆</div>}
              </div>

              {/* VS Center */}
              <div className="flex flex-col items-center justify-center p-6">
                <div className="text-5xl font-black text-white mb-4">VS</div>
                <div className="text-center">
                  <div className="text-white/50 text-xs mb-1">WINNER</div>
                  <div className={`text-lg font-bold ${result.overallWinner === 'tie' ? 'text-yellow-400' : 'text-green-400'}`}>
                    {result.overallWinner === 'tie' ? '🤝 TIE' : `🏆 ${result.overallWinner === 'url1' ? result.domain1 : result.domain2}`}
                  </div>
                </div>
              </div>

              {/* Site 2 */}
              <div className={`rounded-xl p-6 border ${result.overallWinner === 'url2' ? 'border-green-500/50 bg-green-500/5' : result.overallWinner === 'tie' ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                <div className="text-sm text-white/50 mb-1">Defender</div>
                <div className="text-white font-bold text-lg mb-4 truncate">{result.domain2}</div>
                <div className="text-center">
                  <span className={`text-4xl font-bold ${result.overallWinner === 'url2' ? 'text-green-400' : 'text-white/70'}`}>
                    {getOverall(result.scores2)}
                  </span>
                  <span className="text-white/50 text-sm block">/100</span>
                </div>
                <div className="mt-4 space-y-2">
                  {categories.map(cat => (
                    <div key={cat} className="flex justify-between text-sm">
                      <span className="text-white/50 capitalize">{cat}</span>
                      <span className={`font-mono ${result.scores2[cat] > result.scores1[cat] ? 'text-green-400' : 'text-white/50'}`}>
                        {result.scores2[cat]}
                      </span>
                    </div>
                  ))}
                </div>
                {result.overallWinner === 'url2' && <div className="text-center mt-4 text-2xl">🏆</div>}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="rounded-xl border border-border-subtle overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-surface">
                    <th className="text-left py-3 px-4 text-white/50 font-medium">Category</th>
                    <th className="text-center py-3 px-4 text-white/50 font-medium">{result.domain1}</th>
                    <th className="text-center py-3 px-4 text-white/50 font-medium">Winner</th>
                    <th className="text-center py-3 px-4 text-white/50 font-medium">{result.domain2}</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => {
                    const v1 = result.scores1[cat];
                    const v2 = result.scores2[cat];
                    const catWinner = result.categoryWinners.find(c => c.category === cat)?.winner;
                    return (
                      <tr key={cat} className="border-b border-border-subtle/50">
                        <td className="py-3 px-4 text-white/70 capitalize">{cat}</td>
                        <td className={`text-center py-3 px-4 font-bold ${catWinner === 'url1' ? 'text-green-400' : 'text-white/50'}`}>{v1}</td>
                        <td className="text-center py-3 px-4 text-lg">
                          {catWinner === 'url1' ? '←' : catWinner === 'url2' ? '→' : '='}
                        </td>
                        <td className={`text-center py-3 px-4 font-bold ${catWinner === 'url2' ? 'text-green-400' : 'text-white/50'}`}>{v2}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* AI Commentary */}
            {result.commentary && (
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-white font-semibold mb-3">⚡ Battle Analysis</h3>
                <p className="text-white/70 leading-relaxed">{result.commentary}</p>
              </div>
            )}

            {/* Share */}
            <div className="flex flex-wrap gap-3">
              <button onClick={shareToTwitter} className="bg-black border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
                𝕏 Share Battle
              </button>
              <button onClick={() => { setResult(null); setUrl1(''); setUrl2(''); }} className="bg-bg-surface border border-border-subtle text-text-primary px-4 py-2 rounded-lg hover:opacity-90 transition-all">
                New Battle ⚔️
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
