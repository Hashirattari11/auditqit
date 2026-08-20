'use client';

import Link from 'next/link';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
  currentUsage?: number;
}

export default function UpgradeModal({ isOpen, onClose, reason, currentUsage }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg p-8 rounded-2xl bg-bg-surface border border-border-subtle shadow-2xl animate-scale-in relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary text-xl transition-colors">×</button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl">🔓</div>
          <h2 className="text-2xl font-display font-bold mb-2">Upgrade to Pro</h2>
          <p className="text-text-secondary text-sm">{reason || `You've used all ${currentUsage || 5} free audits this month.`}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          <div className="space-y-3">
            <h3 className="font-semibold text-text-secondary">Free</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-text-muted"><span>5 audits/month</span></li>
              <li className="flex items-center gap-2 text-text-muted"><span>Website + GitHub</span></li>
              <li className="flex items-center gap-2 text-text-muted"><span>Basic AI</span></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-primary">Pro</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-text-primary"><span className="text-accent-green">✓</span><span><strong>Unlimited</strong></span></li>
              <li className="flex items-center gap-2 text-text-primary"><span className="text-accent-green">✓</span><span><strong>PDF Reports</strong></span></li>
              <li className="flex items-center gap-2 text-text-primary"><span className="text-accent-green">✓</span><span><strong>Priority Queue</strong></span></li>
              <li className="flex items-center gap-2 text-text-primary"><span className="text-accent-green">✓</span><span><strong>Full History</strong></span></li>
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/pricing" onClick={onClose} className="btn-primary block text-center">Upgrade for $9/month</Link>
          <button onClick={onClose} className="btn-secondary w-full">Maybe later</button>
        </div>
      </div>
    </div>
  );
}
