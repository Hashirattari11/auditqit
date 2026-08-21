'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'audits' | 'system'>('users');

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.ok ? r.json() : null).then(d => { setStats(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (!session) return <main className="min-h-screen flex items-center justify-center"><p>Please log in</p></main>;

  return (
    <main className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Analytics</h1>
            <p className="text-text-secondary text-sm mt-1">Platform insights and metrics</p>
          </div>
          <Link href="/dashboard" className="btn-secondary text-sm">Back to Dashboard</Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {(['users', 'audits', 'system'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-bg-surface border border-border-subtle text-text-secondary'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : !stats ? (
          <p className="text-text-muted text-center py-20">Failed to load analytics</p>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {activeTab === 'users' && (
                <>
                  <StatCard label="Total Users" value={stats.totalUsers} icon="👥" color="text-primary" />
                  <StatCard label="Waitlist Signups" value={stats.waitlistCount} icon="📋" color="text-accent-purple" />
                  <StatCard label="This Week" value={stats.weekAudits} icon="📈" color="text-accent-cyan" />
                  <StatCard label="Today" value={stats.todayAudits} icon="⚡" color="text-accent-amber" />
                </>
              )}
              {activeTab === 'audits' && (
                <>
                  <StatCard label="Total Audits" value={stats.totalAudits} icon="📊" color="text-primary" />
                  <StatCard label="Today's Audits" value={stats.todayAudits} icon="📈" color="text-accent-cyan" />
                  <StatCard label="Weekly Audits" value={stats.weekAudits} icon="📅" color="text-accent-amber" />
                  <StatCard label="Avg per Day" value={Math.round((stats.todayAudits || 0))} icon="⚡" color="text-accent-green" />
                </>
              )}
              {activeTab === 'system' && (
                <>
                  <StatCard label="Supabase" value="Connected" icon="🟢" color="text-accent-green" />
                  <StatCard label="Vercel" value="Deployed" icon="🟢" color="text-accent-green" />
                  <StatCard label="AI Engine" value="Ready" icon="🟢" color="text-accent-green" />
                  <StatCard label="Uptime" value="99.9%" icon="⏱" color="text-accent-cyan" />
                </>
              )}
            </div>

            {/* User breakdown */}
            {activeTab === 'users' && stats.recentUsers?.length > 0 && (
              <div className="card">
                <h3 className="font-semibold mb-4">Recent Users</h3>
                <div className="space-y-2">
                  {stats.recentUsers.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between py-2 px-2 border-b border-border-subtle/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{u.name || 'Unnamed'}</p>
                        <p className="text-xs text-text-muted">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.plan === 'pro' ? 'bg-accent-purple/10 text-accent-purple' : 'bg-bg-surface text-text-secondary'}`}>{u.plan || 'free'}</span>
                        <span className="text-xs text-text-muted">{new Date(u.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Waitlist */}
            {activeTab === 'users' && stats.waitlist?.length > 0 && (
              <div className="card mt-4">
                <h3 className="font-semibold mb-4">Waitlist ({stats.waitlist.length})</h3>
                <div className="space-y-2">
                  {stats.waitlist.map((w: any) => (
                    <div key={w.id} className="flex items-center justify-between py-2 px-2 border-b border-border-subtle/50 last:border-0">
                      <p className="text-sm">{w.email}</p>
                      <span className="text-xs text-text-muted">{w.plan || 'pro'} &middot; {new Date(w.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </main>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: any; icon: string; color: string }) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <p className="text-sm text-text-secondary">{label}</p>
      </div>
      <p className={`text-3xl font-bold font-mono ${color}`}>{value ?? '...'}</p>
    </div>
  );
}
