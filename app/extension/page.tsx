import Link from 'next/link';

export default function ExtensionPage() {
  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Link href="/" className="text-lg font-bold font-display mb-8 inline-block">Audit<span className="text-primary">IQ</span></Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold mb-4">AuditIQ Browser Extension</h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">Audit any website you visit with one click. Get instant performance, SEO, and security scores.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: '⚡', title: 'Instant Audits', desc: 'Audit any page in seconds without leaving your browser' },
            { icon: '📊', title: 'Score Breakdown', desc: 'Performance, SEO, and security scores at a glance' },
            { icon: '🔗', title: 'Full Reports', desc: 'Click through to see the complete audit report' },
          ].map(f => (
            <div key={f.title} className="card text-center">
              <p className="text-3xl mb-3">{f.icon}</p>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-text-secondary">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="card max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold mb-4">Install Extension</h2>
          <p className="text-sm text-text-secondary mb-6">Currently available for manual installation during development.</p>
          <a href="#" className="btn-primary block mb-3">Download .zip</a>
          <p className="text-xs text-text-muted">Chrome Web Store listing coming soon</p>
        </div>

        <div className="card mt-8 max-w-md mx-auto">
          <h3 className="font-semibold mb-3">Setup</h3>
          <ol className="text-sm text-text-secondary space-y-2">
            <li>1. Download and unzip the extension</li>
            <li>2. Open <code className="bg-bg-surface px-1 rounded">chrome://extensions</code></li>
            <li>3. Enable Developer mode</li>
            <li>4. Click &quot;Load unpacked&quot; and select the extension folder</li>
            <li>5. Click the AuditIQ icon and enter your API key</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
