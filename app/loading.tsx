export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-accent-blue to-accent-purple rounded-xl flex items-center justify-center animate-pulse">
          <span className="text-lg font-bold">A</span>
        </div>
        <p className="text-dark-300 text-sm">Loading...</p>
      </div>
    </main>
  );
}
