"use client";

import { useState, useEffect } from "react";

interface Audit {
  id: string;
  url: string;
  createdAt: string;
}

export default function RecentAudits() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const response = await fetch("/api/audit/recent");
        const data = await response.json();
        if (data.audits) {
          setAudits(data.audits.filter((a: { status: string }) => a.status === "completed"));
        }
      } catch {
        // Silently fail — component just won't show
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();
  }, []);

  if (loading) {
    return (
      <div className="text-text-muted text-sm">Loading recent audits...</div>
    );
  }

  if (audits.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-12">
      <h3 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">Recent Public Audits</h3>
      <div className="space-y-2">
        {audits.map((audit) => (
          <a
            key={audit.id}
            href={`/report/${audit.id}`}
            className="flex items-center justify-between px-4 py-3 rounded-lg bg-bg/50 
                       border border-border-subtle/50 hover:border-border-subtle transition group"
          >
            <span className="text-text-secondary text-sm truncate group-hover:text-dark-100 transition">
              {audit.url}
            </span>
            <span className="text-text-muted text-xs flex-shrink-0 ml-4">
              {new Date(audit.createdAt).toLocaleDateString()}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
