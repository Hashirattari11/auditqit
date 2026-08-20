'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-dark-300">Loading...</div>
      </main>
    );
  }

  if (!session) return null;

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-dark-600/50 bg-dark-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-blue to-accent-purple rounded-lg flex items-center justify-center text-sm font-bold">
              A
            </div>
            <span className="text-lg font-bold">AuditIQ</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-dark-300 hover:text-white transition-colors">
              New Audit
            </Link>
            <span className="text-sm text-dark-300">{session.user?.name || session.user?.email}</span>
            <button
              onClick={() => {
                import('next-auth/react').then(({ signOut }) => signOut());
              }}
              className="text-sm text-dark-400 hover:text-accent-red transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-dark-300 mb-8">Manage your audits and account</p>

        {/* Upgrade Banner */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-accent-blue/10 to-accent-purple/10 border border-accent-blue/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1">Free Plan</h2>
              <p className="text-dark-300 text-sm">Upgrade to Pro for unlimited audits, PDF reports, and priority queue.</p>
            </div>
            <Link
              href="/pricing"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple text-white text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>

        {/* Usage Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-6 rounded-2xl bg-dark-700/50 border border-dark-600/50">
            <p className="text-sm text-dark-300 mb-1">Audits This Month</p>
            <p className="text-3xl font-bold">0 <span className="text-lg text-dark-400">/ 5</span></p>
          </div>
          <div className="p-6 rounded-2xl bg-dark-700/50 border border-dark-600/50">
            <p className="text-sm text-dark-300 mb-1">Plan</p>
            <p className="text-3xl font-bold capitalize">Free</p>
          </div>
          <div className="p-6 rounded-2xl bg-dark-700/50 border border-dark-600/50">
            <p className="text-sm text-dark-300 mb-1">Total Audits</p>
            <p className="text-3xl font-bold">0</p>
          </div>
        </div>

        {/* Recent Audits */}
        <div className="rounded-2xl bg-dark-700/50 border border-dark-600/50 p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Audits</h2>
          <div className="text-center py-12 text-dark-400">
            <p className="text-lg mb-2">No audits yet</p>
            <p className="text-sm">
              <Link href="/" className="text-accent-blue hover:underline">Run your first audit</Link>{' '}
              to see results here.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
