import type { PipelineStage } from "@/lib/analysis/types";

interface AnalysisPipelineProps {
  stages: PipelineStage[];
  currentStageId?: string;
}

const STATUS_STYLES = {
  waiting: {
    ring: "border-[#2d2d30]",
    icon: "text-on-surface-variant",
    label: "text-on-surface-variant",
    dot: null,
  },
  running: {
    ring: "border-primary-container",
    icon: "text-primary-container",
    label: "text-primary-container",
    dot: "animate-pulse bg-primary-container",
  },
  complete: {
    ring: "border-secondary-fixed",
    icon: "text-secondary-fixed",
    label: "text-on-surface",
    dot: "bg-secondary-fixed",
  },
  warning: {
    ring: "border-tertiary-fixed-dim",
    icon: "text-tertiary-fixed-dim",
    label: "text-on-surface",
    dot: "bg-tertiary-fixed-dim",
  },
  failed: {
    ring: "border-error",
    icon: "text-error",
    label: "text-error",
    dot: "bg-error",
  },
};

const STATUS_ICONS = {
  waiting: null,
  running: null,
  complete: "check",
  warning: "warning",
  failed: "close",
};

export default function AnalysisPipeline({ stages }: AnalysisPipelineProps) {
  return (
    <div className="flex flex-col gap-0">
      {stages.map((stage, i) => {
        const style = STATUS_STYLES[stage.status];
        const overrideIcon = STATUS_ICONS[stage.status];
        const isLast = i === stages.length - 1;

        return (
          <div key={stage.id} className="flex gap-md">
            {/* Left column: icon + connector line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${style.ring}`}
                style={
                  stage.status === "running"
                    ? { boxShadow: "0 0 12px rgba(0,240,255,0.3)" }
                    : stage.status === "complete"
                    ? { boxShadow: "0 0 8px rgba(111,251,190,0.15)" }
                    : undefined
                }
              >
                {stage.status === "running" ? (
                  <span
                    className={`material-symbols-outlined text-[18px] ${style.icon}`}
                    style={{ animation: "spin 2s linear infinite" }}
                  >
                    {stage.icon}
                  </span>
                ) : overrideIcon ? (
                  <span className={`material-symbols-outlined text-[18px] ${style.icon}`}>
                    {overrideIcon}
                  </span>
                ) : (
                  <span className={`material-symbols-outlined text-[18px] ${style.icon}`}>
                    {stage.icon}
                  </span>
                )}
              </div>

              {/* Vertical connector line */}
              {!isLast && (
                <div
                  className="w-[1px] flex-1 my-1 min-h-[24px]"
                  style={{
                    backgroundColor:
                      stage.status === "complete" || stage.status === "warning"
                        ? "#3b494b"
                        : "#2d2d30",
                  }}
                />
              )}
            </div>

            {/* Right column: label + summary */}
            <div className="pb-6 flex-1 min-w-0">
              <div className="flex items-center gap-sm pt-2">
                <span className={`text-body-md font-semibold transition-colors duration-300 ${style.label}`}>
                  {stage.label}
                </span>
                {style.dot && (
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`}
                  />
                )}
                {stage.status === "running" && (
                  <span className="text-label-mono text-primary-container animate-pulse">
                    Running…
                  </span>
                )}
              </div>

              {stage.summary && (
                <p className="text-label-mono text-on-surface-variant mt-0.5">
                  {stage.summary}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Inject spin keyframe
if (typeof document !== "undefined") {
  const style = document.getElementById("verdict-pipeline-styles");
  if (!style) {
    const el = document.createElement("style");
    el.id = "verdict-pipeline-styles";
    el.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
    document.head.appendChild(el);
  }
}
