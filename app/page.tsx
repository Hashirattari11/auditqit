'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import UpgradeModal from '@/components/UpgradeModal';

interface RecentAudit {
  id: string;
  url: string;
  status: string;
  created_at: string;
}

interface RecentRepoAudit {
  id: string;
  repo_url: string;
  owner: string;
  repo: string;
  status: string;
  created_at: string;
}

export default function LandingPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentAudits, setRecentAudits] = useState<RecentAudit[]>([]);
  const [recentRepoAudits, setRecentRepoAudits] = useState<RecentRepoAudit[]>([]);
  const [activeTab, setActiveTab] = useState<'web' | 'github'>('web');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    fetchRecentAudits();
    fetchRecentRepoAudits();
  }, []);

  const fetchRecentAudits = async () => {
    try {
      const response = await fetch('/api/audit/recent');
      if (response.ok) {
        const data = await response.json();
        setRecentAudits(data.audits || []);
      }
    } catch {
      // Silently fail
    }
  };

  const fetchRecentRepoAudits = async () => {
    try {
      const response = await fetch('/api/github-audit/recent');
      if (response.ok) {
        const data = await response.json();
        setRecentRepoAudits(data.audits || []);
      }
    } catch {
      // Silently fail
    }
  };

  const isGitHubUrl = (input: string) => {
    return /github\.com\/[^/]+\/[^/]+/.test(input);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let finalUrl = url.trim();
    if (!finalUrl) {
      setError('Please enter a URL');
      return;
    }

    // Auto-add https:// if missing
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    // Validate URL
    try {
      new URL(finalUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);

    try {
      // Check if it's a GitHub URL
      if (isGitHubUrl(finalUrl)) {
        const response = await fetch('/api/github-audit/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: finalUrl }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.limitReached) {
            setUpgradeReason(data.error);
            setShowUpgradeModal(true);
            setLoading(false);
            return;
          }
          throw new Error(data.error || 'Failed to start audit');
        }
        router.push(`/github-report/${data.auditId}`);
      } else {
        const response = await fetch('/api/audit/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: finalUrl }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.limitReached) {
            setUpgradeReason(data.error);
            setShowUpgradeModal(true);
            setLoading(false);
            return;
          }
          throw new Error(data.error || 'Failed to start audit');
        }
        router.push(`/report/${data.auditId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  const webFeatures = [
    { icon: '⚡', title: 'Performance', desc: 'Lighthouse scores, Core Web Vitals, load times' },
    { icon: '🔍', title: 'SEO Analysis', desc: 'Meta tags, structure, sitemap, Open Graph' },
    { icon: '🔒', title: 'Security Headers', desc: 'CSP, HSTS, X-Frame-Options and more' },
    { icon: '🐛', title: 'Error Detection', desc: 'Console errors, failed requests, broken links' },
    { icon: '🤖', title: 'AI Summary', desc: 'Expert analysis with actionable recommendations' },
    { icon: '📸', title: 'Screenshots', desc: 'Desktop and mobile captures of your site' },
  ];

  const githubFeatures = [
    { icon: '🛡️', title: 'Security Analysis', desc: 'SQL injection, XSS, hardcoded secrets, eval()' },
    { icon: '🐛', title: 'Bug Detection', desc: 'Type coercion, empty catches, var usage' },
    { icon: '📊', title: 'Code Quality', desc: 'Complexity, function length, TODO tracking' },
    { icon: '🤖', title: 'AI Fix Suggestions', desc: 'Exact corrected code for every critical issue' },
    { icon: '📁', title: 'Full Repo Scan', desc: 'All source files analyzed up to 100 files' },
    { icon: '📈', title: 'Score & Ranking', desc: 'Security score, quality metrics, priority fixes' },
  ];

  return (
    <main className="min-h-screen">
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason={upgradeReason}
      />

      {/* Header */}
      <header className="border-b border-dark-600/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-blue to-accent-purple rounded-lg flex items-center justify-center text-sm font-bold">
              A
            </div>
            <span className="text-xl font-bold">AuditIQ</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-dark-300 hover:text-white transition-colors">
              Pricing
            </Link>
            {session ? (
              <>
                <Link href="/dashboard" className="text-sm text-dark-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
                <span className="text-xs text-dark-400">{session.user?.name || session.user?.email}</span>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-dark-300 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-accent-blue to-accent-purple text-white font-medium hover:opacity-90 transition-opacity"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
          AI-Powered Analysis
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Audit Any Website
          <br />
          <span className="bg-gradient-to-r from-accent-blue via-accent-purple to-accent-blue bg-clip-text text-transparent">
            or GitHub Repo
          </span>
        </h1>

        <p className="text-dark-300 text-lg mb-8 max-w-2xl mx-auto">
          Paste any URL or GitHub repo link and get a comprehensive audit with
          AI-powered fix suggestions and corrected code.
        </p>

        {/* Tab Selector */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-dark-700/50 rounded-xl p-1 border border-dark-600/50">
            <button
              onClick={() => setActiveTab('web')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'web'
                  ? 'bg-accent-blue text-white'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              🌐 Website Audit
            </button>
            <button
              onClick={() => setActiveTab('github')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'github'
                  ? 'bg-accent-purple text-white'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              🐙 GitHub Repo Audit
            </button>
          </div>
        </div>

        {/* URL Input Form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError('');
                  // Auto-switch tab based on input
                  if (isGitHubUrl(e.target.value)) {
                    setActiveTab('github');
                  }
                }}
                placeholder={
                  activeTab === 'web'
                    ? 'Enter website URL (e.g., example.com)'
                    : 'Enter GitHub repo URL (e.g., github.com/user/repo)'
                }
                className="w-full px-5 py-4 rounded-xl bg-dark-700 border border-dark-500 text-white placeholder-dark-400 focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-colors text-lg"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-4 rounded-xl text-white font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
                activeTab === 'github'
                  ? 'bg-gradient-to-r from-accent-purple to-accent-blue'
                  : 'bg-gradient-to-r from-accent-blue to-accent-purple'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing...
                </span>
              ) : activeTab === 'github' ? (
                'Scan Repository'
              ) : (
                'Run Audit'
              )}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-accent-red text-sm text-left">{error}</p>
          )}
        </form>
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <h2 className="text-center text-dark-300 text-sm uppercase tracking-widest mb-8">
          {activeTab === 'web' ? 'What Gets Checked' : 'Code Analysis Features'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(activeTab === 'web' ? webFeatures : githubFeatures).map((feature) => (
            <div
              key={feature.title}
              className="p-5 rounded-xl bg-dark-700/50 border border-dark-600/50 hover:border-dark-500 transition-colors"
            >
              <div className="text-2xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold mb-1">{feature.title}</h3>
              <p className="text-dark-300 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Audits */}
      {recentAudits.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 pb-8">
          <h2 className="text-center text-dark-300 text-sm uppercase tracking-widest mb-8">
            Recent Website Audits
          </h2>
          <div className="space-y-2">
            {recentAudits.map((audit) => (
              <button
                key={audit.id}
                onClick={() => router.push(`/report/${audit.id}`)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-dark-700/30 border border-dark-600/30 hover:border-dark-500 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    audit.status === 'completed' ? 'bg-accent-green'
                    : audit.status === 'failed' ? 'bg-accent-red'
                    : 'bg-accent-yellow animate-pulse'
                  }`} />
                  <span className="text-dark-200 truncate">{audit.url}</span>
                </div>
                <span className="text-dark-400 text-sm flex-shrink-0 ml-4">
                  {new Date(audit.created_at).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Recent GitHub Audits */}
      {recentRepoAudits.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 pb-16">
          <h2 className="text-center text-dark-300 text-sm uppercase tracking-widest mb-8">
            Recent GitHub Audits
          </h2>
          <div className="space-y-2">
            {recentRepoAudits.map((audit) => (
              <button
                key={audit.id}
                onClick={() => router.push(`/github-report/${audit.id}`)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-dark-700/30 border border-dark-600/30 hover:border-dark-500 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    audit.status === 'completed' ? 'bg-accent-green'
                    : audit.status === 'failed' ? 'bg-accent-red'
                    : 'bg-accent-yellow animate-pulse'
                  }`} />
                  <span className="text-dark-200 truncate">
                    🐙 {audit.owner}/{audit.repo}
                  </span>
                </div>
                <span className="text-dark-400 text-sm flex-shrink-0 ml-4">
                  {new Date(audit.created_at).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-dark-600/50 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-dark-400 text-sm">
          AuditIQ — Full-stack web & code audit tool with AI-powered insights
        </div>
      </footer>
    </main>
  );
}
