"use client";

import { useEffect, useState } from "react";

interface AuditStatus {
  id: string;
  url: string;
  status: string;
  currentStep: string | null;
}

export default function AuditProgress({ auditId }: { auditId: string }) {
  const [audit, setAudit] = useState<AuditStatus | null>(null);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/audit/${auditId}/status`);
        const data = await response.json();
        setAudit(data);
        setPollCount((c) => c + 1);

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
    { label: "Running Lighthouse audit", icon: "LH" },
    { label: "Scanning for errors", icon: "PW" },
    { label: "Checking security headers", icon: "SH" },
    { label: "Scanning links", icon: "LC" },
    { label: "Analyzing SEO", icon: "SEO" },
    { label: "Generating AI report", icon: "AI" },
  ];

  // Determine which step we're on based on currentStep text
  const currentStepText = audit?.currentStep || "";
  const getStepStatus = (stepLabel: string) => {
    if (!currentStepText) return "pending";
    if (currentStepText.toLowerCase().includes(stepLabel.toLowerCase().split(" ")[0])) {
      return "running";
    }
    // Check if already passed based on order
    const stepIndex = steps.findIndex((s) => s.label === stepLabel);
    const currentIndex = steps.findIndex((s) =>
      currentStepText.toLowerCase().includes(s.label.toLowerCase().split(" ")[0])
    );
    if (currentIndex >= 0 && stepIndex < currentIndex) return "done";
    if (currentIndex >= 0 && stepIndex > currentIndex) return "pending";
    return "pending";
  };

  if (!audit) {
    return (
      <div className="flex items-center gap-3 text-dark-300">
        <div className="animate-spin h-5 w-5 border-2 border-accent-blue border-t-transparent rounded-full" />
        <span>Connecting to audit engine...</span>
      </div>
    );
  }

  if (audit.status === "completed") {
    return (
      <div className="text-center">
        <div className="text-2xl font-bold text-accent-green mb-2">Audit Complete!</div>
        <div className="text-dark-400">Loading results...</div>
      </div>
    );
  }

  if (audit.status === "failed") {
    return (
      <div className="text-center">
        <div className="text-2xl font-bold text-accent-red mb-2">Audit Failed</div>
        <div className="text-dark-400">{currentStepText || "An unexpected error occurred."}</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      <div className="text-center mb-6">
        <div className="text-lg text-dark-200 font-medium">
          Auditing <span className="text-accent-blue">{audit.url}</span>
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((step, index) => {
          const status = getStepStatus(step.label);
          return (
            <div
              key={index}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                status === "running"
                  ? "bg-accent-blue/10 border border-accent-blue/20"
                  : status === "done"
                  ? "bg-accent-green/5 border border-accent-green/10"
                  : "bg-dark-800/50 border border-transparent"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  status === "running"
                    ? "bg-accent-blue text-white animate-pulse"
                    : status === "done"
                    ? "bg-accent-green text-white"
                    : "bg-dark-700 text-dark-400"
                }`}
              >
                {status === "done" ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : status === "running" ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  step.icon
                )}
              </div>
              <span
                className={`text-sm ${
                  status === "running"
                    ? "text-dark-100 font-medium"
                    : status === "done"
                    ? "text-dark-400"
                    : "text-dark-500"
                }`}
              >
                {step.label}
                {status === "running" && (
                  <span className="ml-2 text-accent-blue animate-pulse">running...</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      <div className="text-center text-dark-500 text-xs mt-4">
        Poll #{pollCount} — Updates every 2 seconds
      </div>
    </div>
  );
}
