'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex">
      {/* Left — Animated Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-bg-surface">
        <div className="hero-blob hero-blob-1" style={{ width: 400, height: 400, top: -100, left: -100 }} />
        <div className="hero-blob hero-blob-2" style={{ width: 350, height: 350, bottom: -80, right: -50 }} />
        <div className="absolute inset-0 grid-pattern pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <Link href="/" className="flex items-center gap-2.5 mb-12">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold font-display">A</div>
            <span className="text-2xl font-bold font-display">Audit<span className="text-primary">IQ</span></span>
          </Link>

          <h2 className="text-3xl xl:text-4xl font-display font-bold leading-tight mb-6 animate-fade-up" style={{ animationFillMode: 'forwards' }}>
            Welcome back to<br />your audit dashboard
          </h2>
          <p className="text-text-secondary text-lg mb-10 max-w-md animate-fade-up animate-delay-100" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            Track performance, security, and code quality across all your projects.
          </p>

          <div className="space-y-4 animate-fade-up animate-delay-200" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            {[
              { label: 'Websites Audited', value: '12,847+' },
              { label: 'Bugs Found & Fixed', value: '98,234+' },
              { label: 'Avg Improvement', value: '42%' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-4 p-4 rounded-xl bg-bg/50 border border-border-subtle/50">
                <span className="text-2xl font-bold font-mono text-primary">{stat.value}</span>
                <span className="text-sm text-text-secondary">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 bg-bg">
        <div className="w-full max-w-md animate-fade-up">
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold font-display">A</div>
              <span className="text-2xl font-bold font-display">Audit<span className="text-primary">IQ</span></span>
            </Link>
          </div>

          <h1 className="text-2xl font-display font-bold mb-2">Sign in</h1>
          <p className="text-text-secondary text-sm mb-8">Enter your credentials to access your account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input" required />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-accent-red/10 border border-accent-red/20">
                <span className="text-accent-red text-sm">{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">Sign up free</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
