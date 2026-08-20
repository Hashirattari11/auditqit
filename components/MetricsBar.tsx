"use client";

interface Metric {
  label: string;
  value: number;
  unit: string;
  threshold: { good: number; poor: number };
}

export default function MetricsBar({ metrics }: { metrics: Metric[] }) {
  const getBarColor = (value: number, threshold: { good: number; poor: number }) => {
    if (value <= threshold.good) return "bg-accent-green";
    if (value <= threshold.poor) return "bg-accent-yellow";
    return "bg-accent-red";
  };

  const getTextColor = (value: number, threshold: { good: number; poor: number }) => {
    if (value <= threshold.good) return "text-accent-green";
    if (value <= threshold.poor) return "text-accent-yellow";
    return "text-accent-red";
  };

  return (
    <div className="space-y-4">
      {metrics.map((metric, index) => {
        const percentage = Math.min((metric.value / (metric.threshold.poor * 2)) * 100, 100);
        return (
          <div key={index}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-text-primary">{metric.label}</span>
              <span className={`text-sm font-mono font-bold ${getTextColor(metric.value, metric.threshold)}`}>
                {metric.unit === "ms"
                  ? `${Math.round(metric.value)}ms`
                  : metric.unit === "s"
                  ? `${(metric.value / 1000).toFixed(2)}s`
                  : metric.value.toFixed(3)}
              </span>
            </div>
            <div className="h-2 bg-bg rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${getBarColor(metric.value, metric.threshold)}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
