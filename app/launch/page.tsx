'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LaunchPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('submitting');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
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
      <header className="border-b border-dark-600/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-blue to-accent-purple rounded-lg flex items-center justify-center text-sm font-bold">A</div>
            <span className="text-lg font-bold">AuditIQ</span>
          </Link>
          <Link href="/" className="text-sm text-dark-300 hover:text-white">← Back to App</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-accent-purple text-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-accent-purple animate-pulse" />
          Launching on ProductHunt
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Audit Any Website
          <br />
          <span className="bg-gradient-to-r from-accent-blue via-accent-purple to-accent-blue bg-clip-text text-transparent">
            with AI-Powered Insights
          </span>
        </h1>

        <p className="text-dark-300 text-lg mb-10 max-w-2xl mx-auto">
          AuditIQ analyzes performance, SEO, security, and code quality — then uses AI to suggest exact fixes. Get your first audit free.
        </p>

        {/* Waitlist Form */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
              placeholder="Enter your email"
              className="flex-1 px-5 py-3.5 rounded-xl bg-dark-700 border border-dark-500 text-white placeholder-dark-400 focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-colors"
              required
            />
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
            >
              {status === 'submitting' ? 'Joining...' : 'Get Notified'}
            </button>
          </div>
          {message && (
            <p className={`mt-3 text-sm ${status === 'error' ? 'text-accent-red' : 'text-accent-green'}`}>
              {message}
            </p>
          )}
        </form>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-center text-dark-300 text-sm uppercase tracking-widest mb-8">What AuditIQ Does</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="p-5 rounded-xl bg-dark-700/50 border border-dark-600/50 hover:border-dark-500 transition-colors">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-dark-300 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
