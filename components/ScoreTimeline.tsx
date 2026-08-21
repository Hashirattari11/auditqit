'use client';

import { useState, useEffect } from 'react';

interface ScorePoint {
  id: string;
  date: string;
  overall: number;
  performance: number;
  seo: number;
  security: number;
}

interface ScoreTimelineProps {
  url: string;
  currentId: string;
}

export default function ScoreTimeline({ url, currentId }: ScoreTimelineProps) {
  const [history, setHistory] = useState<ScorePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/audit/history?url=${encodeURIComponent(url)}`)
      .then(r => r.ok ? r.json() : { history: [] })
      .then(d => { setHistory(d.history || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [url]);

  if (loading || history.length < 2) return null;

  const current = history.find(h => h.id === currentId);
  const previous = history.length >= 2 ? history[history.length - 2] : null;

  const diff = (a: number, b: number) => {
    const d = a - b;
    return d > 0 ? { text: `+${d}`, color: 'text-accent-green', arrow: '↑' }
      : d < 0 ? { text: `${d}`, color: 'text-accent-red', arrow: '↓' }
      : { text: '0', color: 'text-text-muted', arrow: '→' };
  };

  // SVG line chart
  const maxH = 120;
  const w = 600;
  const pad = 20;
  const points = history.map((h, i) => ({
    x: pad + (i / Math.max(history.length - 1, 1)) * (w - pad * 2),
    y: maxH - pad - (h.overall / 100) * (maxH - pad * 2),
    ...h,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const trendColor = current && previous
    ? current.overall > previous.overall ? '#22c55e' : current.overall < previous.overall ? '#ef4444' : '#64748b'
    : '#6366f1';

  return (
    <div className="mb-8 p-6 rounded-2xl bg-bg-surface border border-border-subtle">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Score History</h3>
        {current && previous && (
          <span className={`text-sm font-medium ${diff(current.overall, previous.overall).color}`}>
            {diff(current.overall, previous.overall).text} since last audit {diff(current.overall, previous.overall).arrow}
          </span>
        )}
      </div>

      {/* SVG Chart */}
      <svg viewBox={`0 0 ${w} ${maxH}`} className="w-full h-32 mb-4">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line x1={pad} y1={maxH - pad - (v / 100) * (maxH - pad * 2)} x2={w - pad} y2={maxH - pad - (v / 100) * (maxH - pad * 2)} stroke="#1e293b" strokeWidth="1" />
            <text x={pad - 5} y={maxH - pad - (v / 100) * (maxH - pad * 2) + 4} fill="#475569" fontSize="8" textAnchor="end">{v}</text>
          </g>
        ))}
        {/* Line */}
        <path d={pathD} fill="none" stroke={trendColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {points.map((p, i) => (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r="5" fill={p.id === currentId ? trendColor : '#1e293b'} stroke={trendColor} strokeWidth="2" />
            <title>{`${new Date(p.date).toLocaleDateString()}: ${p.overall}`}</title>
          </g>
        ))}
      </svg>

      {/* Score Diff Table */}
      {current && previous && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Performance', curr: current.performance, prev: previous.performance },
            { label: 'SEO', curr: current.seo, prev: previous.seo },
            { label: 'Security', curr: current.security, prev: previous.security },
          ].map(m => {
            const d = diff(m.curr, m.prev);
            return (
              <div key={m.label} className="text-center p-2 rounded-lg bg-bg/50">
                <p className="text-xs text-text-muted mb-1">{m.label}</p>
                <p className="text-sm font-mono">
                  <span className="text-text-secondary">{m.prev}</span>
                  <span className="text-text-muted mx-1">&rarr;</span>
                  <span className="font-semibold">{m.curr}</span>
                </p>
                <p className={`text-xs font-medium ${d.color}`}>{d.text} {d.arrow}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
