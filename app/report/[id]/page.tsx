'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface AuditData {
  id: string;
  url: string;
  status: string;
  results: any;
  aiSummary: string | null;
  createdAt: string;
}

interface AuditStatus {
  id: string;
  url: string;
  status: string;
  currentStep: string | null;
  createdAt: string;
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;

  const [status, setStatus] = useState<AuditStatus | null>(null);
  const [report, setReport] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);

  const pollStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/audit/${auditId}/status`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);

        if (data.status === 'completed' || data.status === 'failed') {
          setPolling(false);
          // Fetch full report
          const reportResponse = await fetch(`/api/audit/${auditId}/report`);
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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const handlePrint = () => {
    window.print();
  };

  // Loading / Progress state
  if (loading || (status && status.status === 'pending')) {
    return (
      <ProgressView
        status={status}
        url={status?.url || ''}
      />
    );
  }

  if (status && status.status === 'running') {
    return (
      <ProgressView
        status={status}
        url={status.url}
      />
    );
  }

  if (status && status.status === 'failed' && !report) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Audit Failed</h1>
          <p className="text-text-secondary mb-6">
            The audit for <span className="text-white">{status.url}</span> failed. 
            This might be because the website is unreachable or timed out.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-xl bg-accent-blue text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Try Another URL
          </button>
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

  return (
    <main className="min-h-screen pb-20">
      {/* Header */}
      <header className="border-b border-border-subtle sticky top-0 bg-bg/95 backdrop-blur z-50 no-print">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-accent-blue to-accent-purple rounded-lg flex items-center justify-center text-xs font-bold">
              A
            </div>
            <span className="font-bold">AuditIQ</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="px-4 py-2 rounded-lg bg-bg-surface border border-border-subtle text-sm hover:bg-bg-surface transition-colors"
            >
              Share Report
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm hover:bg-accent-blue/20 transition-colors"
            >
              Download PDF
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-8">
        {/* URL + Overall Score */}
        <div className="mb-8">
          <p className="text-text-muted text-sm mb-1">{report.url}</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <OverallScore results={report.results} />
            <div className="flex-1">
              <p className="text-text-muted text-sm">
                Audited on {new Date(report.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* AI Summary - Most Prominent */}
        {report.aiSummary && (
          <AISummary summary={report.aiSummary} />
        )}

        {/* Performance Metrics */}
        {report.results?.lighthouse && (
          <PerformanceMetrics data={report.results.lighthouse} />
        )}

        {/* Security Headers */}
        {report.results?.headers && (
          <SecurityHeaders data={report.results.headers} />
        )}

        {/* Console Errors */}
        {report.results?.playwright && (
          <ConsoleErrors data={report.results.playwright} />
        )}

        {/* Broken Links */}
        {report.results?.links && (
          <BrokenLinks data={report.results.links} />
        )}

        {/* SEO Checklist */}
        {report.results?.seo && (
          <SEOChecklist data={report.results.seo} />
        )}

        {/* Screenshots */}
        {report.results?.playwright?.screenshots && (
          <Screenshots data={report.results.playwright.screenshots} />
        )}

        {/* Errors from failed steps */}
        {report.results?.errors?.failedSteps?.length > 0 && (
          <FailedSteps steps={report.results.errors.failedSteps} />
        )}
      </div>
    </main>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function ProgressView({ status, url }: { status: AuditStatus | null; url: string }) {
  const steps = [
    { key: 'pending', label: 'Queuing audit job...', icon: '⏳' },
    { key: 'Initializing audit...', label: 'Initializing audit...', icon: '🔧' },
    { key: 'Fetching page content...', label: 'Fetching page content...', icon: '📥' },
    { key: 'Running performance & security checks...', label: 'Running performance & security checks...', icon: '⚡' },
    { key: 'Generating AI analysis...', label: 'Generating AI analysis...', icon: '🤖' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === status?.currentStep);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-lg mx-auto px-4">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-2">Analyzing Website</h1>
        <p className="text-text-muted text-sm mb-8 truncate max-w-md mx-auto">{url}</p>

        <div className="space-y-3 text-left max-w-sm mx-auto">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isDone = index < currentStepIndex;

            return (
              <div
                key={step.key}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-accent-blue/10 border border-accent-blue/20'
                    : isDone
                    ? 'opacity-50'
                    : 'opacity-30'
                }`}
              >
                <span className="text-lg">{isDone ? '✅' : isActive ? step.icon : '⏳'}</span>
                <span className={`text-sm ${isActive ? 'text-white font-medium' : 'text-text-secondary'}`}>
                  {step.label}
                </span>
                {isActive && (
                  <div className="ml-auto">
                    <div className="w-4 h-4 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-text-muted text-xs mt-8">
          This usually takes 30-60 seconds
        </p>
      </div>
    </main>
  );
}

function OverallScore({ results }: { results: any }) {
  // Calculate overall score from available data
  let score = 0;
  let count = 0;

  if (results?.lighthouse?.performance) {
    score += results.lighthouse.performance;
    count++;
  }
  if (results?.lighthouse?.seo) {
    score += results.lighthouse.seo;
    count++;
  }
  if (results?.lighthouse?.accessibility) {
    score += results.lighthouse.accessibility;
    count++;
  }
  if (results?.seo?.score !== undefined) {
    score += results.seo.score;
    count++;
  }

  const overallScore = count > 0 ? Math.round(score / count) : 0;

  const getColor = (s: number) => {
    if (s >= 80) return 'text-accent-green';
    if (s >= 50) return 'text-accent-yellow';
    return 'text-accent-red';
  };

  const getRingColor = (s: number) => {
    if (s >= 80) return '#22c55e';
    if (s >= 50) return '#eab308';
    return '#ef4444';
  };

  const circumference = 2 * Math.PI * 45;
  const dashoffset = circumference - (overallScore / 100) * circumference;

  return (
    <div className="relative w-32 h-32 flex-shrink-0">
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={getRingColor(overallScore)}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className={`text-3xl font-bold ${getColor(overallScore)}`}>
            {overallScore}
          </span>
          <span className="block text-text-muted text-xs">/100</span>
        </div>
      </div>
    </div>
  );
}

function AISummary({ summary }: { summary: string }) {
  return (
    <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-accent-purple/10 via-bg-surface/50 to-accent-blue/10 border border-accent-purple/20">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🤖</span>
        <h2 className="text-lg font-bold">AI Analysis</h2>
      </div>
      <div className="prose prose-invert prose-sm max-w-none">
        <div className="text-text-primary whitespace-pre-wrap leading-relaxed">
          {summary}
        </div>
      </div>
    </div>
  );
}

function PerformanceMetrics({ data }: { data: any }) {
  const metrics = [
    {
      label: 'Performance',
      value: data.performance,
      unit: '/100',
      isScore: true,
    },
    {
      label: 'Accessibility',
      value: data.accessibility,
      unit: '/100',
      isScore: true,
    },
    { label: 'SEO', value: data.seo, unit: '/100', isScore: true },
    {
      label: 'Best Practices',
      value: data.bestPractices,
      unit: '/100',
      isScore: true,
    },
    {
      label: 'LCP',
      value: data.metrics.lcp ? (data.metrics.lcp / 1000).toFixed(2) : 'N/A',
      unit: data.metrics.lcp ? 's' : '',
      bar: data.metrics.lcp ? Math.min(data.metrics.lcp / 4000, 1) : 0,
      threshold: { good: 2500, bad: 4000, value: data.metrics.lcp },
    },
    {
      label: 'FCP',
      value: data.metrics.fcp ? (data.metrics.fcp / 1000).toFixed(2) : 'N/A',
      unit: data.metrics.fcp ? 's' : '',
      bar: data.metrics.fcp ? Math.min(data.metrics.fcp / 3000, 1) : 0,
      threshold: { good: 1800, bad: 3000, value: data.metrics.fcp },
    },
    {
      label: 'CLS',
      value: data.metrics.cls !== null ? data.metrics.cls.toFixed(3) : 'N/A',
      unit: '',
      bar: data.metrics.cls !== null ? Math.min(data.metrics.cls / 0.25, 1) : 0,
      threshold: { good: 0.1, bad: 0.25, value: data.metrics.cls },
    },
    {
      label: 'TBT',
      value: data.metrics.tbt ? data.metrics.tbt.toFixed(0) : 'N/A',
      unit: data.metrics.tbt ? 'ms' : '',
      bar: data.metrics.tbt ? Math.min(data.metrics.tbt / 600, 1) : 0,
      threshold: { good: 200, bad: 600, value: data.metrics.tbt },
    },
    {
      label: 'TTFB',
      value: data.metrics.ttfb ? (data.metrics.ttfb / 1000).toFixed(2) : 'N/A',
      unit: data.metrics.ttfb ? 's' : '',
      bar: data.metrics.ttfb ? Math.min(data.metrics.ttfb / 1800, 1) : 0,
      threshold: { good: 800, bad: 1800, value: data.metrics.ttfb },
    },
  ];

  const getScoreColor = (v: number) => {
    if (v >= 80) return 'bg-accent-green';
    if (v >= 50) return 'bg-accent-yellow';
    return 'bg-accent-red';
  };

  const getBarColor = (threshold: any, value: number) => {
    if (value <= threshold.good) return 'bg-accent-green';
    if (value <= threshold.bad) return 'bg-accent-yellow';
    return 'bg-accent-red';
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span>⚡</span> Performance Metrics
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="p-4 rounded-xl bg-bg-surface border border-border-subtle"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-sm">{metric.label}</span>
              <span className="font-mono font-semibold">
                {metric.value}
                <span className="text-text-muted text-xs">{metric.unit}</span>
              </span>
            </div>
            {metric.isScore ? (
              <div className="w-full h-2 rounded-full bg-bg-surface">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getScoreColor(
                    metric.value as number
                  )}`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            ) : metric.threshold ? (
              <div className="w-full h-2 rounded-full bg-bg-surface">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getBarColor(
                    metric.threshold,
                    metric.threshold.value || 0
                  )}`}
                  style={{ width: `${(metric.bar || 0) * 100}%` }}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function SecurityHeaders({ data }: { data: any }) {
  const headers = data.securityHeaders;
  const headerList = Object.entries(headers) as [string, { present: boolean; value: string | null }][];

  const presentCount = headerList.filter(([, h]) => h.present).length;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span>🔒</span> Security Headers
        <span className="text-sm font-normal text-text-muted">
          ({presentCount}/{headerList.length} present)
        </span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {headerList.map(([name, header]) => (
          <div
            key={name}
            className={`flex items-center gap-3 p-4 rounded-xl border ${
              header.present
                ? 'bg-accent-green/5 border-accent-green/20'
                : 'bg-accent-red/5 border-accent-red/20'
            }`}
          >
            <span className="text-lg">{header.present ? '✅' : '❌'}</span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-sm font-medium truncate">{name}</p>
              {header.value && (
                <p className="text-text-muted text-xs truncate mt-0.5">
                  {header.value}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-6 text-sm text-text-secondary">
        <span className="flex items-center gap-1">
          🔓 HTTPS: {data.isHttps ? 'Yes' : 'No'}
        </span>
        <span>⏱ Response: {data.responseTime}ms</span>
        <span>📊 Status: {data.statusCode}</span>
      </div>
    </div>
  );
}

function ConsoleErrors({ data }: { data: any }) {
  const [expanded, setExpanded] = useState(false);

  if (!data.consoleErrors?.length && !data.failedRequests?.length) {
    return (
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span>🐛</span> Console & Network Errors
        </h2>
        <div className="p-4 rounded-xl bg-accent-green/5 border border-accent-green/20 text-accent-green">
          No console errors or failed requests detected!
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span>🐛</span> Console & Network Errors
        <span className="text-sm font-normal text-text-muted">
          ({data.consoleErrors?.length || 0} errors,{' '}
          {data.failedRequests?.length || 0} failed requests)
        </span>
      </h2>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 rounded-xl bg-bg-surface border border-border-subtle hover:border-border-subtle transition-colors flex items-center justify-between"
      >
        <span className="text-sm text-text-secondary">
          {expanded ? 'Hide details' : 'Show details'}
        </span>
        <span className="text-text-muted">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {data.consoleErrors?.map((err: any, i: number) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-accent-red/5 border border-accent-red/10"
            >
              <p className="font-mono text-xs text-accent-red">{err.type}</p>
              <p className="text-sm mt-1">{err.text}</p>
              {err.url && (
                <p className="text-text-muted text-xs mt-1">
                  {err.url}:{err.line}
                </p>
              )}
            </div>
          ))}
          {data.failedRequests?.map((req: any, i: number) => (
            <div
              key={`req-${i}`}
              className="p-3 rounded-lg bg-accent-yellow/5 border border-accent-yellow/10"
            >
              <p className="font-mono text-xs text-accent-yellow">
                {req.status} {req.statusText}
              </p>
              <p className="text-sm mt-1 truncate">{req.url}</p>
              {req.failureText && (
                <p className="text-text-muted text-xs mt-1">{req.failureText}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BrokenLinks({ data }: { data: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span>🔗</span> Link Analysis
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-bg-surface border border-border-subtle text-center">
          <p className="text-2xl font-bold">{data.linkStats?.total || 0}</p>
          <p className="text-text-muted text-xs">Total Links</p>
        </div>
        <div className="p-3 rounded-xl bg-accent-green/5 border border-accent-green/20 text-center">
          <p className="text-2xl font-bold text-accent-green">
            {data.linkStats?.working || 0}
          </p>
          <p className="text-text-muted text-xs">Working</p>
        </div>
        <div className="p-3 rounded-xl bg-accent-red/5 border border-accent-red/20 text-center">
          <p className="text-2xl font-bold text-accent-red">
            {data.linkStats?.broken || 0}
          </p>
          <p className="text-text-muted text-xs">Broken</p>
        </div>
        <div className="p-3 rounded-xl bg-bg-surface border border-border-subtle text-center">
          <p className="text-2xl font-bold">{data.linkStats?.skipped || 0}</p>
          <p className="text-text-muted text-xs">Skipped</p>
        </div>
      </div>

      {data.brokenLinks?.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-left p-4 rounded-xl bg-bg-surface border border-border-subtle hover:border-border-subtle transition-colors flex items-center justify-between"
          >
            <span className="text-sm text-text-secondary">
              {expanded ? 'Hide broken links' : `Show ${data.brokenLinks.length} broken links`}
            </span>
            <span className="text-text-muted">{expanded ? '▲' : '▼'}</span>
          </button>

          {expanded && (
            <div className="mt-3 space-y-2">
              {data.brokenLinks.map((link: any, i: number) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-accent-red/5 border border-accent-red/10"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-accent-red">
                      {link.status}
                    </span>
                    <span className="text-sm truncate flex-1">{link.url}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SEOChecklist({ data }: { data: any }) {
  const checks = [
    {
      label: 'Title Tag',
      passed: data.title?.present && data.title?.optimalLength,
      detail: data.title?.present
        ? `${data.title.length} chars ${data.title.optimalLength ? '(optimal)' : '(should be 50-60 chars)'}`
        : 'Missing',
    },
    {
      label: 'Meta Description',
      passed: data.metaDescription?.present && data.metaDescription?.optimalLength,
      detail: data.metaDescription?.present
        ? `${data.metaDescription.length} chars ${data.metaDescription.optimalLength ? '(optimal)' : '(should be 120-160 chars)'}`
        : 'Missing',
    },
    {
      label: 'H1 Tag',
      passed: data.h1?.hasExactlyOne,
      detail: data.h1?.count > 0
        ? `${data.h1.count} found ${data.h1.hasExactlyOne ? '' : '(should be exactly 1)'}`
        : 'Missing',
    },
    {
      label: 'Image Alt Text',
      passed: data.imagesWithoutAlt?.withoutAlt === 0 && data.imagesWithoutAlt?.total > 0,
      detail: data.imagesWithoutAlt?.total > 0
        ? `${data.imagesWithoutAlt.withoutAlt}/${data.imagesWithoutAlt.total} images missing alt`
        : 'No images found',
    },
    {
      label: 'Canonical Tag',
      passed: data.canonical?.present,
      detail: data.canonical?.present ? 'Present' : 'Missing',
    },
    {
      label: 'robots.txt',
      passed: data.robotsTxt?.exists,
      detail: data.robotsTxt?.exists ? 'Exists' : 'Not found',
    },
    {
      label: 'sitemap.xml',
      passed: data.sitemapXml?.exists,
      detail: data.sitemapXml?.exists
        ? `Found (${data.sitemapXml.urls} URLs)`
        : 'Not found',
    },
    {
      label: 'Open Graph Tags',
      passed:
        data.openGraph?.title &&
        data.openGraph?.description &&
        data.openGraph?.image,
      detail: [
        data.openGraph?.title && 'title',
        data.openGraph?.description && 'description',
        data.openGraph?.image && 'image',
        data.openGraph?.url && 'url',
      ]
        .filter(Boolean)
        .join(', ') || 'None found',
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span>🔍</span> SEO Checklist
        <span className="text-sm font-normal text-text-muted">
          ({passedCount}/{checks.length} passed)
        </span>
      </h2>

      <div className="space-y-2">
        {checks.map((check) => (
          <div
            key={check.label}
            className={`flex items-center gap-3 p-4 rounded-xl border ${
              check.passed
                ? 'bg-accent-green/5 border-accent-green/20'
                : 'bg-accent-yellow/5 border-accent-yellow/20'
            }`}
          >
            <span className="text-lg">{check.passed ? '✅' : '⚠️'}</span>
            <div className="flex-1">
              <span className="font-medium text-sm">{check.label}</span>
              <span className="text-text-muted text-sm ml-2">— {check.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Screenshots({ data }: { data: any }) {
  if (!data?.desktop && !data?.mobile) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span>📸</span> Screenshots
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.desktop && (
          <div className="rounded-xl overflow-hidden border border-border-subtle">
            <div className="p-2 bg-bg-surface text-center text-xs text-text-muted">
              Desktop (1440×900)
            </div>
            <img
              src={`data:image/png;base64,${data.desktop}`}
              alt="Desktop screenshot"
              className="w-full"
            />
          </div>
        )}
        {data.mobile && (
          <div className="rounded-xl overflow-hidden border border-border-subtle">
            <div className="p-2 bg-bg-surface text-center text-xs text-text-muted">
              Mobile (375×812)
            </div>
            <img
              src={`data:image/png;base64,${data.mobile}`}
              alt="Mobile screenshot"
              className="w-full max-w-xs mx-auto"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function FailedSteps({ steps }: { steps: { step: string; name: string; error: string }[] }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span>⚠️</span> Failed Steps
      </h2>
      <div className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.step}
            className="p-4 rounded-xl bg-accent-red/5 border border-accent-red/20"
          >
            <p className="font-medium text-accent-red">{step.name}</p>
            <p className="text-text-muted text-sm mt-1">{step.error}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
