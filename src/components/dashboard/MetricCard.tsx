import type { MetricCard as MetricCardType } from "@/types";

const iconColors = {
  primary: { icon: "#7df4ff", accent: "rgba(0,240,255,0.5)", accentHover: "#00f0ff" },
  error: { icon: "#ffb4ab", accent: "rgba(255,180,171,0.5)", accentHover: "#ffb4ab" },
  secondary: { icon: "#6ffbbe", accent: "rgba(111,251,190,0.5)", accentHover: "#6ffbbe" },
  tertiary: { icon: "#ffb95f", accent: "rgba(255,185,95,0.5)", accentHover: "#ffb95f" },
};

const trendIcons = {
  up: "arrow_upward",
  down: "arrow_downward",
  neutral: "remove",
};

export default function MetricCard({
  label,
  value,
  icon,
  trend,
  accentColor = "primary",
  children,
}: MetricCardType & { children?: React.ReactNode }) {
  const colors = iconColors[accentColor];

  return (
    <div className="card p-lg relative overflow-hidden group">
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 w-full h-[2px] transition-colors duration-200"
        style={{ backgroundColor: colors.accent }}
      />

      <div className="flex justify-between items-start mb-md">
        <span className="text-label-mono text-on-surface-variant">{label}</span>
        <span
          className="material-symbols-outlined text-[20px]"
          style={{ color: colors.icon }}
        >
          {icon}
        </span>
      </div>

      <div
        className="text-headline-lg text-on-surface"
        style={accentColor === "error" ? { color: "#ffb4ab" } : undefined}
      >
        {value}
      </div>

      {trend && (
        <div className="text-code-sm text-on-surface-variant mt-xs flex items-center gap-xs">
          <span className="material-symbols-outlined text-[14px]" style={{ color: "#6ffbbe" }}>
            {trendIcons[trend.direction]}
          </span>
          <span>{trend.label}</span>
        </div>
      )}

      {children}
    </div>
  );
}
