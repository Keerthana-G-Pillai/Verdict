type StatusVariant = "active" | "analyzing" | "completed" | "failed" | "pending" | "simulating";

const statusConfig: Record<
  StatusVariant,
  { dot: string; text: string; label: string; animate?: boolean }
> = {
  active: {
    dot: "#7df4ff",
    text: "#7df4ff",
    label: "Active",
    animate: true,
  },
  analyzing: {
    dot: "#7df4ff",
    text: "#7df4ff",
    label: "Analyzing",
    animate: true,
  },
  completed: {
    dot: "#6ffbbe",
    text: "#e5e2e3",
    label: "Completed",
  },
  failed: {
    dot: "#ffb4ab",
    text: "#ffb4ab",
    label: "Failed",
  },
  pending: {
    dot: "#849495",
    text: "#b9cacb",
    label: "Pending",
  },
  simulating: {
    dot: "#ffb95f",
    text: "#ffb95f",
    label: "Simulating",
    animate: true,
  },
};

interface StatusIndicatorProps {
  status: StatusVariant;
  label?: string;
  className?: string;
}

export default function StatusIndicator({
  status,
  label,
  className = "",
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const displayLabel = label ?? config.label;

  if (status === "failed") {
    return (
      <span
        className={`flex items-center gap-1 text-code-sm ${className}`}
        style={{ color: config.text }}
      >
        <span className="material-symbols-outlined text-[14px]">warning</span>
        {displayLabel}
      </span>
    );
  }

  return (
    <span
      className={`flex items-center gap-1 text-code-sm ${className}`}
      style={{ color: config.text }}
    >
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${config.animate ? "animate-pulse" : ""}`}
        style={{ backgroundColor: config.dot }}
      />
      {displayLabel}
    </span>
  );
}
