'use client';

import { useState } from 'react';

export default function WaitlistForm({ plan }: { plan: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'already'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan, source: 'pricing' }),
      });
      const data = await res.json();
      if (data.alreadySignedUp) setStatus('already');
      else setStatus('success');
    } catch {
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-3">
        <p className="text-accent-green text-sm font-medium">You&apos;re on the waitlist!</p>
        <p className="text-text-muted text-xs mt-1">We&apos;ll notify you when {plan} plan launches.</p>
      </div>
    );
  }

  if (status === 'already') {
    return (
      <div className="text-center py-3">
        <p className="text-primary text-sm font-medium">You&apos;re already on the list!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input w-full text-sm"
        required
      />
      <button type="submit" disabled={status === 'loading'}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-opacity ${plan === 'team' ? 'bg-accent-purple text-white hover:opacity-90' : 'bg-primary text-white hover:opacity-90'} ${status === 'loading' ? 'opacity-50' : ''}`}>
        {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
      </button>
      <p className="text-xs text-text-muted text-center">Launching soon &middot; No credit card needed</p>
    </form>
  );
}
