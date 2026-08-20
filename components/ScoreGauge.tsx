"use client";

export default function ScoreGauge({ score, label }: { score: number; label: string }) {
  const getColor = (s: number) => {
    if (s >= 80) return { stroke: "#22c55e", text: "text-accent-green", bg: "bg-green-500/10" };
    if (s >= 50) return { stroke: "#eab308", text: "text-accent-yellow", bg: "bg-yellow-500/10" };
    return { stroke: "#ef4444", text: "text-accent-red", bg: "bg-red-500/10" };
  };

  const colors = getColor(score);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`flex flex-col items-center p-6 rounded-2xl ${colors.bg} border border-dark-700/50`}>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={colors.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-3xl font-bold ${colors.text}`}>{score}</span>
        </div>
      </div>
      <span className="mt-3 text-sm font-medium text-dark-300">{label}</span>
    </div>
  );
}
