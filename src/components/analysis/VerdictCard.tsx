import type { VerdictOutcome } from "@/lib/analysis/types";

interface VerdictCardProps {
  verdict: VerdictOutcome;
  riskScore: number;
  confidence: number;
  rationale: string;
  conditions: string[];
  criticalCount: number;
  highCount: number;
  saferAlternative?: string | null;
}

const VERDICT_CONFIG: Record<VerdictOutcome, {
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
}> = {
  approved: {
    label: "APPROVED",
    shortLabel: "Approved",
    icon: "check_circle",
    color: "#6ffbbe",
    bg: "rgba(79,222,163,0.06)",
    border: "rgba(111,251,190,0.3)",
    glow: "0 0 20px rgba(79,222,163,0.15)",
  },
  approved_with_conditions: {
    label: "APPROVED WITH CONDITIONS",
    shortLabel: "Conditions",
    icon: "rule",
    color: "#ffb95f",
    bg: "rgba(255,185,95,0.06)",
    border: "rgba(255,185,95,0.3)",
    glow: "0 0 20px rgba(255,185,95,0.15)",
  },
  requires_revision: {
    label: "REQUIRES REVISION",
    shortLabel: "Revision",
    icon: "edit_note",
    color: "#ffb4ab",
    bg: "rgba(255,180,171,0.06)",
    border: "rgba(255,180,171,0.3)",
    glow: "0 0 20px rgba(255,180,171,0.15)",
  },
  rejected: {
    label: "REJECTED",
    shortLabel: "Rejected",
    icon: "cancel",
    color: "#ffb4ab",
    bg: "rgba(147,0,10,0.12)",
    border: "rgba(255,180,171,0.3)",
    glow: "0 0 20px rgba(147,0,10,0.2)",
  },
};

const RISK_COLOR = (score: number) => {
  if (score >= 70) return { text: "#ffb4ab", label: "HIGH RISK" };
  if (score >= 40) return { text: "#ffb95f", label: "MEDIUM RISK" };
  if (score >= 20) return { text: "#ffb95f", label: "LOW-MED RISK" };
  return { text: "#6ffbbe", label: "LOW RISK" };
};

export default function VerdictCard({
  verdict,
  riskScore,
  confidence,
  rationale,
  conditions,
  criticalCount,
  highCount,
  saferAlternative,
}: VerdictCardProps) {
  const cfg = VERDICT_CONFIG[verdict];
  const riskCfg = RISK_COLOR(riskScore);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: cfg.glow,
      }}
    >
      {/* Top accent */}
      <div className="h-[3px]" style={{ backgroundColor: cfg.color }} />

      <div className="p-8">
        {/* Verdict header row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
          {/* Left: icon + verdict label */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${cfg.color}18`, border: `1px solid ${cfg.border}` }}
            >
              <span className="material-symbols-outlined text-[32px]" style={{ color: cfg.color }}>
                {cfg.icon}
              </span>
            </div>
            <div>
              <p className="text-label-mono text-on-surface-variant uppercase tracking-widest mb-1" style={{ fontSize: "11px" }}>
                Final Verdict
              </p>
              <h2
                className="text-headline-md font-bold tracking-tight"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </h2>
            </div>
          </div>

          {/* Right: risk score + confidence */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div
                className="text-headline-lg font-bold"
                style={{ color: riskCfg.text }}
              >
                {riskScore}
              </div>
              <div className="text-label-mono text-on-surface-variant" style={{ fontSize: "10px" }}>
                {riskCfg.label}
              </div>
            </div>
            <div
              className="w-[1px] h-10 self-center"
              style={{ backgroundColor: "#2d2d30" }}
            />
            <div className="text-center">
              <div className="text-headline-lg font-bold text-on-surface">
                {confidence}%
              </div>
              <div className="text-label-mono text-on-surface-variant" style={{ fontSize: "10px" }}>
                CONFIDENCE
              </div>
            </div>
          </div>
        </div>

        {/* Rationale */}
        <p className="text-body-md text-on-surface-variant leading-relaxed mb-6">
          {rationale}
        </p>

        {/* Finding counts */}
        {(criticalCount > 0 || highCount > 0) && (
          <div className="flex flex-wrap gap-sm mb-6">
            {criticalCount > 0 && (
              <span
                className="inline-flex items-center gap-1 px-3 py-1 rounded border text-label-mono"
                style={{ backgroundColor: "rgba(147,0,10,0.15)", borderColor: "rgba(255,180,171,0.3)", color: "#ffdad6", fontSize: "11px" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-error" />
                {criticalCount} Critical
              </span>
            )}
            {highCount > 0 && (
              <span
                className="inline-flex items-center gap-1 px-3 py-1 rounded border text-label-mono"
                style={{ backgroundColor: "rgba(255,180,171,0.05)", borderColor: "rgba(255,180,171,0.2)", color: "#ffb4ab", fontSize: "11px" }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#ffb4ab" }} />
                {highCount} High
              </span>
            )}
          </div>
        )}

        {/* Conditions */}
        {conditions.length > 0 && (
          <div>
            <h3 className="text-label-mono text-on-surface-variant uppercase tracking-wider mb-3" style={{ fontSize: "11px" }}>
              Required Conditions
            </h3>
            <div className="flex flex-col gap-2">
              {conditions.map((condition, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3 rounded"
                  style={{ backgroundColor: "rgba(255,185,95,0.04)", border: "1px solid rgba(255,185,95,0.15)" }}
                >
                  <span
                    className="text-label-mono shrink-0 mt-0.5"
                    style={{ color: "#ffb95f", fontSize: "11px" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-code-sm text-on-surface-variant">
                    {condition}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safer Alternative — from Judge agent */}
        {saferAlternative && (
          <div
            className="flex gap-3 px-4 py-3 rounded mt-2"
            style={{ backgroundColor: "rgba(0,240,255,0.04)", border: "1px solid rgba(0,240,255,0.15)" }}
          >
            <span className="material-symbols-outlined text-primary-container shrink-0 mt-0.5" style={{ fontSize: "16px" }}>
              tips_and_updates
            </span>
            <div>
              <p className="text-label-mono text-primary-container uppercase tracking-wider mb-1" style={{ fontSize: "10px" }}>
                Safer Alternative
              </p>
              <p className="text-code-sm text-on-surface-variant">{saferAlternative}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
