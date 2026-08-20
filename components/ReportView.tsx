"use client";

import ScoreGauge from "./ScoreGauge";
import MetricsBar from "./MetricsBar";
import AiSummary from "./AiSummary";
import SecurityHeaders from "./SecurityHeaders";
import ErrorsList from "./ErrorsList";
import BrokenLinks from "./BrokenLinks";
import SeoChecklist from "./SeoChecklist";
import Screenshots from "./Screenshots";

interface ReportData {
  id: string;
  url: string;
  status: string;
  results: {
    lighthouse?: {
      performance: number;
      seo: number;
      accessibility: number;
      bestPractices: number;
      metrics?: {
        LCP: number;
        CLS: number;
        FCP: number;
        TTFB: number;
        TBT: number;
      };
    };
    playwright?: {
      consoleErrors: string[];
      failedRequests: { url: string; status: number; statusText: string }[];
      screenshots: { desktop: string; mobile: string };
      pageLoaded: boolean;
      loadTime: number;
    };
    headers?: {
      securityHeaders: Record<string, { present: boolean; value: string | null }>;
      https: boolean;
      responseTime: number;
      statusCode: number;
    };
    linkChecker?: {
      totalLinks: number;
      brokenLinks: { url: string; status: number; statusText: string; location: string }[];
      brokenCount: number;
    };
    seo?: Record<string, unknown>;
  };
  aiSummary: string | null;
  createdAt: string;
}

export default function ReportView({ data }: { data: ReportData }) {
  const lh = data.results?.lighthouse;
  const pw = data.results?.playwright;
  const hd = data.results?.headers;
  const lc = data.results?.linkChecker;
  const seo = data.results?.seo;

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const downloadPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Audit Report</h1>
          <p className="text-text-muted mt-1">
            <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">
              {data.url}
            </a>
          </p>
          <p className="text-text-muted text-xs mt-1">
            {new Date(data.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className="px-4 py-2 rounded-lg bg-bg border border-border-subtle text-text-primary hover:bg-bg-surface transition text-sm"
          >
            Share Report
          </button>
          <button
            onClick={downloadPdf}
            className="px-4 py-2 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue hover:bg-accent-blue/20 transition text-sm"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Overall Scores */}
      {lh && (
        <div className="bg-bg/50 border border-border-subtle/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-6">Overall Scores</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ScoreGauge score={lh.performance} label="Performance" />
            <ScoreGauge score={lh.seo} label="SEO" />
            <ScoreGauge score={lh.accessibility} label="Accessibility" />
            <ScoreGauge score={lh.bestPractices} label="Best Practices" />
          </div>
        </div>
      )}

      {/* AI Summary (Most Prominent) */}
      {data.aiSummary && (
        <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-accent-blue/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent-blue/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-dark-100">AI Analysis</h2>
          </div>
          <AiSummary summary={data.aiSummary} />
        </div>
      )}

      {/* Performance Metrics */}
      {lh?.metrics && (
        <div className="bg-bg/50 border border-border-subtle/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4">Performance Metrics</h2>
          <MetricsBar
            metrics={[
              { label: "Largest Contentful Paint (LCP)", value: lh.metrics.LCP, unit: "ms", threshold: { good: 2500, poor: 4000 } },
              { label: "First Contentful Paint (FCP)", value: lh.metrics.FCP, unit: "ms", threshold: { good: 1800, poor: 3000 } },
              { label: "Total Blocking Time (TBT)", value: lh.metrics.TBT, unit: "ms", threshold: { good: 200, poor: 600 } },
              { label: "Time to First Byte (TTFB)", value: lh.metrics.TTFB, unit: "ms", threshold: { good: 800, poor: 1800 } },
              { label: "Cumulative Layout Shift (CLS)", value: lh.metrics.CLS, unit: "cls", threshold: { good: 0.1, poor: 0.25 } },
            ]}
          />
        </div>
      )}

      {/* Security Headers */}
      {hd?.securityHeaders && (
        <div className="bg-bg/50 border border-border-subtle/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-100">Security Headers</h2>
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span>Status: <span className="text-text-primary">{hd.statusCode}</span></span>
              <span>HTTPS: <span className={hd.https ? "text-accent-green" : "text-accent-red"}>{hd.https ? "Yes" : "No"}</span></span>
              <span>TTFB: <span className="text-text-primary">{hd.responseTime}ms</span></span>
            </div>
          </div>
          <SecurityHeaders headers={hd.securityHeaders} />
        </div>
      )}

      {/* Console Errors */}
      {pw && (
        <div className="bg-bg/50 border border-border-subtle/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4">Console Errors</h2>
          <ErrorsList errors={pw.consoleErrors} />
        </div>
      )}

      {/* Broken Links */}
      {lc && (
        <div className="bg-bg/50 border border-border-subtle/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4">Link Check</h2>
          <BrokenLinks links={lc.brokenLinks} total={lc.totalLinks} />
        </div>
      )}

      {/* SEO Checklist */}
      {seo && (
        <div className="bg-bg/50 border border-border-subtle/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4">SEO Checklist</h2>
          <SeoChecklist seo={seo} />
        </div>
      )}

      {/* Screenshots */}
      {pw?.screenshots && (pw.screenshots.desktop || pw.screenshots.mobile) && (
        <div className="bg-bg/50 border border-border-subtle/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4">Screenshots</h2>
          <Screenshots desktop={pw.screenshots.desktop} mobile={pw.screenshots.mobile} />
        </div>
      )}
    </div>
  );
}
