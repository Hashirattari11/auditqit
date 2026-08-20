export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-text-secondary">Loading...</p>
      </div>
    </main>
  );
}
