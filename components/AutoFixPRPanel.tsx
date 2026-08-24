'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';

interface AutoFixPRPanelProps {
  auditId: string;
  issueCount: number;
}

export default function AutoFixPRPanel({ auditId, issueCount }: AutoFixPRPanelProps) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<'idle' | 'creating' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);

  const isPro =
    (session?.user as any)?.plan === 'pro' ||
    (session?.user as any)?.plan === 'team' ||
    (session?.user as any)?.plan === 'admin';
  const isAdmin = (session?.user as any)?.plan === 'admin';
  const hasGithub = (session?.user as any)?.hasGithubConnected;
  const githubUsername = (session?.user as any)?.githubUsername;

  // --- STATE: Not logged in ---
  if (!session) {
    return (
      <div className="border border-white/10 bg-white/5 rounded-xl p-6 mt-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🤖</span>
          <h3 className="text-white font-bold">AI Auto-Fix PR</h3>
        </div>
        <p className="text-white/50 text-sm mb-4">
          Sign in to automatically fix issues with a GitHub pull request.
        </p>
        <button
          onClick={() => signIn()}
          className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Sign In →
        </button>
      </div>
    );
  }

  // --- STATE: Logged in but not Pro (and not admin) ---
  if (!isPro && !isAdmin) {
    return (
      <div className="border border-indigo-500/30 bg-indigo-500/5 rounded-xl p-6 mt-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🤖</span>
          <h3 className="text-white font-bold">AI Auto-Fix PR</h3>
          <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded-full">
            PRO
          </span>
        </div>
        <p className="text-white/50 text-sm mb-4">
          Upgrade to Pro to automatically create a GitHub PR with all fixable issues resolved.
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

  // --- STATE: Pro but GitHub NOT connected ---
  if (isPro && !hasGithub) {
    return (
      <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-xl p-6 mt-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🔗</span>
          <h3 className="text-white font-bold">Connect GitHub to Create Fix PR</h3>
        </div>
        <p className="text-white/60 text-sm mb-2">
          You need to connect your GitHub account so AuditIQ can create a pull request with the fixes.
        </p>
        <p className="text-white/40 text-xs mb-5">
          This grants AuditIQ permission to create branches and PRs in your repos. Your code is never stored.
        </p>

        {/* What will be fixed preview */}
        <div className="bg-white/5 rounded-lg p-4 mb-5">
          <div className="text-white/50 text-xs mb-3 uppercase tracking-wide">
            Will be fixed automatically:
          </div>
          <div className="space-y-2">
            {[
              'Missing security headers → Added to vercel.json + _headers',
              'Missing meta description → AI-generated and injected',
              'Missing robots.txt → Created automatically',
              'Render-blocking scripts → defer attribute added',
              'Missing viewport tag → Injected into HTML',
            ].map((fix) => (
              <div key={fix} className="flex items-center gap-2 text-sm text-white/60">
                <span className="text-green-400 flex-shrink-0">✓</span>
                <span>{fix}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => signIn('github', { callbackUrl: window.location.href })}
          className="flex items-center gap-3 bg-gray-900 hover:bg-gray-800 border border-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-colors w-full justify-center"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Connect GitHub Account
        </button>
        <p className="text-white/30 text-xs text-center mt-3">
          You&apos;ll be redirected back here after connecting
        </p>
      </div>
    );
  }

  // --- STATE: Pro + GitHub connected = Show Auto-Fix UI ---
  const createPR = async () => {
    setStatus('creating');
    try {
      const res = await fetch(`/api/github/${auditId}/auto-fix`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.status === 401 && data.action === 'reconnect_github') {
        // Token expired — show reconnect UI
        setResult(data);
        setStatus('error');
      } else if (data.success) {
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

  return (
    <div className="border border-green-500/30 bg-green-500/5 rounded-xl p-6 mt-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">🤖</span>
        <h3 className="text-white font-bold">AI Auto-Fix PR</h3>
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span className="text-green-400 text-xs">GitHub Connected</span>
          {githubUsername && (
            <span className="text-white/30 text-xs">@{githubUsername}</span>
          )}
        </div>
      </div>

      {/* IDLE — ready to create */}
      {status === 'idle' && (
        <>
          <p className="text-white/60 text-sm mb-4">
            AuditIQ will scan your repo and automatically fix: missing meta tags, security headers,
            robots.txt, viewport tag, render-blocking scripts, and more.
          </p>
          <div className="bg-white/5 rounded-lg p-4 mb-4 space-y-2">
            {[
              { fix: 'Security headers', impact: '+15 Security' },
              { fix: 'Meta description (AI-generated)', impact: '+8 SEO' },
              { fix: 'robots.txt', impact: '+5 SEO' },
              { fix: 'Render-blocking scripts', impact: '+8 Performance' },
              { fix: 'Open Graph tags', impact: '+5 Social' },
            ].map((item) => (
              <div key={item.fix} className="flex items-center justify-between text-sm">
                <span className="text-white/60 flex items-center gap-2">
                  <span className="text-green-400">✓</span> {item.fix}
                </span>
                <span className="text-green-400 text-xs">{item.impact}</span>
              </div>
            ))}
          </div>
          <p className="text-white/30 text-xs mb-3">
            {issueCount} issue{issueCount !== 1 ? 's' : ''} found in this audit
          </p>
          <button
            onClick={createPR}
            className="bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 w-fit transition-colors"
          >
            <span>🔀</span> Create Fix PR on GitHub
          </button>
        </>
      )}

      {/* CREATING — in progress */}
      {status === 'creating' && (
        <div className="py-8 flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
            <div className="text-white font-medium">Creating your fix PR...</div>
            <div className="text-white/40 text-sm mt-1">Analyzing repo files and applying fixes</div>
          </div>
          <div className="text-white/30 text-xs">This takes about 30-60 seconds</div>
        </div>
      )}

      {/* DONE — PR created */}
      {status === 'done' && result?.success && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-green-400 text-xl">✅</span>
            <div>
              <div className="text-white font-semibold">PR Created Successfully!</div>
              <div className="text-white/50 text-sm">
                {result.fixesApplied?.length} fix{result.fixesApplied?.length !== 1 ? 'es' : ''}{' '}
                applied
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {result.fixesApplied?.map((fix: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white/5 rounded p-2"
              >
                <span className="text-white/70 text-sm">{fix.fix}</span>
                <span className="text-green-400 text-xs">{fix.impact}</span>
              </div>
            ))}
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
            <span className="text-green-300 text-sm font-semibold">
              Estimated: +{result.estimatedGain} points after merge
            </span>
          </div>

          <a
            href={result.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 border border-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-colors w-full"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            View PR on GitHub → #{result.prNumber}
          </a>
        </div>
      )}

      {/* ERROR */}
      {status === 'error' && (
        <div className="py-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
            <div className="text-red-400 font-medium mb-1">Failed to create PR</div>
            <div className="text-red-300/70 text-sm">
              {result?.reason ?? result?.error ?? result?.message ?? 'Unknown error'}
            </div>
          </div>

          {/* Show reconnect button if token expired */}
          {result?.action === 'reconnect_github' && (
            <button
              onClick={() => signIn('github', { callbackUrl: window.location.href })}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium mb-3"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Reconnect GitHub Account
            </button>
          )}

          <button
            onClick={() => setStatus('idle')}
            className="text-white/40 hover:text-white/70 text-sm underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
