'use client';

import { useState } from 'react';

interface AutoFixPanelProps {
  auditId: string;
  issue: {
    id: string;
    title: string;
    description: string;
    severity: string;
    filePath?: string;
    originalCode?: string;
  };
  onClose: () => void;
}

export default function AutoFixPanel({ auditId, issue, onClose }: AutoFixPanelProps) {
  const [fixedCode, setFixedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateFix = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/github/${auditId}/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: issue.id,
          filePath: issue.filePath || 'unknown',
          originalCode: issue.originalCode || '',
          issue: `${issue.title}: ${issue.description}`,
        }),
      });
      const data = await res.json();
      setFixedCode(data.fixedCode || 'Failed to generate fix');
    } catch {
      setFixedCode('Error generating fix. Please try again.');
    }
    setLoading(false);
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(fixedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-lg bg-bg-surface border-l border-border-subtle overflow-y-auto animate-slide-in-right"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-bg-surface/95 backdrop-blur-sm border-b border-border-subtle p-4 flex items-center justify-between z-10">
          <div>
            <h3 className="font-semibold">AI Auto-Fix</h3>
            <p className="text-xs text-text-muted">{issue.filePath || 'Unknown file'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-bg flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">✕</button>
        </div>

        {/* Issue */}
        <div className="p-4 border-b border-border-subtle">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${issue.severity === 'critical' ? 'bg-accent-red/10 text-accent-red' : issue.severity === 'high' ? 'bg-accent-amber/10 text-accent-amber' : 'bg-accent-blue/10 text-accent-blue'}`}>
              {issue.severity}
            </span>
          </div>
          <h4 className="font-medium mb-1">{issue.title}</h4>
          <p className="text-sm text-text-secondary">{issue.description}</p>
        </div>

        {/* Generate */}
        {!fixedCode && !loading && (
          <div className="p-4">
            <button onClick={generateFix} className="w-full py-3 rounded-xl bg-accent-purple text-white font-semibold hover:opacity-90 transition-opacity">
              🤖 Generate Fix
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="p-4 text-center">
            <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-text-muted">AI is generating fix...</p>
          </div>
        )}

        {/* Fixed Code */}
        {fixedCode && (
          <div className="p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-accent-green">Fixed Code</h4>
                <button onClick={copyCode} className="text-xs px-3 py-1 rounded-lg bg-accent-green/10 text-accent-green hover:bg-accent-green/20 transition-colors">
                  {copied ? '✓ Copied' : 'Copy Code'}
                </button>
              </div>
              <pre className="bg-bg rounded-xl p-4 text-sm overflow-x-auto border border-border-subtle">
                <code className="text-text-primary">{fixedCode}</code>
              </pre>
            </div>

            <div className="flex gap-3">
              <button onClick={generateFix}
                className="flex-1 py-2.5 rounded-xl bg-bg border border-border-subtle text-sm font-medium hover:border-border-subtle transition-colors">
                Regenerate
              </button>
              {issue.filePath && (
                <a href={`https://github.com/search?q=${encodeURIComponent(issue.filePath)}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-bg border border-border-subtle text-sm font-medium text-center hover:border-border-subtle transition-colors">
                  Open in GitHub
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
