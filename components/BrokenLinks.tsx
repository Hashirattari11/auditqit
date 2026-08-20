"use client";

import { useState } from "react";

interface BrokenLink {
  url: string;
  status: number;
  statusText: string;
  location: string;
}

export default function BrokenLinks({ links, total }: { links: BrokenLink[]; total: number }) {
  const [expanded, setExpanded] = useState(false);

  if (!links || links.length === 0) {
    return (
      <div className="text-sm text-text-muted">
        All {total} checked links are healthy.
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-accent-red font-medium hover:underline w-full text-left"
      >
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {links.length} broken link{links.length !== 1 ? "s" : ""} found (out of {total} total)
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
          {links.map((link, index) => (
            <div
              key={index}
              className="px-3 py-2 bg-bg border border-border-subtle rounded-lg text-sm"
            >
              <div className="font-mono text-text-primary break-all">{link.url}</div>
              <div className="flex gap-4 mt-1 text-xs text-text-muted">
                <span className="text-accent-red font-mono">
                  {link.status || "ERR"} {link.statusText}
                </span>
                <span>on: {link.location}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
