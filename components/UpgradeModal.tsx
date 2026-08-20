'use client';

import { useState } from 'react';
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
      <div className="w-full max-w-lg p-8 rounded-2xl bg-dark-700 border border-dark-500 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-dark-400 hover:text-white text-xl"
        >
          ×
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-3xl">
            🔓
          </div>
          <h2 className="text-2xl font-bold mb-2">Upgrade to Pro</h2>
          <p className="text-dark-300 text-sm">
            {reason || `You've used all ${currentUsage || 5} free audits this month.`}
          </p>
        </div>

        {/* Feature comparison */}
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          <div className="space-y-3">
            <h3 className="font-semibold text-dark-300">Free</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-dark-400">
                <span>5 audits/month</span>
              </li>
              <li className="flex items-center gap-2 text-dark-400">
                <span>Website + GitHub</span>
              </li>
              <li className="flex items-center gap-2 text-dark-400">
                <span>Basic AI</span>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-accent-blue">Pro</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-white">
                <span className="text-green-400">✓</span>
                <span><strong>Unlimited</strong></span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <span className="text-green-400">✓</span>
                <span><strong>PDF Reports</strong></span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <span className="text-green-400">✓</span>
                <span><strong>Priority Queue</strong></span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <span className="text-green-400">✓</span>
                <span><strong>Full History</strong></span>
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/pricing"
            onClick={onClose}
            className="block w-full py-3 text-center rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Upgrade for $9/month
          </Link>
          <button
            onClick={onClose}
            className="block w-full py-3 text-center rounded-xl border border-dark-500 text-dark-300 hover:bg-dark-600 transition-colors text-sm"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
