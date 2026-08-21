'use client';

import { useState } from 'react';
import Link from 'next/link';

const sections = [
  { id: 'getting-started', title: 'Getting Started' },
  { id: 'authentication', title: 'Authentication' },
  { id: 'website-audit', title: 'Website Audit' },
  { id: 'github-audit', title: 'GitHub Audit' },
  { id: 'retrieve-results', title: 'Retrieve Results' },
  { id: 'rate-limits', title: 'Rate Limits' },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [codeTab, setCodeTab] = useState<'curl' | 'node' | 'python'>('curl');

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-lg font-bold font-display">Audit<span className="text-primary">IQ</span></Link>
          <Link href="/dashboard" className="text-sm text-text-secondary hover:text-text-primary">Dashboard</Link>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <nav className="w-56 flex-shrink-0 hidden md:block">
            <div className="sticky top-8 space-y-1">
              {sections.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeSection === s.id ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface'}`}>
                  {s.title}
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {activeSection === 'getting-started' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-display font-bold">Getting Started</h1>
                <p className="text-text-secondary">AuditIQ provides a REST API to run website and code audits programmatically.</p>

                <div className="card">
                  <h3 className="font-semibold mb-3">Quick Start</h3>
                  <p className="text-sm text-text-secondary mb-4">1. Get your API key from the <Link href="/dashboard" className="text-primary">dashboard</Link></p>
                  <p className="text-sm text-text-secondary mb-4">2. Make your first API call:</p>

                  <div className="flex gap-1 mb-3">
                    {(['curl', 'node', 'python'] as const).map(t => (
                      <button key={t} onClick={() => setCodeTab(t)}
                        className={`px-3 py-1 rounded text-xs font-medium ${codeTab === t ? 'bg-primary text-white' : 'bg-bg-surface text-text-secondary'}`}>
                        {t === 'node' ? 'Node.js' : t === 'curl' ? 'curl' : 'Python'}
                      </button>
                    ))}
                  </div>

                  {codeTab === 'curl' && (
                    <pre className="bg-bg-surface rounded-lg p-4 text-sm overflow-x-auto text-text-secondary"><code>{`curl -X POST https://auditqit-0-eight.vercel.app/api/v1/audit/website \\
  -H "x-api-key: aiq_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://yoursite.com"}'`}</code></pre>
                  )}
                  {codeTab === 'node' && (
                    <pre className="bg-bg-surface rounded-lg p-4 text-sm overflow-x-auto text-text-secondary"><code>{`const response = await fetch('https://auditqit-0-eight.vercel.app/api/v1/audit/website', {
  method: 'POST',
  headers: {
    'x-api-key': 'aiq_live_your_key_here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ url: 'https://yoursite.com' })
});
const { auditId } = await response.json();
console.log('Audit started:', auditId);`}</code></pre>
                  )}
                  {codeTab === 'python' && (
                    <pre className="bg-bg-surface rounded-lg p-4 text-sm overflow-x-auto text-text-secondary"><code>{`import requests

response = requests.post(
    'https://auditqit-0-eight.vercel.app/api/v1/audit/website',
    headers={'x-api-key': 'aiq_live_your_key_here'},
    json={'url': 'https://yoursite.com'}
)
audit_id = response.json()['auditId']
print(f'Audit started: {audit_id}')`}</code></pre>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'authentication' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-display font-bold">Authentication</h1>
                <p className="text-text-secondary">All API requests require an API key passed via the <code className="bg-bg-surface px-1.5 py-0.5 rounded text-sm">x-api-key</code> header.</p>
                <div className="card">
                  <h3 className="font-semibold mb-2">Header Format</h3>
                  <pre className="bg-bg-surface rounded-lg p-4 text-sm text-text-secondary"><code>x-api-key: aiq_live_xxxxxxxxxxxxxxxxxxxxxxxx</code></pre>
                </div>
                <div className="card">
                  <h3 className="font-semibold mb-2">Key Formats</h3>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    <li><code className="bg-bg-surface px-1.5 py-0.5 rounded">aiq_live_</code> - Free plan (10 req/hour, 50/day)</li>
                    <li><code className="bg-bg-surface px-1.5 py-0.5 rounded">aiq_pro_</code> - Pro plan (100 req/hour, 1000/day)</li>
                  </ul>
                </div>
              </div>
            )}

            {activeSection === 'website-audit' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-display font-bold">Website Audit</h1>
                <div className="card">
                  <h3 className="font-semibold mb-2">POST /api/v1/audit/website</h3>
                  <p className="text-sm text-text-secondary mb-3">Start a new website audit.</p>
                  <h4 className="text-sm font-medium mb-1">Request Body</h4>
                  <pre className="bg-bg-surface rounded-lg p-4 text-sm text-text-secondary mb-4"><code>{'{\n  "url": "https://example.com"\n}'}</code></pre>
                  <h4 className="text-sm font-medium mb-1">Response</h4>
                  <pre className="bg-bg-surface rounded-lg p-4 text-sm text-text-secondary"><code>{'{\n  "auditId": "abc-123",\n  "status": "queued",\n  "estimatedTime": 60\n}'}</code></pre>
                </div>
              </div>
            )}

            {activeSection === 'github-audit' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-display font-bold">GitHub Audit</h1>
                <div className="card">
                  <h3 className="font-semibold mb-2">POST /api/v1/audit/github</h3>
                  <p className="text-sm text-text-secondary mb-3">Start a new GitHub repository audit.</p>
                  <h4 className="text-sm font-medium mb-1">Request Body</h4>
                  <pre className="bg-bg-surface rounded-lg p-4 text-sm text-text-secondary mb-4"><code>{'{\n  "repoUrl": "https://github.com/user/repo"\n}'}</code></pre>
                </div>
              </div>
            )}

            {activeSection === 'retrieve-results' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-display font-bold">Retrieve Results</h1>
                <div className="card">
                  <h3 className="font-semibold mb-2">GET /api/v1/audit/:id</h3>
                  <p className="text-sm text-text-secondary mb-3">Get audit results. If the audit is pending, it will be executed synchronously.</p>
                  <h4 className="text-sm font-medium mb-1">Response</h4>
                  <pre className="bg-bg-surface rounded-lg p-4 text-sm text-text-secondary"><code>{'{\n  "id": "abc-123",\n  "type": "website",\n  "status": "completed",\n  "scores": {\n    "overall": 85,\n    "performance": 92,\n    "seo": 78,\n    "security": 80\n  },\n  "results": { ... },\n  "aiSummary": "..."\n}'}</code></pre>
                </div>
                <div className="card">
                  <h3 className="font-semibold mb-2">GET /api/v1/audits</h3>
                  <p className="text-sm text-text-secondary mb-3">List your audits.</p>
                  <h4 className="text-sm font-medium mb-1">Query Parameters</h4>
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li><code className="bg-bg-surface px-1 rounded">limit</code> - Number of results (default 10, max 50)</li>
                    <li><code className="bg-bg-surface px-1 rounded">type</code> - Filter: website, github, or all</li>
                  </ul>
                </div>
              </div>
            )}

            {activeSection === 'rate-limits' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-display font-bold">Rate Limits</h1>
                <div className="card">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border-subtle"><th className="text-left py-2">Plan</th><th className="text-left py-2">Hourly</th><th className="text-left py-2">Daily</th></tr></thead>
                    <tbody>
                      <tr className="border-b border-border-subtle"><td className="py-2">Free</td><td>10</td><td>50</td></tr>
                      <tr><td className="py-2">Pro</td><td>100</td><td>1,000</td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-text-secondary text-sm">When rate limited, the API returns HTTP 429 with an error message.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
