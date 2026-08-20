'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const passwordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = passwordStrength(password);
  const strengthColors = ['bg-accent-red', 'bg-orange-500', 'bg-accent-amber', 'bg-primary', 'bg-accent-green'];
  const strengthLabels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) { router.push('/auth/login'); } else { router.push('/dashboard'); router.refresh(); }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setLoading(false); }
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
            Start auditing<br />in 30 seconds
          </h2>
          <p className="text-text-secondary text-lg mb-10 max-w-md animate-fade-up animate-delay-100" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            No credit card required. Get 10 free audits every month.
          </p>

          <div className="space-y-4 animate-fade-up animate-delay-200" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            {[
              { icon: '⚡', text: 'Performance, SEO, Security — all checked' },
              { icon: '🤖', text: 'AI-powered code fix suggestions' },
              { icon: '📊', text: 'Beautiful reports with shareable links' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-text-secondary">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">{item.text}</span>
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

          <h1 className="text-2xl font-display font-bold mb-2">Create your account</h1>
          <p className="text-text-secondary text-sm mb-8">Start auditing with 10 free scans per month</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input" required />
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength ? strengthColors[strength - 1] : 'bg-border-subtle'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-text-muted mt-1">{strengthLabels[strength - 1] || 'Very weak'}</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="input" required />
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
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
