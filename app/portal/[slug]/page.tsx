'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function PortalLoginPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    // Client auth — simple email check for now
    const res = await fetch('/api/portal/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agencyId: slug, email, password }) });
    const data = await res.json();
    if (data.error) { setError(data.error); return; }
    sessionStorage.setItem('portal_client', JSON.stringify(data.client));
    router.push(`/portal/${slug}/dashboard`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <h1 className="text-2xl font-bold mb-2">Client Portal</h1>
        <p className="text-text-muted text-sm mb-8">Login to view your website reports</p>

        <div className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-bg border border-border-subtle text-text-primary" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-bg border border-border-subtle text-text-primary" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={handleLogin} className="w-full py-3 rounded-xl bg-accent-blue text-white font-semibold hover:opacity-90">Login</button>
        </div>

        <p className="text-text-muted text-xs mt-12">Powered by AuditIQ</p>
      </div>
    </main>
  );
}
