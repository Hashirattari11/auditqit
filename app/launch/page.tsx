'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function LaunchPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      setStatus('success');
      setMessage(data.alreadySignedUp ? "You're already on the list!" : "You're on the list! We'll notify you.");
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  const features = [
    { icon: '⚡', title: 'Performance Audits', desc: 'Lighthouse, Core Web Vitals, load times' },
    { icon: '🛡️', title: 'Security Analysis', desc: 'Headers, vulnerabilities, best practices' },
    { icon: '🤖', title: 'AI-Powered Fixes', desc: 'Get corrected code for every issue found' },
    { icon: '🐙', title: 'GitHub Code Review', desc: 'Scan repos for bugs, security, quality' },
    { icon: '📊', title: 'PDF Reports', desc: 'Professional audit reports for clients' },
    { icon: '🔄', title: 'Continuous Monitoring', desc: 'Track improvements over time' },
  ];

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="absolute inset-0 grid-pattern pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Launching on ProductHunt
          </div>

          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 leading-tight animate-fade-up animate-delay-100" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            Audit Any Website<br />
            <span className="bg-gradient-to-r from-primary via-accent-cyan to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">with AI-Powered Insights</span>
          </h1>

          <p className="text-text-secondary text-lg mb-10 max-w-2xl mx-auto animate-fade-up animate-delay-200" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            AuditIQ analyzes performance, SEO, security, and code quality — then uses AI to suggest exact fixes. Get your first audit free.
          </p>

          {/* Waitlist Form */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto animate-fade-up animate-delay-300" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <div className="flex gap-3">
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }} placeholder="Enter your email" className="input flex-1" required />
              <button type="submit" disabled={status === 'submitting'} className="btn-primary whitespace-nowrap disabled:opacity-50">
                {status === 'submitting' ? 'Joining...' : 'Get Notified'}
              </button>
            </div>
            {message && (
              <p className={`mt-3 text-sm ${status === 'error' ? 'text-accent-red' : 'text-accent-green'}`}>{message}</p>
            )}
          </form>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-bg-surface/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-center text-text-secondary text-sm uppercase tracking-widest mb-8">What AuditIQ Does</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={f.title} className="card-hover reveal" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-text-secondary text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
