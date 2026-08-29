import type { IntegrationVerdictOutcome } from "@/lib/simulation/types";

interface IntegrationVerdictCardProps {
  verdict: IntegrationVerdictOutcome;
  integrationRiskScore: number;
  confidence: number;
  rationale: string;
  conflictCount: number;
  criticalConflictCount: number;
  directConflictCount: number;
  semanticConflictCount: number;
}

const VERDICT_CONFIG: Record<
  IntegrationVerdictOutcome,
  { label: string; icon: string; color: string; bg: string; border: string; glow: string }
> = {
  safe_to_integrate: {
    label: "SAFE TO INTEGRATE",
    icon: "check_circle",
    color: "#6ffbbe",
    bg: "rgba(79,222,163,0.06)",
    border: "rgba(111,251,190,0.3)",
    glow: "0 0 24px rgba(79,222,163,0.15)",
  },
  approved_with_conditions: {
    label: "APPROVED WITH CONDITIONS",
    icon: "rule",
    color: "#ffb95f",
    bg: "rgba(255,185,95,0.06)",
    border: "rgba(255,185,95,0.3)",
    glow: "0 0 24px rgba(255,185,95,0.15)",
  },
  conflict_detected: {
    label: "CONFLICT DETECTED",
    icon: "error",
    color: "#ffb4ab",
    bg: "rgba(147,0,10,0.12)",
    border: "rgba(255,180,171,0.35)",
    glow: "0 0 24px rgba(147,0,10,0.2)",
  },
  requires_revision: {
    label: "REQUIRES REVISION",
    icon: "edit_note",
    color: "#ffb4ab",
    bg: "rgba(255,180,171,0.06)",
    border: "rgba(255,180,171,0.3)",
    glow: "0 0 20px rgba(255,180,171,0.12)",
  },
};

const RISK_COLOR = (score: number) => {
  if (score >= 70) return { text: "#ffb4ab", label: "CRITICAL RISK" };
  if (score >= 40) return { text: "#ffb95f", label: "HIGH RISK" };
  if (score >= 20) return { text: "#ffb95f", label: "MEDIUM RISK" };
  return { text: "#6ffbbe", label: "LOW RISK" };
};

export default function IntegrationVerdictCard({
  verdict,
  integrationRiskScore,
  confidence,
  rationale,
  conflictCount,
  criticalConflictCount,
  directConflictCount,
  semanticConflictCount,
}: IntegrationVerdictCardProps) {
  const cfg = VERDICT_CONFIG[verdict];
  const riskCfg = RISK_COLOR(integrationRiskScore);
  const isConflict = verdict === "conflict_detected";

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, boxShadow: cfg.glow }}
    >
      {/* Accent top line */}
      <div className="h-[3px]" style={{ backgroundColor: cfg.color }} />

      <div className="p-8">
        {/* Header row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
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
                Integration Verdict
              </p>
              <h2 className="text-headline-md font-bold tracking-tight" style={{ color: cfg.color }}>
                {cfg.label}
              </h2>
            </div>
          </div>

          {/* Risk + confidence scores */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-headline-lg font-bold" style={{ color: riskCfg.text }}>
                {integrationRiskScore}
              </div>
              <div className="text-label-mono text-on-surface-variant" style={{ fontSize: "10px" }}>
                {riskCfg.label}
              </div>
            </div>
            <div className="w-[1px] h-10 self-center" style={{ backgroundColor: "#2d2d30" }} />
            <div className="text-center">
              <div className="text-headline-lg font-bold text-on-surface">{confidence}%</div>
              <div className="text-label-mono text-on-surface-variant" style={{ fontSize: "10px" }}>CONFIDENCE</div>
            </div>
          </div>
        </div>

        {/* Rationale */}
        <p className="text-body-md text-on-surface-variant leading-relaxed mb-6">{rationale}</p>

        {/* Conflict count breakdown */}
        {conflictCount > 0 && (
          <div className="flex flex-wrap gap-sm mb-6">
            {criticalConflictCount > 0 && (
              <span
                className="inline-flex items-center gap-1 px-3 py-1 rounded border text-label-mono"
                style={{ backgroundColor: "rgba(147,0,10,0.15)", borderColor: "rgba(255,180,171,0.3)", color: "#ffdad6", fontSize: "11px" }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#ffb4ab" }} />
                {criticalConflictCount} Critical
              </span>
            )}
            {directConflictCount > 0 && (
              <span
                className="inline-flex items-center gap-1 px-3 py-1 rounded border text-label-mono"
                style={{ backgroundColor: "rgba(255,180,171,0.05)", borderColor: "rgba(255,180,171,0.2)", color: "#ffb4ab", fontSize: "11px" }}
              >
                <span className="material-symbols-outlined text-[12px]">compare_arrows</span>
                {directConflictCount} Direct
              </span>
            )}
            {semanticConflictCount > 0 && (
              <span
                className="inline-flex items-center gap-1 px-3 py-1 rounded border text-label-mono"
                style={{ backgroundColor: "rgba(255,185,95,0.05)", borderColor: "rgba(255,185,95,0.2)", color: "#ffb95f", fontSize: "11px" }}
              >
                <span className="material-symbols-outlined text-[12px]">psychology</span>
                {semanticConflictCount} Semantic
              </span>
            )}
          </div>
        )}

        {/* Signature moment: Git sees no conflict. VERDICT found one. */}
        {isConflict && semanticConflictCount > 0 && (
          <div
            className="px-5 py-4 rounded-lg mt-2"
            style={{ backgroundColor: "rgba(147,0,10,0.1)", border: "1px solid rgba(255,180,171,0.25)" }}
          >
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-error shrink-0 mt-0.5" style={{ fontSize: "20px" }}>
                psychology_alt
              </span>
              <div>
                <p className="text-body-md text-on-surface-variant mb-1">
                  <span className="text-on-surface font-medium">Git sees no conflict.</span>
                </p>
                <p className="text-body-md font-bold" style={{ color: "#ffb4ab" }}>
                  VERDICT found one.
                </p>
                <p className="text-code-sm text-on-surface-variant mt-2">
                  These changes merge cleanly at the file level. VERDICT detected {semanticConflictCount} semantic conflict{semanticConflictCount !== 1 ? "s" : ""} — incompatible behavioral assumptions that only manifest at runtime.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
