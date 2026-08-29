import type { RiskLevel } from "@/types";

const riskConfig: Record<
  RiskLevel,
  { label: string; bg: string; text: string; border: string }
> = {
  low: {
    label: "Low",
    bg: "rgba(79, 222, 163, 0.1)",
    text: "#6ffbbe",
    border: "rgba(111, 251, 190, 0.2)",
  },
  medium: {
    label: "Med",
    bg: "rgba(255, 185, 95, 0.1)",
    text: "#ffb95f",
    border: "rgba(255, 185, 95, 0.2)",
  },
  high: {
    label: "High",
    bg: "rgba(255, 180, 171, 0.1)",
    text: "#ffb4ab",
    border: "rgba(255, 180, 171, 0.2)",
  },
  critical: {
    label: "Critical",
    bg: "rgba(147, 0, 10, 0.3)",
    text: "#ffdad6",
    border: "rgba(255, 180, 171, 0.4)",
  },
};

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export default function RiskBadge({ level, className = "" }: RiskBadgeProps) {
  const config = riskConfig[level];
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-label-mono uppercase tracking-widest border ${className}`}
      style={{
        backgroundColor: config.bg,
        color: config.text,
        borderColor: config.border,
        fontSize: "10px",
        lineHeight: "16px",
        letterSpacing: "0.1em",
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontWeight: 500,
      }}
    >
      {config.label}
    </span>
  );
}
