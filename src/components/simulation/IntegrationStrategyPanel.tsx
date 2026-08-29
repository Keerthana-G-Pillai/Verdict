import type { IntegrationStep } from "@/lib/simulation/types";

interface IntegrationStrategyProps {
  steps: IntegrationStep[];
}

const PRIORITY_CONFIG = {
  required:    { label: "REQUIRED",    color: "#ffb4ab", bg: "rgba(255,180,171,0.08)", border: "rgba(255,180,171,0.2)" },
  recommended: { label: "RECOMMENDED", color: "#ffb95f", bg: "rgba(255,185,95,0.06)",  border: "rgba(255,185,95,0.18)" },
  optional:    { label: "OPTIONAL",    color: "#849495", bg: "rgba(132,148,149,0.04)", border: "rgba(132,148,149,0.15)" },
};

export default function IntegrationStrategyPanel({ steps }: IntegrationStrategyProps) {
  return (
    <div>
      <div className="flex items-center gap-sm mb-lg">
        <span className="material-symbols-outlined text-primary-container text-[18px]">
          route
        </span>
        <h3 className="text-headline-md text-on-surface">Safe Integration Strategy</h3>
      </div>

      <div className="flex flex-col gap-sm">
        {steps.map((step) => {
          const priorityCfg = PRIORITY_CONFIG[step.priority];
          return (
            <div
              key={step.order}
              className="flex items-start gap-md px-4 py-4 rounded-lg"
              style={{ backgroundColor: "#141416", border: "1px solid #2d2d30" }}
            >
              {/* Step number */}
              <div
                className="w-8 h-8 rounded flex items-center justify-center shrink-0 text-label-mono font-bold"
                style={{
                  backgroundColor: priorityCfg.bg,
                  border: `1px solid ${priorityCfg.border}`,
                  color: priorityCfg.color,
                  fontSize: "12px",
                }}
              >
                {String(step.order).padStart(2, "0")}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-sm mb-1 flex-wrap">
                  <span className="text-body-md font-semibold text-on-surface">{step.action}</span>
                  <span
                    className="text-label-mono px-1.5 py-0.5 rounded border shrink-0"
                    style={{
                      fontSize: "9px",
                      letterSpacing: "0.06em",
                      color: priorityCfg.color,
                      borderColor: priorityCfg.border,
                      backgroundColor: priorityCfg.bg,
                    }}
                  >
                    {priorityCfg.label}
                  </span>
                </div>
                <p className="text-code-sm text-on-surface-variant">{step.rationale}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
