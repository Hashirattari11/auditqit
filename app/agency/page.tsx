'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Agency { id: string; name: string; logo: string | null; primary_color: string; custom_domain: string | null; }
interface Client { id: string; name: string; email: string; website_url: string; notes: string | null; created_at: string; }

export default function AgencyPage() {
  const { data: session } = useSession();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [tab, setTab] = useState<'clients' | 'branding' | 'settings'>('clients');
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', website_url: '', notes: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    fetch('/api/agency').then(r => r.json()).then(d => {
      setAgency(d);
      if (d?.id) fetch('/api/agency/clients').then(r => r.json()).then(setClients);
      setLoading(false);
    });
  }, [session]);

  const addClient = async () => {
    const res = await fetch('/api/agency/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newClient) });
    if (res.ok) {
      const client = await res.json();
      setClients(prev => [client, ...prev]);
      setNewClient({ name: '', email: '', website_url: '', notes: '' });
      setShowAddClient(false);
    }
  };

  const runAudit = async (clientId: string) => {
    await fetch(`/api/agency/clients/${clientId}/audit`, { method: 'POST' });
    alert('Audit complete!');
  };

  const sendReport = async (clientId: string) => {
    await fetch(`/api/agency/clients/${clientId}/report`, { method: 'POST' });
    alert('Report sent!');
  };

  const updateBranding = async (updates: Partial<Agency>) => {
    await fetch('/api/agency', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    setAgency(prev => prev ? { ...prev, ...updates } : prev);
  };

  if (loading) return <main className="min-h-screen flex items-center justify-center"><p className="text-text-muted">Loading...</p></main>;
  if (!agency) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Start Your Agency</h1>
        <p className="text-text-secondary mb-6">Set up your white-label agency portal</p>
        <Link href="/agency/setup" className="px-6 py-3 rounded-xl bg-accent-purple text-white font-semibold hover:opacity-90">Setup Agency →</Link>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen pb-20">
      <div className="max-w-6xl mx-auto px-4 pt-24">
        <div className="flex items-center gap-3 mb-8">
          {agency.logo && <img src={agency.logo} alt={agency.name} className="h-8" />}
          <h1 className="text-2xl font-bold">{agency.name}</h1>
          <span className="px-2 py-1 rounded-full bg-accent-purple/10 text-accent-purple text-xs font-medium">Agency</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border-subtle pb-2">
          {(['clients', 'branding', 'settings'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-bg-surface text-text-primary' : 'text-text-muted hover:text-text-primary'}`}>
              {t === 'clients' ? `Clients (${clients.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Clients Tab */}
        {tab === 'clients' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Your Clients</h2>
              <button onClick={() => setShowAddClient(true)} className="px-4 py-2 rounded-lg bg-accent-purple text-white text-sm font-medium hover:opacity-90">+ Add Client</button>
            </div>

            {showAddClient && (
              <div className="card p-6 mb-6 border-accent-purple/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <input placeholder="Company name" value={newClient.name} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))} className="px-3 py-2 rounded-lg bg-bg border border-border-subtle text-sm" />
                  <input placeholder="Email" value={newClient.email} onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))} className="px-3 py-2 rounded-lg bg-bg border border-border-subtle text-sm" />
                  <input placeholder="Website URL" value={newClient.website_url} onChange={e => setNewClient(p => ({ ...p, website_url: e.target.value }))} className="px-3 py-2 rounded-lg bg-bg border border-border-subtle text-sm" />
                  <input placeholder="Notes (optional)" value={newClient.notes} onChange={e => setNewClient(p => ({ ...p, notes: e.target.value }))} className="px-3 py-2 rounded-lg bg-bg border border-border-subtle text-sm" />
                </div>
                <div className="flex gap-3">
                  <button onClick={addClient} className="px-4 py-2 rounded-lg bg-accent-purple text-white text-sm">Save</button>
                  <button onClick={() => setShowAddClient(false)} className="px-4 py-2 rounded-lg bg-bg-surface border border-border-subtle text-sm">Cancel</button>
                </div>
              </div>
            )}

            {clients.length === 0 ? (
              <p className="text-text-muted text-center py-12">No clients yet. Add your first client to get started.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.map(c => (
                  <div key={c.id} className="card p-5">
                    <h3 className="font-bold text-lg mb-1">{c.name}</h3>
                    <p className="text-text-muted text-sm truncate mb-1">{c.website_url}</p>
                    <p className="text-text-muted text-xs mb-4">{c.email}</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => runAudit(c.id)} className="px-3 py-1.5 rounded-lg bg-accent-blue/10 text-accent-blue text-xs hover:bg-accent-blue/20">Run Audit</button>
                      <button onClick={() => sendReport(c.id)} className="px-3 py-1.5 rounded-lg bg-accent-green/10 text-accent-green text-xs hover:bg-accent-green/20">Send Report</button>
                      <Link href={`/portal/${agency.id}`} className="px-3 py-1.5 rounded-lg bg-bg-surface border border-border-subtle text-xs text-text-secondary hover:text-text-primary">Portal</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Branding Tab */}
        {tab === 'branding' && (
          <div className="max-w-xl space-y-6">
            <div>
              <label className="text-sm font-medium text-text-secondary block mb-2">Agency Name</label>
              <input value={agency.name} onChange={e => updateBranding({ name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-bg border border-border-subtle text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary block mb-2">Primary Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={agency.primary_color} onChange={e => updateBranding({ primary_color: e.target.value })} className="w-12 h-10 rounded cursor-pointer" />
                <span className="text-sm text-text-muted">{agency.primary_color}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary block mb-2">Portal URL</label>
              <p className="px-3 py-2 rounded-lg bg-bg border border-border-subtle text-sm text-text-muted font-mono">auditiq.com/portal/{agency.id}</p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <div className="max-w-xl space-y-4">
            <div className="card p-6">
              <h3 className="font-bold mb-2">Agency Plan</h3>
              <p className="text-text-secondary text-sm">You&apos;re on the Agency plan ($99/month)</p>
              <p className="text-text-muted text-xs mt-2">Unlimited clients, branded portal, weekly auto-reports</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
