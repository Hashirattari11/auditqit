'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Tab = 'overview' | 'web' | 'github' | 'settings';

const navItems: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'web', label: 'Website Audits', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
  { id: 'github', label: 'GitHub Audits', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
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
          {navItems.map((item) => (
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
          {tab === 'overview' && <OverviewTab user={session.user} />}
          {tab === 'web' && <WebAuditsTab />}
          {tab === 'github' && <GitHubAuditsTab />}
          {tab === 'settings' && <SettingsTab user={session.user} />}
        </div>
      </div>
    </div>
  );
}

/* ── Overview Tab ─────────────────────────────────────── */
function OverviewTab({ user }: { user: { name?: string | null; email?: string | null } }) {
  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h1 className="text-2xl font-display font-bold mb-1">Welcome back, {user?.name || user?.email?.split('@')[0] || 'there'}</h1>
        <p className="text-text-secondary">Here&apos;s your audit overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Audits', value: '0', color: 'text-primary' },
          { label: 'This Month', value: '0 / 5', color: 'text-accent-cyan' },
          { label: 'Issues Found', value: '0', color: 'text-accent-amber' },
        ].map((s) => (
          <div key={s.label} className="card">
            <p className="text-sm text-text-secondary mb-1">{s.label}</p>
            <p className={`text-3xl font-bold font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Plan Banner */}
      <div className="card bg-gradient-to-r from-primary/5 to-accent-cyan/5 border-primary/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold mb-1">Free Plan</h3>
            <p className="text-sm text-text-secondary">Upgrade to Pro for unlimited audits, PDF reports, and priority queue.</p>
          </div>
          <Link href="/pricing" className="btn-primary text-sm whitespace-nowrap">Upgrade to Pro</Link>
        </div>
      </div>

      {/* Recent Audits */}
      <div className="card">
        <h3 className="font-semibold mb-4">Recent Audits</h3>
        <div className="text-center py-12 text-text-muted">
          <p className="text-lg mb-2">No audits yet</p>
          <Link href="/" className="text-primary hover:text-primary/80 text-sm font-medium transition-colors">Run your first audit →</Link>
        </div>
      </div>
    </div>
  );
}

/* ── Web Audits Tab ───────────────────────────────────── */
function WebAuditsTab() {
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
        <div className="text-center py-16 text-text-muted">
          <div className="text-4xl mb-4">🌐</div>
          <p className="text-lg mb-2">No website audits yet</p>
          <p className="text-sm mb-6">Paste any URL to get instant performance, security, and SEO scores.</p>
          <Link href="/" className="btn-primary text-sm inline-block">Run Website Audit</Link>
        </div>
      </div>
    </div>
  );
}

/* ── GitHub Audits Tab ────────────────────────────────── */
function GitHubAuditsTab() {
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
        <div className="text-center py-16 text-text-muted">
          <div className="text-4xl mb-4">🐙</div>
          <p className="text-lg mb-2">No GitHub audits yet</p>
          <p className="text-sm mb-6">Paste a GitHub repo URL to scan for bugs, security issues, and code quality problems.</p>
          <Link href="/" className="btn-primary text-sm inline-block">Scan Repository</Link>
        </div>
      </div>
    </div>
  );
}

/* ── Settings Tab ─────────────────────────────────────── */
function SettingsTab({ user }: { user: { name?: string | null; email?: string | null } }) {
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
            <p className="text-sm text-text-secondary">Current Plan: <span className="text-text-primary font-medium">Free</span></p>
            <p className="text-xs text-text-muted mt-1">5 web audits and 5 GitHub audits per month</p>
          </div>
          <Link href="/pricing" className="btn-primary text-sm">Upgrade</Link>
        </div>
      </div>

      <div className="card border-accent-red/20">
        <h3 className="font-semibold mb-4 text-accent-red">Danger Zone</h3>
        <p className="text-sm text-text-secondary mb-4">Permanently delete your account and all associated data.</p>
        <button className="btn-danger text-sm">Delete Account</button>
      </div>
    </div>
  );
}
