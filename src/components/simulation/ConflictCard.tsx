import type { SimConflict } from "@/lib/simulation/types";

interface ConflictCardProps {
  conflict: SimConflict;
  isSemanticHighlight?: boolean;
}

const SEVERITY_CONFIG = {
  critical: {
    label: "CRITICAL",
    bg: "rgba(147,0,10,0.15)",
    border: "rgba(255,180,171,0.35)",
    text: "#ffdad6",
    dot: "#ffb4ab",
    headerBg: "rgba(147,0,10,0.22)",
  },
  high: {
    label: "HIGH",
    bg: "rgba(255,180,171,0.05)",
    border: "rgba(255,180,171,0.22)",
    text: "#ffb4ab",
    dot: "#ffb4ab",
    headerBg: "rgba(255,180,171,0.09)",
  },
  medium: {
    label: "MEDIUM",
    bg: "rgba(255,185,95,0.05)",
    border: "rgba(255,185,95,0.2)",
    text: "#ffb95f",
    dot: "#ffb95f",
    headerBg: "rgba(255,185,95,0.09)",
  },
  low: {
    label: "LOW",
    bg: "rgba(111,251,190,0.03)",
    border: "rgba(111,251,190,0.15)",
    text: "#6ffbbe",
    dot: "#6ffbbe",
    headerBg: "rgba(111,251,190,0.06)",
  },
};

const CONFLICT_TYPE_LABELS: Record<SimConflict["type"], string> = {
  direct: "DIRECT CONFLICT",
  semantic: "SEMANTIC CONFLICT",
  contract: "CONTRACT CONFLICT",
  state: "STATE CONFLICT",
  ordering: "ORDERING CONFLICT",
  configuration: "CONFIG CONFLICT",
};

export default function ConflictCard({ conflict, isSemanticHighlight = false }: ConflictCardProps) {
  const cfg = SEVERITY_CONFIG[conflict.severity];

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        border: `1px solid ${cfg.border}`,
        backgroundColor: cfg.bg,
        boxShadow: isSemanticHighlight && conflict.severity === "critical"
          ? "0 0 20px rgba(255,180,171,0.12)"
          : undefined,
      }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between gap-md px-5 py-3"
        style={{ backgroundColor: cfg.headerBg, borderBottom: `1px solid ${cfg.border}` }}
      >
        <div className="flex items-center gap-sm flex-1 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
          <h3 className="text-body-md font-semibold text-on-surface leading-snug">{conflict.title}</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-label-mono px-2 py-0.5 rounded border"
            style={{ color: "#849495", borderColor: "#2d2d30", backgroundColor: "#141416", fontSize: "10px" }}
          >
            {CONFLICT_TYPE_LABELS[conflict.type]}
          </span>
          <span
            className="text-label-mono px-2 py-0.5 rounded border"
            style={{ color: cfg.text, borderColor: cfg.border, backgroundColor: cfg.bg, fontSize: "10px", letterSpacing: "0.08em" }}
          >
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col gap-4">
        <p className="text-body-md text-on-surface-variant">{conflict.description}</p>

        {/* Change A vs B assumptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
          <div
            className="px-4 py-3 rounded"
            style={{ backgroundColor: "rgba(0,240,255,0.04)", border: "1px solid rgba(0,240,255,0.12)" }}
          >
            <span className="text-label-mono text-primary-fixed-dim block mb-1" style={{ fontSize: "10px" }}>CHANGE A ASSUMES</span>
            <p className="text-code-sm text-on-surface-variant">{conflict.changeAAssumption}</p>
          </div>
          <div
            className="px-4 py-3 rounded"
            style={{ backgroundColor: "rgba(111,251,190,0.04)", border: "1px solid rgba(111,251,190,0.12)" }}
          >
            <span className="text-label-mono text-secondary-fixed block mb-1" style={{ fontSize: "10px" }}>CHANGE B ASSUMES</span>
            <p className="text-code-sm text-on-surface-variant">{conflict.changeBAssumption}</p>
          </div>
        </div>

        {/* Why they collide */}
        <div className="flex gap-sm">
          <span
            className="material-symbols-outlined shrink-0 mt-0.5"
            style={{ fontSize: "16px", color: cfg.dot }}
          >
            warning
          </span>
          <div>
            <span className="text-label-mono text-on-surface-variant block mb-1" style={{ fontSize: "10px" }}>WHY THEY COLLIDE</span>
            <p className="text-code-sm text-on-surface-variant">{conflict.collisionReason}</p>
          </div>
        </div>

        {/* Consequence */}
        <div
          className="flex gap-sm px-4 py-3 rounded"
          style={{ backgroundColor: "rgba(255,180,171,0.04)", border: `1px solid ${cfg.border}` }}
        >
          <span className="material-symbols-outlined text-error shrink-0 mt-0.5" style={{ fontSize: "14px" }}>bolt</span>
          <div>
            <span className="text-label-mono text-on-surface-variant block mb-1" style={{ fontSize: "10px" }}>POTENTIAL CONSEQUENCE</span>
            <p className="text-code-sm text-on-surface-variant">{conflict.consequence}</p>
          </div>
        </div>

        {/* Resolution */}
        <div
          className="flex gap-sm px-4 py-3 rounded"
          style={{ backgroundColor: "rgba(0,240,255,0.04)", border: "1px solid rgba(0,240,255,0.1)" }}
        >
          <span className="material-symbols-outlined text-primary-container shrink-0 mt-0.5" style={{ fontSize: "14px" }}>lightbulb</span>
          <div>
            <span className="text-label-mono text-primary-fixed-dim block mb-1" style={{ fontSize: "10px" }}>RECOMMENDED RESOLUTION</span>
            <p className="text-code-sm text-on-surface-variant">{conflict.resolution}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-label-mono text-on-surface-variant" style={{ fontSize: "10px" }}>
            Affected: <span className="text-on-surface">{conflict.affectedArea}</span>
          </span>
          <span className="text-label-mono text-on-surface-variant" style={{ fontSize: "10px" }}>
            Confidence: <span className="text-on-surface">{conflict.confidence}%</span>
          </span>
        </div>
      </div>
    </div>
  );
}
