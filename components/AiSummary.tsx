"use client";

export default function AiSummary({ summary }: { summary: string }) {
  if (!summary) {
    return <div className="text-text-muted text-sm">No AI summary available</div>;
  }

  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    return text.split("\n").map((line, index) => {
      if (line.startsWith("# ")) {
        return <h3 key={index} className="text-xl font-bold text-dark-50 mt-4 mb-2">{line.slice(2)}</h3>;
      }
      if (line.startsWith("## ")) {
        return <h4 key={index} className="text-lg font-semibold text-dark-100 mt-3 mb-1">{line.slice(3)}</h4>;
      }
      if (line.startsWith("### ")) {
        return <h5 key={index} className="text-base font-medium text-text-primary mt-2 mb-1">{line.slice(4)}</h5>;
      }
      if (line.match(/^\d+\.\s/)) {
        return <div key={index} className="text-text-secondary ml-4 mb-1">{line}</div>;
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return <div key={index} className="text-text-secondary ml-4 mb-1">• {line.slice(2)}</div>;
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return <div key={index} className="text-dark-100 font-semibold mt-2">{line.slice(2, -2)}</div>;
      }
      if (line.trim() === "") {
        return <div key={index} className="h-2" />;
      }
      return <div key={index} className="text-text-secondary">{line}</div>;
    });
  };

  return (
    <div className="prose prose-invert max-w-none">
      <div className="text-sm leading-relaxed">
        {renderContent(summary)}
      </div>
    </div>
  );
}
