"use client";

interface SecurityHeader {
  name: string;
  present: boolean;
  value: string | null;
}

export default function SecurityHeaders({ headers }: { headers: Record<string, { present: boolean; value: string | null }> | unknown }) {
  if (!headers || typeof headers !== "object") {
    return <div className="text-text-muted text-sm">No header data available</div>;
  }

  const headerList: SecurityHeader[] = Object.entries(headers).map(([name, data]) => ({
    name,
    present: data?.present || false,
    value: data?.value || null,
  }));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle">
            <th className="text-left py-3 px-4 text-text-secondary font-medium">Header</th>
            <th className="text-center py-3 px-4 text-text-secondary font-medium">Status</th>
            <th className="text-left py-3 px-4 text-text-secondary font-medium">Value</th>
          </tr>
        </thead>
        <tbody>
          {headerList.map((header, index) => (
            <tr key={index} className="border-b border-border-subtle hover:bg-bg/50">
              <td className="py-3 px-4 font-mono text-text-primary">{header.name}</td>
              <td className="py-3 px-4 text-center">
                {header.present ? (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-accent-green">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 text-accent-red">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-text-muted font-mono text-xs max-w-xs truncate">
                {header.value || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
