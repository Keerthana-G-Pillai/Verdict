import type { Finding } from "@/lib/analysis/types";

interface FindingCardProps {
  finding: Finding;
  index?: number;
}

const SEVERITY_CONFIG = {
  critical: {
    label: "CRITICAL",
    bg: "rgba(147,0,10,0.15)",
    border: "rgba(255,180,171,0.3)",
    text: "#ffdad6",
    dot: "#ffb4ab",
    headerBg: "rgba(147,0,10,0.2)",
  },
  high: {
    label: "HIGH",
    bg: "rgba(255,180,171,0.05)",
    border: "rgba(255,180,171,0.2)",
    text: "#ffb4ab",
    dot: "#ffb4ab",
    headerBg: "rgba(255,180,171,0.08)",
  },
  medium: {
    label: "MEDIUM",
    bg: "rgba(255,185,95,0.05)",
    border: "rgba(255,185,95,0.2)",
    text: "#ffb95f",
    dot: "#ffb95f",
    headerBg: "rgba(255,185,95,0.08)",
  },
  low: {
    label: "LOW",
    bg: "rgba(111,251,190,0.03)",
    border: "rgba(111,251,190,0.15)",
    text: "#6ffbbe",
    dot: "#6ffbbe",
    headerBg: "rgba(111,251,190,0.06)",
  },
  info: {
    label: "INFO",
    bg: "rgba(0,240,255,0.03)",
    border: "rgba(0,240,255,0.15)",
    text: "#7df4ff",
    dot: "#7df4ff",
    headerBg: "rgba(0,240,255,0.06)",
  },
};

export default function FindingCard({ finding }: FindingCardProps) {
  const cfg = SEVERITY_CONFIG[finding.severity];

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: `1px solid ${cfg.border}`, backgroundColor: cfg.bg }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between gap-md px-5 py-3"
        style={{ backgroundColor: cfg.headerBg, borderBottom: `1px solid ${cfg.border}` }}
      >
        <div className="flex items-center gap-sm flex-1 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: cfg.dot }}
          />
          <h3
            className="text-body-md font-semibold leading-snug"
            style={{ color: "#e5e2e3" }}
          >
            {finding.title}
          </h3>
        </div>
        <span
          className="text-label-mono shrink-0 px-2 py-0.5 rounded border"
          style={{
            color: cfg.text,
            borderColor: cfg.border,
            backgroundColor: cfg.bg,
            fontSize: "10px",
            letterSpacing: "0.08em",
          }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col gap-3">
        <p className="text-body-md text-on-surface-variant leading-relaxed">
          {finding.description}
        </p>

        {finding.affectedArea && (
          <div className="flex items-center gap-sm">
            <span className="text-label-mono text-on-surface-variant uppercase tracking-wider" style={{ fontSize: "10px", minWidth: "80px" }}>
              Affected
            </span>
            <span className="text-code-sm px-2 py-0.5 rounded bg-surface-container-lowest border border-[#2d2d30]" style={{ color: cfg.text }}>
              {finding.affectedArea}
            </span>
          </div>
        )}

        {finding.evidence && (
          <div className="flex gap-sm">
            <span className="text-label-mono text-on-surface-variant uppercase tracking-wider shrink-0" style={{ fontSize: "10px", minWidth: "80px", paddingTop: "2px" }}>
              Evidence
            </span>
            <p className="text-code-sm text-on-surface-variant">
              {finding.evidence}
            </p>
          </div>
        )}

        {finding.recommendation && (
          <div
            className="flex gap-sm px-3 py-2.5 rounded"
            style={{ backgroundColor: "rgba(0,240,255,0.04)", border: "1px solid rgba(0,240,255,0.1)" }}
          >
            <span className="material-symbols-outlined text-primary-container shrink-0 mt-0.5" style={{ fontSize: "14px" }}>
              lightbulb
            </span>
            <p className="text-code-sm text-on-surface-variant">
              {finding.recommendation}
            </p>
          </div>
        )}

        {/* Confidence bar */}
        <div className="mt-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-label-mono text-on-surface-variant" style={{ fontSize: "10px" }}>CONFIDENCE</span>
            <span className="text-label-mono" style={{ color: "#e5e2e3", fontSize: "10px" }}>{finding.confidence}%</span>
          </div>
          <div className="h-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-1 rounded-full transition-all duration-500"
              style={{ width: `${finding.confidence}%`, backgroundColor: cfg.dot, opacity: 0.7 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
