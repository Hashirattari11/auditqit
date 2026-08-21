'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface LeaderboardEntry {
  id: string;
  url: string;
  performance: number;
  seo: number;
  security: number;
  overall: number;
  created_at: string;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'overall' | 'performance' | 'seo' | 'security'>('overall');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/leaderboard').then(r => r.ok ? r.json() : { entries: [] }).then(d => {
      setEntries(d.entries || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = entries
    .filter(e => !search || e.url.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b[filter] - a[filter]);

  const getMedal = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;

  return (
    <main className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold mb-3">Top Performing Websites</h1>
          <p className="text-text-secondary text-lg">Highest scoring sites audited on AuditIQ</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <div className="flex gap-2">
            {(['overall', 'performance', 'seo', 'security'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-bg-surface border border-border-subtle text-text-secondary hover:text-text-primary'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search domains..."
            className="input flex-1 w-full sm:w-auto" />
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-text-muted">
            <p className="text-4xl mb-4">🏆</p>
            <p className="text-lg">No public audits yet</p>
            <p className="text-sm mt-2">Run an audit and make it public to appear here!</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left py-3 px-4 text-text-muted font-medium">#</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Website</th>
                    <th className="text-center py-3 px-4 text-text-muted font-medium">Performance</th>
                    <th className="text-center py-3 px-4 text-text-muted font-medium">SEO</th>
                    <th className="text-center py-3 px-4 text-text-muted font-medium">Security</th>
                    <th className="text-center py-3 px-4 text-text-muted font-medium">Overall</th>
                    <th className="text-right py-3 px-4 text-text-muted font-medium">Audited</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry, i) => (
                    <tr key={entry.id} className="border-b border-border-subtle/50 last:border-0 hover:bg-bg-surface/50 transition-colors">
                      <td className="py-3 px-4 text-lg">{getMedal(i)}</td>
                      <td className="py-3 px-4">
                        <Link href={`/report/${entry.id}`} className="font-medium text-primary hover:underline">
                          {new URL(entry.url).hostname}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-mono font-semibold ${entry.performance >= 80 ? 'text-accent-green' : entry.performance >= 50 ? 'text-accent-yellow' : 'text-accent-red'}`}>
                          {entry.performance}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-mono font-semibold ${entry.seo >= 80 ? 'text-accent-green' : entry.seo >= 50 ? 'text-accent-yellow' : 'text-accent-red'}`}>
                          {entry.seo}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-mono font-semibold ${entry.security >= 80 ? 'text-accent-green' : entry.security >= 50 ? 'text-accent-yellow' : 'text-accent-red'}`}>
                          {entry.security}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-lg font-bold font-mono ${entry.overall >= 80 ? 'text-accent-green' : entry.overall >= 50 ? 'text-accent-yellow' : 'text-accent-red'}`}>
                          {entry.overall}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-text-muted text-xs">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
