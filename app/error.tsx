'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">💥</div>
        <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
        <p className="text-dark-300 text-lg mb-2">
          An unexpected error occurred.
        </p>
        {error.digest && (
          <p className="text-dark-500 text-sm mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple text-white font-semibold hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
