import type { EvidenceItem } from "@/lib/analysis/types";

interface EvidencePanelProps {
  items: EvidenceItem[];
}

const CATEGORY_CONFIG = {
  static_analysis: { label: "STATIC ANALYSIS", color: "#7df4ff", icon: "code_blocks" },
  inferred_risk:   { label: "INFERRED RISK",    color: "#ffb95f", icon: "psychology" },
  validation_available: { label: "VALIDATION AVAILABLE", color: "#6ffbbe", icon: "verified" },
  execution_evidence:   { label: "EXECUTION EVIDENCE",   color: "#6ffbbe", icon: "play_circle" },
  context:              { label: "CONTEXT",               color: "#b9cacb", icon: "info" },
};

const WEIGHT_CONFIG = {
  supporting: { icon: "arrow_upward",   color: "#6ffbbe" },
  against:    { icon: "arrow_downward", color: "#ffb4ab" },
  neutral:    { icon: "remove",         color: "#849495" },
};

// Notice banner explaining evidence types
function EvidenceTypesNotice() {
  return (
    <div
      className="flex gap-sm px-4 py-3 rounded mb-lg"
      style={{ backgroundColor: "rgba(0,240,255,0.04)", border: "1px solid rgba(0,240,255,0.12)" }}
    >
      <span className="material-symbols-outlined text-primary-fixed-dim shrink-0 mt-0.5" style={{ fontSize: "16px" }}>
        info
      </span>
      <div>
        <p className="text-code-sm text-on-surface-variant">
          Evidence categories distinguish what was actually observed vs. inferred. No code was executed in this analysis.
          All findings are based on <strong className="text-on-surface">static analysis</strong> and{" "}
          <strong className="text-on-surface">pattern inference</strong>.
        </p>
      </div>
    </div>
  );
}

export default function EvidencePanel({ items }: EvidencePanelProps) {
  // Group by category
  const groups: Record<string, EvidenceItem[]> = {};
  for (const item of items) {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  }

  const categoryOrder: EvidenceItem["category"][] = [
    "context", "static_analysis", "inferred_risk", "validation_available", "execution_evidence",
  ];

  return (
    <div className="flex flex-col gap-lg">
      <EvidenceTypesNotice />

      {categoryOrder.map((cat) => {
        const groupItems = groups[cat];
        if (!groupItems || groupItems.length === 0) return null;
        const cfg = CATEGORY_CONFIG[cat];

        return (
          <div key={cat}>
            <div className="flex items-center gap-sm mb-md">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "16px", color: cfg.color }}
              >
                {cfg.icon}
              </span>
              <h3
                className="text-label-mono uppercase tracking-wider"
                style={{ color: cfg.color, fontSize: "11px" }}
              >
                {cfg.label}
              </h3>
              <div className="flex-1 h-[1px]" style={{ backgroundColor: "#2d2d30" }} />
              <span className="text-label-mono text-on-surface-variant" style={{ fontSize: "10px" }}>
                {groupItems.length} item{groupItems.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex flex-col gap-sm">
              {groupItems.map((item) => {
                const wCfg = WEIGHT_CONFIG[item.weight];
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-md px-4 py-3 rounded"
                    style={{ backgroundColor: "#141416", border: "1px solid #2d2d30" }}
                  >
                    <span
                      className="material-symbols-outlined shrink-0 mt-0.5"
                      style={{ fontSize: "16px", color: wCfg.color }}
                    >
                      {wCfg.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-md text-on-surface font-medium">{item.label}</p>
                      <p className="text-code-sm text-on-surface-variant mt-0.5">{item.detail}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-label-mono text-on-surface-variant" style={{ fontSize: "10px" }}>
                        {item.confidence}% confidence
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
