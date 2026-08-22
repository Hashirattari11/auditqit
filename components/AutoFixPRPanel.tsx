'use client';

import { useState } from 'react';

interface AutoFixPRPanelProps {
  auditId: string;
  issueCount: number;
  isPro: boolean;
  repoUrl: string;
}

export default function AutoFixPRPanel({ auditId, issueCount, isPro, repoUrl }: AutoFixPRPanelProps) {
  const [status, setStatus] = useState<'idle' | 'creating' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);

  const createPR = async () => {
    setStatus('creating');
    try {
      const res = await fetch(`/api/github/${auditId}/auto-fix`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setResult(data);
        setStatus('done');
      } else {
        setResult(data);
        setStatus('error');
      }
    } catch {
      setResult({ error: 'Network error. Please try again.' });
      setStatus('error');
    }
  };

  if (!isPro) {
    return (
      <div className="border border-indigo-500/30 bg-indigo-500/5 rounded-xl p-6 mt-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🤖</span>
          <h3 className="text-white font-bold">AI Auto-Fix PR</h3>
          <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded-full">PRO</span>
        </div>
        <p className="text-white/50 text-sm mb-4">
          Let AuditIQ automatically create a GitHub PR with all fixable issues resolved. Just review and merge.
        </p>
        <a
          href="/pricing"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium inline-block"
        >
          Upgrade to Pro →
        </a>
      </div>
    );
  }

  return (
    <div className="border border-green-500/30 bg-green-500/5 rounded-xl p-6 mt-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">🤖</span>
        <h3 className="text-white font-bold">AI Auto-Fix PR</h3>
        <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full">Available</span>
      </div>

      {status === 'idle' && (
        <>
          <p className="text-white/60 text-sm mb-4">
            AuditIQ will scan your repo and automatically fix: missing meta tags, security headers, robots.txt, viewport tag, render-blocking scripts, and more.
          </p>
          <div className="bg-white/5 rounded-lg p-4 mb-4 space-y-2">
            {[
              'Missing security headers → Added to _headers + vercel.json',
              'Missing meta description → AI-generated and injected',
              'Missing robots.txt → Created with proper rules',
              'Render-blocking scripts → defer attribute added',
              'Missing Open Graph tags → Added for social sharing',
            ].map((fix) => (
              <div key={fix} className="flex items-center gap-2 text-sm text-white/60">
                <span className="text-green-400">✓</span> {fix}
              </div>
            ))}
          </div>
          <p className="text-white/30 text-xs mb-3">
            {issueCount} issue{issueCount !== 1 ? 's' : ''} found in this audit
          </p>
          <button
            onClick={createPR}
            className="bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2"
          >
            <span>🔀</span> Create Fix PR on GitHub
          </button>
        </>
      )}

      {status === 'creating' && (
        <div className="flex items-center gap-3 py-4">
          <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-white/60">Analyzing repo and creating fixes...</span>
        </div>
      )}

      {status === 'done' && result && (
        <div>
          <div className="text-green-400 font-semibold mb-3">
            ✅ PR Created — {result.fixesApplied?.length} fix{result.fixesApplied?.length !== 1 ? 'es' : ''} applied!
          </div>
          <div className="space-y-2 mb-4">
            {result.fixesApplied?.map((fix: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-white/5 rounded p-2">
                <span className="text-white/70 text-sm">{fix.fix}</span>
                <span className="text-green-400 text-xs">{fix.impact}</span>
              </div>
            ))}
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
            <span className="text-green-300 text-sm">
              Estimated score improvement: +{result.estimatedGain} points after merge
            </span>
          </div>
          <a
            href={result.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 w-fit border border-white/20"
          >
            <span>🔀</span> View PR on GitHub
          </a>
        </div>
      )}

      {status === 'error' && (
        <div className="text-red-400 text-sm">
          {result?.reason ?? result?.error ?? 'Failed to create PR. Check GitHub connection in Settings.'}
          <button
            onClick={() => setStatus('idle')}
            className="block mt-3 text-white/40 hover:text-white/60 underline text-xs"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
