"use client";

export default function Screenshots({
  desktop,
  mobile,
}: {
  desktop: string;
  mobile: string;
}) {
  if (!desktop && !mobile) {
    return <div className="text-text-muted text-sm">No screenshots captured</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {desktop && (
        <div>
          <div className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wider">Desktop (1920×1080)</div>
          <div className="rounded-lg overflow-hidden border border-border-subtle bg-bg">
            <img
              src={`data:image/png;base64,${desktop}`}
              alt="Desktop screenshot"
              className="w-full h-auto"
            />
          </div>
        </div>
      )}
      {mobile && (
        <div>
          <div className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wider">Mobile (390×844)</div>
          <div className="rounded-lg overflow-hidden border border-border-subtle bg-bg max-w-[220px] mx-auto">
            <img
              src={`data:image/png;base64,${mobile}`}
              alt="Mobile screenshot"
              className="w-full h-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
