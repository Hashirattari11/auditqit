'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-dark-300">Loading admin data...</div>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-dark-300">Failed to load stats</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-dark-600/50 bg-dark-800/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-blue to-accent-purple rounded-lg flex items-center justify-center text-sm font-bold">A</div>
            <span className="text-lg font-bold">AuditIQ Admin</span>
          </Link>
          <Link href="/" className="text-sm text-dark-300 hover:text-white">← Back to App</Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-6 rounded-2xl bg-dark-700/50 border border-dark-600/50">
            <p className="text-sm text-dark-300 mb-1">Total Users</p>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
          </div>
          <div className="p-6 rounded-2xl bg-dark-700/50 border border-dark-600/50">
            <p className="text-sm text-dark-300 mb-1">Total Audits</p>
            <p className="text-3xl font-bold">{stats.totalAudits}</p>
          </div>
          <div className="p-6 rounded-2xl bg-dark-700/50 border border-dark-600/50">
            <p className="text-sm text-dark-300 mb-1">Today&apos;s Audits</p>
            <p className="text-3xl font-bold">{stats.todayAudits}</p>
          </div>
          <div className="p-6 rounded-2xl bg-dark-700/50 border border-dark-600/50">
            <p className="text-sm text-dark-300 mb-1">This Week</p>
            <p className="text-3xl font-bold">{stats.weekAudits}</p>
          </div>
        </div>

        {/* System Health */}
        <div className="mb-8 p-6 rounded-2xl bg-dark-700/50 border border-dark-600/50">
          <h2 className="text-lg font-semibold mb-4">System Health</h2>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${stats.dbConnected ? 'bg-accent-green' : 'bg-accent-red'}`} />
              Database: {stats.dbConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Recent Users */}
        <div className="rounded-2xl bg-dark-700/50 border border-dark-600/50 p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Signups</h2>
          {stats.recentUsers.length === 0 ? (
            <p className="text-dark-400 text-sm">No users yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-600">
                    <th className="text-left py-2 text-dark-300 font-medium">Name</th>
                    <th className="text-left py-2 text-dark-300 font-medium">Email</th>
                    <th className="text-left py-2 text-dark-300 font-medium">Plan</th>
                    <th className="text-left py-2 text-dark-300 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentUsers.map((user) => (
                    <tr key={user.id} className="border-b border-dark-600/30">
                      <td className="py-3">{user.name || '—'}</td>
                      <td className="py-3 text-dark-300">{user.email}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${user.plan === 'pro' ? 'bg-accent-purple/20 text-accent-purple' : 'bg-dark-600 text-dark-300'}`}>
                          {user.plan}
                        </span>
                      </td>
                      <td className="py-3 text-dark-400">{new Date(user.created_at).toLocaleDateString()}</td>
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
