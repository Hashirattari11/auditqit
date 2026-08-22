'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

interface AdminStats {
  totalUsers: number;
  totalAudits: number;
  todayAudits: number;
  weekAudits: number;
  proUsers: number;
  dbConnected: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
  auditCount: number;
  created_at: string;
}

interface Audit {
  id: string;
  url: string;
  status: string;
  results: any;
  userEmail: string;
  created_at: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'users' | 'audits'>('overview');
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then(r => r.json()),
      fetch('/api/admin/users').then(r => r.json()),
      fetch('/api/admin/audits').then(r => r.json()),
    ]).then(([statsData, usersData, auditsData]) => {
      setStats(statsData);
      setUsers(usersData.users || []);
      setAudits(auditsData.audits || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const proUsers = users.filter(u => u.plan === 'pro').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-secondary">Loading admin panel...</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <p className="text-text-secondary mb-4">Failed to load admin data</p>
          <Link href="/" className="btn-primary text-sm">Go Home</Link>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const tabs = ['overview', 'users', 'audits'] as const;

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-32 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold">Admin Dashboard</h1>
            <p className="text-text-secondary text-sm mt-1">System overview and management</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
              <span className="text-accent-green">System Healthy</span>
            </div>
            <Link href="/" className="btn-ghost text-sm">&larr; Back</Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 bg-bg-surface rounded-xl w-fit">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ─────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: stats.totalUsers, icon: '👤', color: 'text-primary' },
                { label: 'Total Audits', value: stats.totalAudits, icon: '🔍', color: 'text-accent-cyan' },
                { label: 'Pro Users', value: proUsers, icon: '⭐', color: 'text-accent-amber' },
                { label: 'Audits Today', value: stats.todayAudits, icon: '📅', color: 'text-accent-green' },
              ].map((s) => (
                <div key={s.label} className="card">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className={`text-3xl font-bold font-mono ${s.color}`}>{s.value.toLocaleString()}</div>
                  <div className="text-text-muted text-sm mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* System Health */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">System Health</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Database', ok: stats.dbConnected },
                  { label: 'AI Service', ok: true },
                  { label: 'API', ok: true },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-bg">
                    <span className="text-text-secondary text-sm">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.ok ? 'bg-accent-green' : 'bg-accent-red'}`} />
                      <span className={`text-sm ${item.ok ? 'text-accent-green' : 'text-accent-red'}`}>
                        {item.ok ? 'Connected' : 'Error'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Audits Preview */}
            {audits.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Recent Audits</h2>
                  <button onClick={() => setTab('audits')} className="text-sm text-primary hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle">
                        <th className="text-left py-2 text-text-muted font-medium">URL</th>
                        <th className="text-left py-2 text-text-muted font-medium">Status</th>
                        <th className="text-left py-2 text-text-muted font-medium">Score</th>
                        <th className="text-left py-2 text-text-muted font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audits.slice(0, 5).map((a) => (
                        <tr key={a.id} className="border-b border-border-subtle/50 last:border-0">
                          <td className="py-2 text-text-primary text-sm truncate max-w-[200px]">{a.url}</td>
                          <td className="py-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              a.status === 'completed' ? 'bg-accent-green/10 text-accent-green' :
                              a.status === 'failed' ? 'bg-accent-red/10 text-accent-red' :
                              'bg-accent-amber/10 text-accent-amber'
                            }`}>{a.status}</span>
                          </td>
                          <td className="py-2 text-text-secondary text-sm">
                            {(() => { try { return JSON.parse(typeof a.results === 'string' ? a.results : '{}')?.ai?.overallScore ?? '-' } catch { return '-' } })()}/100
                          </td>
                          <td className="py-2 text-text-muted text-xs">{new Date(a.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── USERS TAB ────────────────────────── */}
        {tab === 'users' && (
          <div className="card">
            <div className="p-4 border-b border-border-subtle flex items-center justify-between">
              <h2 className="text-lg font-semibold">All Users ({filteredUsers.length})</h2>
              <input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search users..."
                className="input text-sm w-64"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left p-4 text-text-muted font-medium">User</th>
                    <th className="text-left p-4 text-text-muted font-medium">Plan</th>
                    <th className="text-left p-4 text-text-muted font-medium">Audits</th>
                    <th className="text-left p-4 text-text-muted font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border-subtle/50 hover:bg-bg-surface/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm font-bold">
                            {(user.name || user.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-text-primary text-sm font-medium">{user.name || 'No name'}</div>
                            <div className="text-text-muted text-xs">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          user.plan === 'pro' ? 'bg-primary/10 text-primary border border-primary/20' :
                          user.plan === 'team' ? 'bg-accent-purple/10 text-accent-purple border border-accent-purple/20' :
                          'bg-bg text-text-secondary border border-border-subtle'
                        }`}>
                          {(user.plan || 'free').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-text-secondary text-sm">{user.auditCount}</td>
                      <td className="p-4 text-text-muted text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── AUDITS TAB ───────────────────────── */}
        {tab === 'audits' && (
          <div className="card">
            <div className="p-4 border-b border-border-subtle">
              <h2 className="text-lg font-semibold">All Audits ({audits.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left p-4 text-text-muted font-medium">URL</th>
                    <th className="text-left p-4 text-text-muted font-medium">User</th>
                    <th className="text-left p-4 text-text-muted font-medium">Status</th>
                    <th className="text-left p-4 text-text-muted font-medium">Score</th>
                    <th className="text-left p-4 text-text-muted font-medium">Date</th>
                    <th className="text-left p-4 text-text-muted font-medium">Report</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((audit) => (
                    <tr key={audit.id} className="border-b border-border-subtle/50 hover:bg-bg-surface/50 transition-colors">
                      <td className="p-4 text-text-primary text-sm max-w-[180px] truncate">{audit.url}</td>
                      <td className="p-4 text-text-muted text-xs">{audit.userEmail}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          audit.status === 'completed' ? 'bg-accent-green/10 text-accent-green' :
                          audit.status === 'failed' ? 'bg-accent-red/10 text-accent-red' :
                          audit.status === 'running' ? 'bg-accent-cyan/10 text-accent-cyan' :
                          'bg-accent-amber/10 text-accent-amber'
                        }`}>{audit.status}</span>
                      </td>
                      <td className="p-4 text-text-secondary text-sm">
                        {(() => { try { return JSON.parse(typeof audit.results === 'string' ? audit.results : '{}')?.ai?.overallScore ?? '-' } catch { return '-' } })()}/100
                      </td>
                      <td className="p-4 text-text-muted text-xs">{new Date(audit.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <a href={`/report/${audit.id}`} target="_blank" rel="noopener noreferrer"
                           className="text-xs text-primary hover:underline border border-primary/20 px-2 py-1 rounded">
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
