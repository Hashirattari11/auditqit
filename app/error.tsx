'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold font-mono text-accent-red/20 mb-4">500</div>
        <h1 className="text-2xl font-display font-bold mb-3">Something went wrong</h1>
        <p className="text-text-secondary mb-2">An unexpected error occurred.</p>
        {error.digest && <p className="text-xs text-text-muted font-mono mb-6">Error: {error.digest}</p>}
        <button onClick={reset} className="btn-primary">Try Again</button>
      </div>
    </main>
  );
}
