"use client";

import { useEffect, useState } from "react";

interface AuditStatus {
  id: string;
  url: string;
  status: string;
  currentStep: string | null;
}

export default function AuditProgress({
  auditId,
  onRerun,
}: {
  auditId: string;
  onRerun?: () => void;
}) {
  const [audit, setAudit] = useState<AuditStatus | null>(null);

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/audit/${auditId}/status`);
        const data = await response.json();
        setAudit(data);

        if (data.status === "completed" || data.status === "failed") {
          clearInterval(pollInterval);
        }
      } catch {
        // Keep polling
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [auditId]);

  const steps = [
    { key: "fetch", label: "Fetching page content", icon: "📥" },
    { key: "headers", label: "Checking security headers", icon: "🔒" },
    { key: "seo", label: "Analyzing SEO", icon: "🔍" },
    { key: "links", label: "Scanning links", icon: "🔗" },
    { key: "lighthouse", label: "Running performance audit", icon: "⚡" },
    { key: "playwright", label: "Checking for errors", icon: "🐛" },
    { key: "ai", label: "Generating AI report", icon: "🤖" },
  ];

  const currentStepKey = audit?.currentStep || "";
  const currentIndex = steps.findIndex((s) => s.key === currentStepKey);

  if (!audit) {
    return (
      <div className="flex items-center gap-3 text-text-secondary">
        <div className="animate-spin h-5 w-5 border-2 border-accent-blue border-t-transparent rounded-full" />
        <span>Connecting to audit engine...</span>
      </div>
    );
  }

  if (audit.status === "completed") {
    return (
      <div className="text-center">
        <div className="text-2xl font-bold text-accent-green mb-2">Audit Complete!</div>
        <div className="text-text-muted">Loading results...</div>
      </div>
    );
  }

  if (audit.status === "failed") {
    return (
      <div className="text-center">
        <div className="text-2xl font-bold text-accent-red mb-2">Audit Failed</div>
        <div className="text-text-muted">{currentStepKey || "An unexpected error occurred."}</div>
        {onRerun && (
          <button
            onClick={onRerun}
            className="mt-4 px-6 py-3 rounded-xl bg-accent-purple text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Re-run Audit
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      <div className="text-center mb-6">
        <div className="text-lg text-text-primary font-medium">
          Auditing <span className="text-accent-blue">{audit.url}</span>
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((step, index) => {
          const isActive = index === currentIndex;
          const isDone = currentIndex >= 0 && index < currentIndex;

          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                isActive
                  ? "bg-accent-blue/10 border border-accent-blue/20"
                  : isDone
                  ? "bg-accent-green/5 border border-accent-green/10"
                  : "bg-bg/50 border border-transparent"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  isActive
                    ? "bg-accent-blue text-white animate-pulse"
                    : isDone
                    ? "bg-accent-green text-white"
                    : "bg-bg-surface text-text-muted"
                }`}
              >
                {isDone ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : isActive ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <span>{step.icon}</span>
                )}
              </div>
              <span
                className={`text-sm ${
                  isActive
                    ? "text-white font-medium"
                    : isDone
                    ? "text-text-muted"
                    : "text-text-muted"
                }`}
              >
                {step.label}
                {isActive && (
                  <span className="ml-2 text-accent-blue animate-pulse">running...</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
