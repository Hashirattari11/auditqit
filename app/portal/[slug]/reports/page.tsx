'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function PortalReports() {
  const params = useParams();
  const slug = params.slug as string;
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const client = JSON.parse(sessionStorage.getItem('portal_client') || '{}');
    if (!client.id) { window.location.href = `/portal/${slug}`; return; }
    // Reports would be fetched from API
  }, [slug]);

  return (
    <main className="min-h-screen pb-20">
      <header className="border-b border-border-subtle px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href={`/portal/${slug}/dashboard`} className="font-bold">← Back</Link>
          <h1 className="font-bold">Reports</h1>
          <div />
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 pt-8">
        {reports.length === 0 ? (
          <p className="text-text-muted text-center py-12">No reports yet. Your agency will send reports after running audits.</p>
        ) : (
          reports.map((r: any) => (
            <div key={r.id} className="card p-4 mb-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{new Date(r.created_at).toLocaleDateString()}</p>
                <p className="text-text-muted text-xs">Score: {r.score}/100</p>
              </div>
            </div>
          ))
        )}
      </div>
      <footer className="text-center py-6 text-text-muted text-xs">Powered by AuditIQ</footer>
    </main>
  );
}
