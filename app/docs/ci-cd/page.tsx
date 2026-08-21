'use client';

import Link from 'next/link';

export default function CiCdPage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-lg font-bold font-display">Audit<span className="text-primary">IQ</span></Link>
          <Link href="/docs" className="text-sm text-text-secondary hover:text-text-primary">API Docs</Link>
        </div>

        <h1 className="text-3xl font-display font-bold mb-6">CI/CD Integration</h1>
        <p className="text-text-secondary mb-8">Automate website audits in your CI/CD pipeline with the AuditIQ GitHub Action.</p>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-3">1. Get Your API Key</h2>
            <p className="text-sm text-text-secondary mb-3">Generate an API key from your <Link href="/dashboard" className="text-primary">dashboard</Link> and add it as a repository secret.</p>
            <p className="text-sm text-text-secondary">Go to <strong>Settings &gt; Secrets and variables &gt; Actions</strong> and add <code className="bg-bg-surface px-1.5 py-0.5 rounded">AUDITIQ_API_KEY</code></p>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-3">2. Create Workflow</h2>
            <p className="text-sm text-text-secondary mb-3">Add this to <code className="bg-bg-surface px-1.5 py-0.5 rounded">.github/workflows/audit.yml</code>:</p>
            <pre className="bg-bg-surface rounded-lg p-4 text-sm overflow-x-auto text-text-secondary"><code>{`name: AuditIQ Check
on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: auditiq/audit-action@v1
        with:
          api-key: \${{ secrets.AUDITIQ_API_KEY }}
          url: 'https://yoursite.com'
          min-performance: 80
          min-seo: 70
          fail-on-critical: true`}</code></pre>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-3">3. Available Inputs</h2>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border-subtle"><th className="text-left py-2">Input</th><th className="text-left py-2">Required</th><th className="text-left py-2">Default</th></tr></thead>
              <tbody>
                {[
                  ['api-key', 'Yes', ''],
                  ['url', 'No*', ''],
                  ['repo', 'No*', '{{ github.repository }}'],
                  ['min-performance', 'No', '70'],
                  ['min-seo', 'No', '70'],
                  ['fail-on-critical', 'No', 'true'],
                ].map(([input, req, def]) => (
                  <tr key={input} className="border-b border-border-subtle"><td className="py-2"><code className="bg-bg-surface px-1 rounded">{input}</code></td><td>{req}</td><td>{def}</td></tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-text-muted mt-3">*Either <code>url</code> or <code>repo</code> is required</p>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-3">4. Outputs</h2>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border-subtle"><th className="text-left py-2">Output</th><th className="text-left py-2">Description</th></tr></thead>
              <tbody>
                {[
                  ['performance-score', 'Performance score (0-100)'],
                  ['seo-score', 'SEO score (0-100)'],
                  ['security-score', 'Security score (0-100)'],
                  ['audit-url', 'Link to full audit report'],
                  ['issues-found', 'Number of issues found'],
                ].map(([output, desc]) => (
                  <tr key={output} className="border-b border-border-subtle"><td className="py-2"><code className="bg-bg-surface px-1 rounded">{output}</code></td><td>{desc}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
