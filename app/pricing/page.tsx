import Link from 'next/link';
import { auth } from '@/lib/auth';

export default async function PricingPage() {
  const session = await auth();

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-dark-600/50 bg-dark-800/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-blue to-accent-purple rounded-lg flex items-center justify-center text-sm font-bold">
              A
            </div>
            <span className="text-lg font-bold">AuditIQ</span>
          </Link>
          <div className="flex items-center gap-4">
            {session ? (
              <Link href="/dashboard" className="text-sm text-dark-300 hover:text-white transition-colors">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-dark-300 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="text-sm px-4 py-2 rounded-lg bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-dark-300 text-lg">Start free, upgrade when you need more.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="p-8 rounded-2xl bg-dark-700/50 border border-dark-600/50">
            <h2 className="text-xl font-bold mb-2">Free</h2>
            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-dark-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>5 audits per month</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Website + GitHub audits</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Shareable reports</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Basic AI analysis</span>
              </li>
            </ul>
            <Link
              href={session ? '/' : '/auth/signup'}
              className="block w-full py-3 text-center rounded-xl border border-dark-500 text-white font-semibold hover:bg-dark-600 transition-colors"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="p-8 rounded-2xl bg-gradient-to-b from-accent-blue/5 to-accent-purple/5 border border-accent-blue/30 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-accent-blue to-accent-purple text-xs font-semibold">
              Most Popular
            </div>
            <h2 className="text-xl font-bold mb-2">Pro</h2>
            <div className="mb-6">
              <span className="text-4xl font-bold">$9</span>
              <span className="text-dark-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span><strong>Unlimited</strong> audits</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Everything in Free</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span><strong>PDF report download</strong></span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span><strong>Priority processing</strong></span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Full audit history</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Email report delivery</span>
              </li>
            </ul>
            <form action="/api/stripe/create-checkout" method="POST">
              <button
                type="submit"
                className="block w-full py-3 text-center rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Upgrade to Pro
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
