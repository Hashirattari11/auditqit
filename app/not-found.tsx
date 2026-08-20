import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-dark-300 text-lg mb-8">
          This page doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Go Home
          </Link>
          <Link
            href="/pricing"
            className="px-6 py-3 rounded-xl border border-dark-500 text-white font-semibold hover:bg-dark-600 transition-colors"
          >
            View Pricing
          </Link>
        </div>
      </div>
    </main>
  );
}
