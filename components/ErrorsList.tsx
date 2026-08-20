"use client";

import { useState } from "react";

export default function ErrorsList({ errors }: { errors: string[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!errors || errors.length === 0) {
    return (
      <div className="flex items-center gap-2 text-accent-green text-sm">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        No console errors detected
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
        {errors.length} console error{errors.length !== 1 ? "s" : ""} found
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
          {errors.map((error, index) => (
            <div
              key={index}
              className="px-3 py-2 bg-red-500/5 border border-red-500/10 rounded-lg text-sm font-mono text-text-secondary break-all"
            >
              <span className="text-text-muted mr-2">#{index + 1}</span>
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
