'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

interface AdminStats {
  totalUsers: number;
  totalAudits: number;
  todayAudits: number;
  weekAudits: number;
  recentUsers: { id: string; name: string; email: string; plan: string; created_at: string }[];
  dbConnected: boolean;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats').then((r) => r.json()).then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-secondary">Loading admin data...</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <p className="text-text-secondary mb-4">Failed to load stats</p>
          <Link href="/" className="btn-primary text-sm">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-32 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold">Admin Dashboard</h1>
            <p className="text-text-secondary text-sm mt-1">System overview and user management</p>
          </div>
          <Link href="/" className="btn-ghost text-sm">← Back to App</Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.totalUsers, color: 'text-primary' },
            { label: 'Total Audits', value: stats.totalAudits, color: 'text-accent-cyan' },
            { label: "Today's Audits", value: stats.todayAudits, color: 'text-accent-green' },
            { label: 'This Week', value: stats.weekAudits, color: 'text-accent-amber' },
          ].map((s, i) => (
            <div key={s.label} className="card animate-fade-up" style={{ animationDelay: `${i * 100}ms`, opacity: 0, animationFillMode: 'forwards' }}>
              <p className="text-sm text-text-secondary mb-1">{s.label}</p>
              <p className={`text-3xl font-bold font-mono ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* System Health */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold mb-4">System Health</h2>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${stats.dbConnected ? 'bg-accent-green' : 'bg-accent-red'}`} />
              Database: {stats.dbConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Recent Users */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Signups</h2>
          {stats.recentUsers.length === 0 ? (
            <p className="text-text-muted text-sm py-8 text-center">No users yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left py-3 px-2 text-text-secondary font-medium">Name</th>
                    <th className="text-left py-3 px-2 text-text-secondary font-medium">Email</th>
                    <th className="text-left py-3 px-2 text-text-secondary font-medium">Plan</th>
                    <th className="text-left py-3 px-2 text-text-secondary font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border-subtle/50 hover:bg-bg-surface/50 transition-colors">
                      <td className="py-3 px-2">{user.name || '—'}</td>
                      <td className="py-3 px-2 text-text-secondary">{user.email}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${user.plan === 'pro' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-bg-surface text-text-secondary border border-border-subtle'}`}>
                          {user.plan}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-text-muted">{new Date(user.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
