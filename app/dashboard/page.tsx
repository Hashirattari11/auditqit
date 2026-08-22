'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import WebhookSettings from '@/components/WebhookSettings';

type Tab = 'overview' | 'web' | 'github' | 'monitors' | 'team' | 'api-keys' | 'settings' | 'admin';

const ADMIN_EMAIL = 'hashirattari73@gmail.com';

const navItems: { id: Tab; label: string; icon: string; pro?: boolean; team?: boolean; admin?: boolean }[] = [
  { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'web', label: 'Website Audits', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
  { id: 'github', label: 'GitHub Audits', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  { id: 'monitors', label: 'Monitors', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', pro: true },
  { id: 'team', label: 'Team', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', team: true },
  { id: 'api-keys', label: 'API Keys', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z', pro: true },
  { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  { id: 'admin', label: 'Admin Panel', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', admin: true },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { if (status === 'unauthenticated') router.push('/auth/login'); }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-secondary">Loading dashboard...</span>
        </div>
      </div>
    );
  }
  if (!session) return null;

  const userInitial = (session.user?.name || session.user?.email || 'U')[0].toUpperCase();
  const isAdmin = session.user?.email === ADMIN_EMAIL;
  const visibleNavItems = navItems.filter(item => !item.admin || isAdmin);

  return (
    <div className="min-h-screen flex bg-bg">
      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-bg-surface border-r border-border-subtle flex flex-col transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-border-subtle">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm font-display">A</div>
            <span className="text-lg font-bold font-display">Audit<span className="text-primary">IQ</span></span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                tab === item.id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface border border-transparent'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
              {item.label}
              {!isAdmin && item.pro && <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue font-semibold">PRO</span>}
              {!isAdmin && item.team && <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-accent-purple/10 text-accent-purple font-semibold">TEAM</span>}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-border-subtle">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">{userInitial}</div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{session.user?.name || 'User'}</p>
              <p className="text-xs text-text-muted truncate">{session.user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="btn-ghost flex-1 text-center text-xs py-2">New Audit</Link>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-ghost text-xs py-2 text-accent-red hover:text-accent-red">Logout</button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main Content ─────────────────────────────── */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile Header */}
        <header className="sticky top-0 z-20 h-14 flex items-center justify-between px-4 border-b border-border-subtle bg-bg-surface/80 backdrop-blur-xl lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-bg-surface transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="text-sm font-semibold font-display">Dashboard</span>
          <div className="w-9" />
        </header>

        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          {tab === 'overview' && <OverviewTab user={session.user} isAdmin={isAdmin} />}
          {tab === 'web' && <WebAuditsTab />}
          {tab === 'github' && <GitHubAuditsTab />}
          {tab === 'monitors' && <MonitorsTab />}
          {tab === 'team' && <TeamTab />}
          {tab === 'api-keys' && <ApiKeysTab />}
          {tab === 'settings' && <SettingsTab user={session.user} isAdmin={isAdmin} />}
          {tab === 'admin' && isAdmin && <AdminTab />}
        </div>
      </div>
    </div>
  );
}

/* ── Overview Tab ─────────────────────────────────────── */
function OverviewTab({ user, isAdmin }: { user: { name?: string | null; email?: string | null }; isAdmin?: boolean }) {
  const [audits, setAudits] = useState<any[]>([]);
  const [repoAudits, setRepoAudits] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/audit/recent').then(r => r.ok ? r.json() : { audits: [] }).then(d => setAudits(d.audits || [])).catch(() => {});
    fetch('/api/github-audit/recent').then(r => r.ok ? r.json() : { audits: [] }).then(d => setRepoAudits(d.audits || [])).catch(() => {});
  }, []);

  const totalAudits = audits.length + repoAudits.length;
  const allRecent = [
    ...audits.map(a => ({ ...a, type: 'web' })),
    ...repoAudits.map(a => ({ ...a, type: 'github' })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h1 className="text-2xl font-display font-bold mb-1">Welcome back, {user?.name || user?.email?.split('@')[0] || 'there'}</h1>
        <p className="text-text-secondary">Here&apos;s your audit overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Audits', value: totalAudits.toString(), color: 'text-primary' },
          { label: 'This Month', value: isAdmin ? `${totalAudits} / ∞` : `${totalAudits} / 5`, color: 'text-accent-cyan' },
          { label: 'Recent', value: allRecent.length.toString(), color: 'text-accent-amber' },
        ].map((s) => (
          <div key={s.label} className="card">
            <p className="text-sm text-text-secondary mb-1">{s.label}</p>
            <p className={`text-3xl font-bold font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Plan Banner */}
      <div className={`card bg-gradient-to-r ${isAdmin ? 'from-accent-green/5 to-accent-cyan/5 border-accent-green/20' : 'from-primary/5 to-accent-cyan/5 border-primary/20'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold mb-1">{isAdmin ? 'Admin Plan' : 'Free Plan'}</h3>
            <p className="text-sm text-text-secondary">{isAdmin ? 'Unlimited audits, no rate limits, full platform access.' : '5 web audits and 5 GitHub audits per month. Upgrade for unlimited.'}</p>
          </div>
          {!isAdmin && <Link href="/pricing" className="btn-primary text-sm whitespace-nowrap">View Plans</Link>}
        </div>
      </div>

      {/* Recent Audits */}
      <div className="card">
        <h3 className="font-semibold mb-4">Recent Audits</h3>
        {allRecent.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <p className="text-lg mb-2">No audits yet</p>
            <Link href="/" className="text-primary hover:text-primary/80 text-sm font-medium transition-colors">Run your first audit &rarr;</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {allRecent.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-3 border-b border-border-subtle/50 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{a.url || a.repo_url}</p>
                  <p className="text-xs text-text-muted">{new Date(a.created_at).toLocaleDateString()} &middot; {a.type}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'completed' ? 'bg-accent-green/10 text-accent-green' : a.status === 'failed' ? 'bg-accent-red/10 text-accent-red' : 'bg-accent-amber/10 text-accent-amber'}`}>
                    {a.status}
                  </span>
                  <Link href={a.type === 'github' ? `/github-report/${a.id}` : `/report/${a.id}`} className="text-xs text-primary hover:underline">View &rarr;</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Web Audits Tab ───────────────────────────────────── */
function WebAuditsTab() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit/recent').then(r => r.ok ? r.json() : { audits: [] }).then(d => { setAudits(d.audits || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this audit?')) return;
    await fetch(`/api/audit/${id}/delete`, { method: 'DELETE' });
    setAudits(a => a.filter(x => x.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Website Audits</h1>
          <p className="text-text-secondary text-sm mt-1">All your website audit reports</p>
        </div>
        <Link href="/" className="btn-primary text-sm">New Audit</Link>
      </div>
      <div className="card">
        {loading ? (
          <div className="text-center py-16 text-text-muted">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading audits...</p>
          </div>
        ) : audits.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <div className="text-4xl mb-4">&#127760;</div>
            <p className="text-lg mb-2">No website audits yet</p>
            <p className="text-sm mb-6">Paste any URL to get instant performance, security, and SEO scores.</p>
            <Link href="/" className="btn-primary text-sm inline-block">Run Website Audit</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {audits.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between py-3 px-2 border-b border-border-subtle/50 last:border-0 hover:bg-bg-surface/50 transition-colors rounded-lg">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{a.url}</p>
                  <p className="text-xs text-text-muted">{new Date(a.created_at).toLocaleDateString()} &middot; {a.status}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'completed' ? 'bg-accent-green/10 text-accent-green' : a.status === 'failed' ? 'bg-accent-red/10 text-accent-red' : 'bg-accent-amber/10 text-accent-amber'}`}>
                    {a.status}
                  </span>
                  <Link href={`/report/${a.id}`} className="text-xs text-primary hover:underline whitespace-nowrap">View &rarr;</Link>
                  {a.status === 'completed' && (
                    <Link href={`/api/report/${a.id}/pdf`} className="text-xs text-text-secondary hover:text-primary whitespace-nowrap">PDF</Link>
                  )}
                  <button onClick={() => handleDelete(a.id)} className="text-xs text-accent-red hover:underline whitespace-nowrap">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── GitHub Audits Tab ────────────────────────────────── */
function GitHubAuditsTab() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/github-audit/recent').then(r => r.ok ? r.json() : { audits: [] }).then(d => { setAudits(d.audits || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this audit?')) return;
    await fetch(`/api/github-audit/${id}/delete`, { method: 'DELETE' });
    setAudits(a => a.filter(x => x.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">GitHub Audits</h1>
          <p className="text-text-secondary text-sm mt-1">Code quality and security analysis</p>
        </div>
        <Link href="/" className="btn-primary text-sm">New Audit</Link>
      </div>
      <div className="card">
        {loading ? (
          <div className="text-center py-16 text-text-muted">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading audits...</p>
          </div>
        ) : audits.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <div className="text-4xl mb-4">&#128025;</div>
            <p className="text-lg mb-2">No GitHub audits yet</p>
            <p className="text-sm mb-6">Paste a GitHub repo URL to scan for bugs, security issues, and code quality problems.</p>
            <Link href="/" className="btn-primary text-sm inline-block">Scan Repository</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {audits.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between py-3 px-2 border-b border-border-subtle/50 last:border-0 hover:bg-bg-surface/50 transition-colors rounded-lg">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{a.repo_url}</p>
                  <p className="text-xs text-text-muted">{new Date(a.created_at).toLocaleDateString()} &middot; {a.status}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'completed' ? 'bg-accent-green/10 text-accent-green' : a.status === 'failed' ? 'bg-accent-red/10 text-accent-red' : 'bg-accent-amber/10 text-accent-amber'}`}>
                    {a.status}
                  </span>
                  <Link href={`/github-report/${a.id}`} className="text-xs text-primary hover:underline whitespace-nowrap">View &rarr;</Link>
                  {a.status === 'completed' && (
                    <Link href={`/api/github-report/${a.id}/pdf`} className="text-xs text-text-secondary hover:text-primary whitespace-nowrap">PDF</Link>
                  )}
                  <button onClick={() => handleDelete(a.id)} className="text-xs text-accent-red hover:underline whitespace-nowrap">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Settings Tab ─────────────────────────────────────── */
function SettingsTab({ user, isAdmin }: { user: { name?: string | null; email?: string | null }; isAdmin?: boolean }) {
  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h1 className="text-2xl font-display font-bold">Settings</h1>
        <p className="text-text-secondary text-sm mt-1">Manage your account preferences</p>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">Profile</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Name</label>
            <input type="text" defaultValue={user?.name || ''} className="input" readOnly />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Email</label>
            <input type="email" defaultValue={user?.email || ''} className="input" readOnly />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">Subscription</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary">Current Plan: <span className={`font-medium ${isAdmin ? 'text-accent-green' : 'text-text-primary'}`}>{isAdmin ? 'Admin (Unlimited)' : 'Free'}</span></p>
            <p className="text-xs text-text-muted mt-1">{isAdmin ? 'No limits, full platform access' : '5 web audits and 5 GitHub audits per month'}</p>
          </div>
          {!isAdmin && <Link href="/pricing" className="btn-primary text-sm">Upgrade</Link>}
        </div>
      </div>

      <div className="card">
        <WebhookSettings />
      </div>

      <div className="card border-accent-red/20">
        <h3 className="font-semibold mb-4 text-accent-red">Danger Zone</h3>
        <p className="text-sm text-text-secondary mb-4">Permanently delete your account and all associated data.</p>
        <button className="btn-danger text-sm">Delete Account</button>
      </div>
    </div>
  );
}

/* ── Admin Tab (inline in dashboard) ──────────────────── */
function AdminTab() {
  const [stats, setStats] = useState<any>(null);
  const [tab, setTab] = useState<'overview' | 'waitlist' | 'users'>('overview');

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.ok ? r.json() : null).then(setStats).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-display font-bold mb-1">Admin Panel</h1>
        <p className="text-text-secondary text-sm">Manage users, waitlist, and system health</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-border-subtle pb-2">
        {(['overview', 'waitlist', 'users'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-secondary hover:text-text-primary'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats?.totalUsers ?? '...', color: 'text-primary' },
              { label: 'Total Audits', value: stats?.totalAudits ?? '...', color: 'text-accent-cyan' },
              { label: 'Waitlist Signups', value: stats?.waitlistCount ?? '...', color: 'text-accent-purple' },
              { label: 'Today\'s Audits', value: stats?.todayAudits ?? '...', color: 'text-accent-amber' },
            ].map(s => (
              <div key={s.label} className="card">
                <p className="text-sm text-text-secondary mb-1">{s.label}</p>
                <p className={`text-3xl font-bold font-mono ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-semibold mb-3">System Health</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-accent-green/5 border border-accent-green/20 flex items-center gap-2">
                <span className="text-accent-green text-lg">●</span>
                <span className="text-sm">Supabase Connected</span>
              </div>
              <div className="p-3 rounded-lg bg-accent-green/5 border border-accent-green/20 flex items-center gap-2">
                <span className="text-accent-green text-lg">●</span>
                <span className="text-sm">AI Engine Ready</span>
              </div>
              <div className="p-3 rounded-lg bg-accent-green/5 border border-accent-green/20 flex items-center gap-2">
                <span className="text-accent-green text-lg">●</span>
                <span className="text-sm">Vercel Deployed</span>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-primary/5 to-accent-cyan/5 border-primary/20">
            <p className="text-sm text-text-secondary">
              <span className="text-primary font-semibold">Admin Access:</span> You have unlimited audits, no rate limits, full platform access.
            </p>
          </div>
        </div>
      )}

      {/* Waitlist */}
      {tab === 'waitlist' && (
        <div className="space-y-4">
          <h3 className="font-semibold">Waitlist Signups ({stats?.waitlist?.length || 0})</h3>
          {(!stats?.waitlist || stats.waitlist.length === 0) ? (
            <div className="card text-center py-12 text-text-muted">
              <p className="text-3xl mb-3">📋</p>
              <p>No waitlist signups yet</p>
            </div>
          ) : (
            <div className="card">
              <div className="space-y-2">
                {stats.waitlist.map((w: any) => (
                  <div key={w.id} className="flex items-center justify-between py-3 px-2 border-b border-border-subtle/50 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{w.email}</p>
                      <p className="text-xs text-text-muted">Plan: {w.plan || 'pro'} &middot; Source: {w.source || 'direct'}</p>
                    </div>
                    <p className="text-xs text-text-muted">{new Date(w.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="space-y-4">
          <h3 className="font-semibold">All Users ({stats?.recentUsers?.length || 0})</h3>
          {(!stats?.recentUsers || stats.recentUsers.length === 0) ? (
            <div className="card text-center py-12 text-text-muted">
              <p className="text-3xl mb-3">👥</p>
              <p>No users found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentUsers.map((u: any) => (
                <div key={u.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{u.name || 'Unnamed'}</p>
                        {u.email === ADMIN_EMAIL && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-green/10 text-accent-green font-semibold">ADMIN</span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted">{u.email}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.plan === 'pro' ? 'bg-accent-purple/10 text-accent-purple' : u.plan === 'team' ? 'bg-accent-blue/10 text-accent-blue' : 'bg-bg-surface text-text-secondary'}`}>
                          {u.plan || 'free'}
                        </span>
                        <span className="text-xs text-text-muted">
                          {u.audits_this_month || 0} audits this month
                        </span>
                        <span className="text-xs text-text-muted">
                          Joined {new Date(u.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {u.email !== ADMIN_EMAIL && (
                      <div className="flex items-center gap-2 ml-4">
                        {u.plan !== 'pro' && (
                          <button
                            onClick={async () => {
                              if (!confirm(`Upgrade ${u.email} to Pro?`)) return;
                              await fetch(`/api/admin/users/${u.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ plan: 'pro' }),
                              });
                              // Refresh stats
                              fetch('/api/admin/stats').then(r => r.ok ? r.json() : null).then(setStats);
                            }}
                            className="text-xs px-2.5 py-1 rounded-lg bg-accent-purple/10 text-accent-purple hover:bg-accent-purple/20 font-medium transition-colors"
                          >
                            Upgrade to Pro
                          </button>
                        )}
                        {u.plan === 'pro' && (
                          <button
                            onClick={async () => {
                              if (!confirm(`Downgrade ${u.email} to Free?`)) return;
                              await fetch(`/api/admin/users/${u.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ plan: 'free', audits_this_month: 0 }),
                              });
                              fetch('/api/admin/stats').then(r => r.ok ? r.json() : null).then(setStats);
                            }}
                            className="text-xs px-2.5 py-1 rounded-lg bg-accent-amber/10 text-accent-amber hover:bg-accent-amber/20 font-medium transition-colors"
                          >
                            Downgrade
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (!confirm(`Reset audit count for ${u.email}?`)) return;
                            await fetch(`/api/admin/users/${u.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ audits_this_month: 0 }),
                            });
                            fetch('/api/admin/stats').then(r => r.ok ? r.json() : null).then(setStats);
                          }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-bg-surface text-text-secondary hover:text-text-primary hover:bg-border-subtle font-medium transition-colors"
                        >
                          Reset Usage
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Monitors Tab ─────────────────────────────────────── */
function MonitorsTab() {
  const [monitors, setMonitors] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch('/api/monitors').then(r => r.ok ? r.json() : []).then(setMonitors).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold">Monitors</h2>
          <p className="text-sm text-text-secondary">Track your website scores over time</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm">Add Monitor</button>
      </div>

      {monitors.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">&#x1F4CA;</p>
          <p className="text-text-secondary mb-4">No monitors yet</p>
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm">Create Your First Monitor</button>
        </div>
      ) : (
        <div className="space-y-3">
          {monitors.map((m: any) => (
            <div key={m.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-sm text-text-secondary">{m.url}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-accent-green">{m.last_score || '—'}/100</p>
                <p className="text-xs text-text-muted">{m.frequency}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="card w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Add Monitor</h3>
            <form onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              await fetch('/api/monitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: fd.get('url'), name: fd.get('name'), frequency: fd.get('frequency') }) });
              setShowModal(false);
              fetch('/api/monitors').then(r => r.ok ? r.json() : []).then(setMonitors);
            }}>
              <input name="name" placeholder="Monitor name" className="input mb-3 w-full" required />
              <input name="url" placeholder="https://example.com" className="input mb-3 w-full" required />
              <select name="frequency" className="input mb-4 w-full">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Start Monitoring</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Team Tab ─────────────────────────────────────── */
function TeamTab() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.email === ADMIN_EMAIL;
  const [team, setTeam] = useState<any>(null);

  useEffect(() => {
    fetch('/api/team').then(r => r.ok ? r.json() : null).then(setTeam).catch(() => {});
  }, []);

  if (!team) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div>
          <h2 className="text-xl font-display font-bold">Team</h2>
          <p className="text-sm text-text-secondary">Collaborate with your team</p>
        </div>
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">&#x1F465;</p>
          {isAdmin ? (
            <>
              <p className="text-text-secondary mb-2">Admin access — create a team to start collaborating</p>
              <p className="text-sm text-text-muted mb-4">Full team features available with your admin account.</p>
            </>
          ) : (
            <>
              <p className="text-text-secondary mb-2">Team features require the Team plan</p>
              <p className="text-sm text-text-muted mb-4">Get 5 team members, shared audits, bulk scanning, and white-label reports.</p>
              <a href="/pricing" className="btn-primary text-sm">Upgrade to Team</a>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h2 className="text-xl font-display font-bold">{team.name}</h2>
        <p className="text-sm text-text-secondary">Team plan &middot; {team.members?.length || 0} members</p>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-3">Members</h3>
        <div className="space-y-2">
          {team.members?.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
              <span className="text-sm">{m.user?.email || m.user_id}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue">{m.role}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-3">Invite Member</h3>
        <div className="flex gap-3">
          <input placeholder="email@company.com" className="input flex-1" />
          <button className="btn-primary text-sm">Send Invite</button>
        </div>
      </div>
      <a href="/dashboard/team/bulk" className="card block hover:border-accent-purple/30 transition-colors">
        <h3 className="font-semibold mb-1">Bulk URL Scanning</h3>
        <p className="text-sm text-text-secondary">Upload a CSV of URLs and scan them all at once.</p>
      </a>
    </div>
  );
}

/* ── API Keys Tab ─────────────────────────────────────── */
function ApiKeysTab() {
  const [keys, setKeys] = useState<any[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyName, setKeyName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetch('/api/api-keys').then(r => r.ok ? r.json() : []).then(setKeys).catch(() => {});
  }, []);

  const handleCreate = async () => {
    const res = await fetch('/api/api-keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: keyName }) });
    if (res.ok) {
      const data = await res.json();
      setNewKey(data.key);
      setShowCreate(false);
      fetch('/api/api-keys').then(r => r.ok ? r.json() : []).then(setKeys);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold">API Keys</h2>
          <p className="text-sm text-text-secondary">Use AuditIQ programmatically via the API</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">Generate New Key</button>
      </div>

      {newKey && (
        <div className="card border-accent-green/30 bg-accent-green/5">
          <p className="text-sm text-accent-green font-semibold mb-2">API Key Created (copy it now, it won&apos;t be shown again)</p>
          <div className="flex items-center gap-2">
            <code className="text-sm bg-bg-surface px-3 py-2 rounded-lg flex-1 overflow-x-auto">{newKey}</code>
            <button onClick={() => { navigator.clipboard.writeText(newKey); }} className="btn-secondary text-sm">Copy</button>
          </div>
          <button onClick={() => setNewKey(null)} className="text-sm text-text-muted mt-2 hover:text-text-primary">Dismiss</button>
        </div>
      )}

      {keys.length === 0 && !newKey ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">&#x1F511;</p>
          <p className="text-text-secondary mb-4">No API keys yet</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">Create Your First Key</button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((k: any) => (
            <div key={k.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium">{k.name}</p>
                <p className="text-xs text-text-muted">{k.key?.substring(0, 12)}... &middot; Used {k.usage_count || 0} times</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${k.is_active ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
                  {k.is_active ? 'Active' : 'Revoked'}
                </span>
                {k.is_active && (
                  <button onClick={async () => { await fetch(`/api/api-keys/${k.id}`, { method: 'DELETE' }); fetch('/api/api-keys').then(r => r.ok ? r.json() : []).then(setKeys); }} className="text-xs text-accent-red hover:underline">Revoke</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
          <div className="card w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Generate API Key</h3>
            <input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Key name (e.g., CI Pipeline)" className="input w-full mb-4" autoFocus />
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleCreate} disabled={!keyName} className="btn-primary flex-1">Generate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
