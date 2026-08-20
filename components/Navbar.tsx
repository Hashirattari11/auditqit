'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass py-3 shadow-lg shadow-black/20'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm font-display">
            A
          </div>
          <span className="text-lg font-bold font-display">
            Audit<span className="text-primary">IQ</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Features</Link>
          <Link href="/pricing" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Pricing</Link>
          <a href="https://github.com/Hashirattari11/auditqit" target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary hover:text-text-primary transition-colors">GitHub</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <Link href="/dashboard" className="btn-primary text-sm">Dashboard</Link>
          ) : (
            <>
              <Link href="/auth/login" className="btn-ghost">Login</Link>
              <Link href="/auth/signup" className="btn-primary text-sm">Get Started Free</Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-bg-surface transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass mt-2 mx-4 rounded-xl p-4 space-y-3 animate-scale-in">
          <Link href="/#features" className="block py-2 text-text-secondary hover:text-text-primary" onClick={() => setMobileOpen(false)}>Features</Link>
          <Link href="/pricing" className="block py-2 text-text-secondary hover:text-text-primary" onClick={() => setMobileOpen(false)}>Pricing</Link>
          <a href="https://github.com/Hashirattari11/auditqit" target="_blank" rel="noopener noreferrer" className="block py-2 text-text-secondary hover:text-text-primary">GitHub</a>
          <hr className="border-border-subtle" />
          {session ? (
            <Link href="/dashboard" className="btn-primary block text-center" onClick={() => setMobileOpen(false)}>Dashboard</Link>
          ) : (
            <>
              <Link href="/auth/login" className="block py-2 text-text-secondary hover:text-text-primary" onClick={() => setMobileOpen(false)}>Login</Link>
              <Link href="/auth/signup" className="btn-primary block text-center" onClick={() => setMobileOpen(false)}>Get Started Free</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
