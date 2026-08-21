'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function PortalIssues() {
  const params = useParams();
  const slug = params.slug as string;
  const [issues, setIssues] = useState<any[]>([]);

  useEffect(() => {
    const client = JSON.parse(sessionStorage.getItem('portal_client') || '{}');
    if (!client.id) { window.location.href = `/portal/${slug}`; return; }
  }, [slug]);

  return (
    <main className="min-h-screen pb-20">
      <header className="border-b border-border-subtle px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href={`/portal/${slug}/dashboard`} className="font-bold">← Back</Link>
          <h1 className="font-bold">Issues</h1>
          <div />
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 pt-8">
        {issues.length === 0 ? (
          <p className="text-text-muted text-center py-12">No issues detected yet. Audits will show issues here.</p>
        ) : (
          issues.map((issue: any, i: number) => (
            <div key={i} className="card p-4 mb-3">
              <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400">{issue.severity}</span>
              <p className="font-medium text-sm mt-2">{issue.type || issue.issue}</p>
              {issue.fix && <p className="text-text-muted text-xs mt-1">{issue.fix}</p>}
            </div>
          ))
        )}
      </div>
      <footer className="text-center py-6 text-text-muted text-xs">Powered by AuditIQ</footer>
    </main>
  );
}
