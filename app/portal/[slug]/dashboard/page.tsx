'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function PortalDashboard() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = JSON.parse(sessionStorage.getItem('portal_client') || '{}');
    if (!client.id) { window.location.href = `/portal/${slug}`; return; }
    setData(client);
    setLoading(false);
  }, [slug]);

  if (loading || !data) return <main className="min-h-screen flex items-center justify-center"><p className="text-text-muted">Loading...</p></main>;

  return (
    <main className="min-h-screen pb-20">
      <header className="border-b border-border-subtle px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold">{data.name || 'Client Portal'}</h1>
            <p className="text-text-muted text-xs">{data.website_url}</p>
          </div>
          <Link href={`/portal/${slug}`} className="text-text-muted text-xs hover:text-text-primary">Logout</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-8">
        <h2 className="text-lg font-bold mb-6">Your Website Overview</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 text-center"><div className="text-2xl font-bold text-accent-blue">—</div><div className="text-xs text-text-muted mt-1">Performance</div></div>
          <div className="card p-4 text-center"><div className="text-2xl font-bold text-accent-green">—</div><div className="text-xs text-text-muted mt-1">SEO</div></div>
          <div className="card p-4 text-center"><div className="text-2xl font-bold text-accent-purple">—</div><div className="text-xs text-text-muted mt-1">Security</div></div>
          <div className="card p-4 text-center"><div className="text-2xl font-bold text-text-primary">—</div><div className="text-xs text-text-muted mt-1">Overall</div></div>
        </div>

        <p className="text-text-muted text-sm text-center py-12">Reports will appear here after your agency runs an audit.</p>
      </div>

      <footer className="text-center py-6 text-text-muted text-xs">Powered by AuditIQ</footer>
    </main>
  );
}
