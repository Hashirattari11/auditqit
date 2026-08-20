import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-surface/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">Product</h4>
            <ul className="space-y-2.5">
              <li><Link href="/#features" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/launch" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Changelog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">Resources</h4>
            <ul className="space-y-2.5">
              <li><a href="https://github.com/Hashirattari11/auditqit" target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Documentation</a></li>
              <li><a href="https://github.com/Hashirattari11/auditqit" target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary hover:text-text-primary transition-colors">API</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">Company</h4>
            <ul className="space-y-2.5">
              <li><a href="https://github.com/Hashirattari11/auditqit" target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary hover:text-text-primary transition-colors">GitHub</a></li>
              <li><a href="https://github.com/Hashirattari11/auditqit/issues" target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">Legal</h4>
            <ul className="space-y-2.5">
              <li><span className="text-sm text-text-muted">Privacy Policy</span></li>
              <li><span className="text-sm text-text-muted">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border-subtle pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-white font-bold text-xs font-display">A</div>
            <span className="text-sm font-semibold font-display">Audit<span className="text-primary">IQ</span></span>
          </div>
          <p className="text-sm text-text-muted">&copy; 2025 AuditIQ. Built with passion for developers.</p>
        </div>
      </div>
    </footer>
  );
}
