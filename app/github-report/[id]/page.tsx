'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface RepoAuditData {
  id: string;
  repoUrl: string;
  owner: string;
  repo: string;
  status: string;
  results: any;
  aiSummary: string | null;
  createdAt: string;
}

interface AuditStatus {
  id: string;
  repoUrl: string;
  owner: string;
  repo: string;
  status: string;
  currentStep: string | null;
  createdAt: string;
}

const SEVERITY_COLORS = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  info: 'bg-dark-500/20 text-dark-300 border-dark-500/30',
};

const CATEGORY_ICONS: Record<string, string> = {
  security: '🛡️',
  bug: '🐛',
  quality: '📊',
  performance: '⚡',
  'best-practice': '✅',
};

export default function GitHubReportPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;

  const [status, setStatus] = useState<AuditStatus | null>(null);
  const [report, setReport] = useState<RepoAuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const pollStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/github-audit/${auditId}/status`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);

        if (data.status === 'completed' || data.status === 'failed') {
          setPolling(false);
          const reportResponse = await fetch(`/api/github-audit/${auditId}/report`);
          if (reportResponse.ok) {
            const reportData = await reportResponse.json();
            setReport(reportData);
          }
        }
      }
    } catch {
      // Retry on next poll
    } finally {
      setLoading(false);
    }
  }, [auditId]);

  useEffect(() => {
    pollStatus();
  }, [pollStatus]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [polling, pollStatus]);

  const toggleIssue = (id: string) => {
    setExpandedIssues(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const handlePrint = () => {
    window.print();
  };

  // Loading state
  if (loading || (status && (status.status === 'pending' || status.status === 'running'))) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="animate-spin h-12 w-12 border-4 border-accent-purple border-t-transparent rounded-full mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Scanning Repository</h1>
          <p className="text-dark-300 mb-4">
            {status?.owner && status?.repo
              ? `${status.owner}/${status.repo}`
              : 'Loading...'}
          </p>
          {status?.currentStep && (
            <p className="text-accent-purple text-sm">{status.currentStep}</p>
          )}
          <p className="text-dark-400 text-sm mt-4">This may take 30-60 seconds</p>
        </div>
      </main>
    );
  }

  // Failed state
  if (status?.status === 'failed') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-2xl font-bold mb-2">Audit Failed</h1>
          <p className="text-dark-300 mb-6">
            Failed to audit {status.owner}/{status.repo}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-xl bg-accent-blue text-white font-medium hover:opacity-90"
          >
            Try Another Repo
          </button>
        </div>
      </main>
    );
  }

  if (!report || !report.results) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-dark-300">No report data available</p>
        </div>
      </main>
    );
  }

  const results = report.results;
  const summary = results.summary || {};
  const issues = results.issues || [];
  const repoInfo = results.repo || {};
  const fileStats = results.fileStats || [];

  // Filter issues
  const filteredIssues = issues.filter((issue: any) => {
    if (filterSeverity !== 'all' && issue.severity !== filterSeverity) return false;
    if (filterCategory !== 'all' && issue.category !== filterCategory) return false;
    return true;
  });

  return (
    <main className="min-h-screen pb-20">
      {/* Header */}
      <header className="border-b border-dark-600/50 sticky top-0 z-10 bg-dark-900/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="text-dark-300 hover:text-white">
              ← Back
            </button>
            <div className="w-px h-6 bg-dark-600" />
            <span className="text-sm text-dark-300">
              🐙 {report.owner}/{report.repo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleShare} className="px-3 py-1.5 text-sm rounded-lg bg-dark-700 text-dark-200 hover:bg-dark-600">
              Share
            </button>
            <button onClick={handlePrint} className="px-3 py-1.5 text-sm rounded-lg bg-dark-700 text-dark-200 hover:bg-dark-600">
              Print
            </button>
          </div>
        </div>
      </header>

      {/* Score Cards */}
      <section className="max-w-6xl mx-auto px-4 pt-8 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ScoreCard
            label="Security Score"
            value={summary.securityScore ?? 0}
            color={summary.securityScore >= 80 ? 'green' : summary.securityScore >= 50 ? 'yellow' : 'red'}
          />
          <ScoreCard
            label="Total Issues"
            value={summary.totalIssues ?? 0}
            color="blue"
            suffix={`in ${summary.filesScanned ?? 0} files`}
          />
          <ScoreCard
            label="Critical"
            value={summary.critical ?? 0}
            color={summary.critical > 0 ? 'red' : 'green'}
            suffix="issues"
          />
          <ScoreCard
            label="High Severity"
            value={summary.high ?? 0}
            color={summary.high > 0 ? 'orange' : 'green'}
            suffix="issues"
          />
        </div>
      </section>

      {/* Repo Info */}
      <section className="max-w-6xl mx-auto px-4 pb-6">
        <div className="p-5 rounded-xl bg-dark-700/50 border border-dark-600/50">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-3xl">🐙</span>
            <div>
              <h2 className="text-xl font-bold">{repoInfo.owner}/{repoInfo.repo}</h2>
              {repoInfo.description && (
                <p className="text-dark-300 text-sm mt-1">{repoInfo.description}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3 ml-auto text-sm">
              {repoInfo.language && (
                <span className="px-2 py-1 rounded bg-accent-blue/20 text-accent-blue">{repoInfo.language}</span>
              )}
              <span className="text-dark-300">⭐ {repoInfo.stars}</span>
              <span className="text-dark-300">🍴 {repoInfo.forks}</span>
              <span className="text-dark-300">📄 {results.filesScanned} files scanned</span>
              <span className="text-dark-300">📝 {summary.totalLines?.toLocaleString()} lines</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI Summary */}
      {report.aiSummary && (
        <section className="max-w-6xl mx-auto px-4 pb-6">
          <div className="p-5 rounded-xl bg-gradient-to-br from-accent-purple/10 to-accent-blue/10 border border-accent-purple/20">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              🤖 AI Analysis
            </h3>
            <div className="prose prose-invert prose-sm max-w-none text-dark-200 leading-relaxed whitespace-pre-wrap">
              {report.aiSummary}
            </div>
          </div>
        </section>
      )}

      {/* Issues Section */}
      <section className="max-w-6xl mx-auto px-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            🐛 Issues Found ({filteredIssues.length})
          </h3>
          <div className="flex gap-2">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg bg-dark-700 border border-dark-600 text-white"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg bg-dark-700 border border-dark-600 text-white"
            >
              <option value="all">All Categories</option>
              <option value="security">Security</option>
              <option value="bug">Bugs</option>
              <option value="quality">Quality</option>
              <option value="performance">Performance</option>
              <option value="best-practice">Best Practice</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredIssues.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-dark-700/30 border border-dark-600/30">
              <span className="text-4xl mb-4 block">✅</span>
              <p className="text-dark-300">No issues found with current filters</p>
            </div>
          ) : (
            filteredIssues.map((issue: any) => (
              <div
                key={issue.id}
                className="rounded-xl border border-dark-600/50 overflow-hidden"
              >
                <button
                  onClick={() => toggleIssue(issue.id)}
                  className="w-full p-4 flex items-start gap-3 text-left hover:bg-dark-700/30 transition-colors"
                >
                  <span className="text-lg">{CATEGORY_ICONS[issue.category] || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 text-xs rounded border ${SEVERITY_COLORS[issue.severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.info}`}>
                        {issue.severity.toUpperCase()}
                      </span>
                      <span className="text-dark-400 text-xs">{issue.category}</span>
                    </div>
                    <h4 className="font-medium mt-1">{issue.title}</h4>
                    <p className="text-dark-300 text-sm mt-0.5">{issue.description}</p>
                    <p className="text-dark-400 text-xs mt-1">
                      📁 {issue.file}{issue.line ? `:${issue.line}` : ''}
                    </p>
                  </div>
                  <span className="text-dark-400 text-lg">
                    {expandedIssues.has(issue.id) ? '▼' : '▶'}
                  </span>
                </button>

                {expandedIssues.has(issue.id) && (
                  <div className="px-4 pb-4 space-y-3 border-t border-dark-600/30 pt-3">
                    {/* Code Snippet */}
                    <div>
                      <p className="text-xs text-dark-400 mb-1">Code:</p>
                      <pre className="p-3 rounded-lg bg-dark-900 text-sm overflow-x-auto text-dark-200">
                        {issue.codeSnippet}
                      </pre>
                    </div>

                    {/* Fix Suggestion */}
                    <div>
                      <p className="text-xs text-accent-green mb-1">💡 Fix:</p>
                      <p className="text-sm text-dark-200">{issue.fixSuggestion}</p>
                    </div>

                    {/* Fixed Code */}
                    {issue.fixedCode && (
                      <div>
                        <p className="text-xs text-accent-blue mb-1">✅ Corrected Code:</p>
                        <pre className="p-3 rounded-lg bg-dark-900 text-sm overflow-x-auto text-green-300">
                          {issue.fixedCode}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* File Stats */}
      {fileStats.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-6">
          <h3 className="text-lg font-semibold mb-4">📁 File Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-600">
                  <th className="text-left py-2 px-3 text-dark-300">File</th>
                  <th className="text-right py-2 px-3 text-dark-300">Lines</th>
                  <th className="text-right py-2 px-3 text-dark-300">Functions</th>
                  <th className="text-right py-2 px-3 text-dark-300">Complexity</th>
                  <th className="text-right py-2 px-3 text-dark-300">Issues</th>
                </tr>
              </thead>
              <tbody>
                {fileStats
                  .sort((a: any, b: any) => b.issueCount - a.issueCount)
                  .map((fs: any) => (
                    <tr key={fs.path} className="border-b border-dark-700/50 hover:bg-dark-700/20">
                      <td className="py-2 px-3 text-dark-200 font-mono text-xs">{fs.path}</td>
                      <td className="py-2 px-3 text-right text-dark-300">{fs.lines}</td>
                      <td className="py-2 px-3 text-right text-dark-300">{fs.functions}</td>
                      <td className="py-2 px-3 text-right text-dark-300">{fs.complexity}</td>
                      <td className="py-2 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          fs.issueCount > 5 ? 'bg-red-500/20 text-red-400' :
                          fs.issueCount > 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {fs.issueCount}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

function ScoreCard({ label, value, color, suffix }: {
  label: string;
  value: number;
  color: string;
  suffix?: string;
}) {
  const colorMap: Record<string, string> = {
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    blue: 'text-accent-blue',
    orange: 'text-orange-400',
  };

  return (
    <div className="p-4 rounded-xl bg-dark-700/50 border border-dark-600/50 text-center">
      <p className="text-dark-400 text-sm mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colorMap[color] || 'text-white'}`}>
        {value}
      </p>
      {suffix && <p className="text-dark-400 text-xs mt-1">{suffix}</p>}
    </div>
  );
}
