'use client';

import { useState, useEffect } from 'react';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
}

export default function WebhookSettings() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['audit.completed']);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState('');

  const availableEvents = [
    { id: 'audit.completed', label: 'Audit Completed' },
    { id: 'monitor.alert', label: 'Monitor Alert' },
    { id: 'score.dropped', label: 'Score Dropped' },
  ];

  useEffect(() => {
    fetch('/api/webhooks').then(r => r.ok ? r.json() : []).then(d => setWebhooks(d.webhooks || [])).catch(() => {});
  }, []);

  const addWebhook = async () => {
    if (!url) return;
    const res = await fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, events }),
    });
    if (res.ok) {
      const data = await res.json();
      setWebhooks(prev => [...prev, data.webhook]);
      setShowAdd(false);
      setUrl('');
      setMessage('Webhook added!');
    }
  };

  const deleteWebhook = async (id: string) => {
    await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
    setWebhooks(prev => prev.filter(w => w.id !== id));
  };

  const testWebhook = async (id: string) => {
    setTesting(true);
    await fetch(`/api/webhooks/${id}/test`, { method: 'POST' });
    setMessage('Test webhook sent!');
    setTesting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Webhooks</h3>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">Add Webhook</button>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-accent-green/10 border border-accent-green/20 text-accent-green text-sm">
          {message}
          <button onClick={() => setMessage('')} className="ml-2 text-text-muted hover:text-text-primary">&times;</button>
        </div>
      )}

      {webhooks.length === 0 && !showAdd ? (
        <div className="card text-center py-12">
          <p className="text-3xl mb-3">🔗</p>
          <p className="text-text-secondary mb-2">No webhooks configured</p>
          <p className="text-xs text-text-muted">Get notified when audits complete or scores change</p>
        </div>
      ) : (
        webhooks.map(w => (
          <div key={w.id} className="card flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{w.url}</p>
              <p className="text-xs text-text-muted">{w.events.join(', ')}</p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className={`text-xs px-2 py-0.5 rounded-full ${w.is_active ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
                {w.is_active ? 'Active' : 'Disabled'}
              </span>
              <button onClick={() => testWebhook(w.id)} disabled={testing} className="text-xs text-text-secondary hover:text-primary">Test</button>
              <button onClick={() => deleteWebhook(w.id)} className="text-xs text-accent-red hover:underline">Delete</button>
            </div>
          </div>
        ))
      )}

      {showAdd && (
        <div className="card space-y-4">
          <h4 className="font-medium">Add Webhook</h4>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://your-server.com/webhook" className="input w-full" />
          <div>
            <p className="text-sm text-text-secondary mb-2">Events:</p>
            <div className="flex flex-wrap gap-2">
              {availableEvents.map(e => (
                <button key={e.id} onClick={() => {
                  setEvents(prev => prev.includes(e.id) ? prev.filter(x => x !== e.id) : [...prev, e.id]);
                }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${events.includes(e.id) ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-bg border border-border-subtle text-text-secondary'}`}>
                  {e.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={addWebhook} disabled={!url} className="btn-primary flex-1">Add Webhook</button>
          </div>
        </div>
      )}
    </div>
  );
}
