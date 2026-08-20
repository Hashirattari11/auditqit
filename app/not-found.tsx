import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold font-mono text-primary/20 mb-4">404</div>
        <h1 className="text-2xl font-display font-bold mb-3">Page not found</h1>
        <p className="text-text-secondary mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link href="/" className="btn-primary inline-block">Back to Home</Link>
      </div>
    </main>
  );
}
