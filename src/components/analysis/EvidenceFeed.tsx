import type { AnalysisEvent } from "@/lib/analysis/types";

interface EvidenceFeedProps {
  events: AnalysisEvent[];
}

const EVENT_ICONS = {
  info:    { icon: "arrow_right", color: "#b9cacb" },
  warning: { icon: "warning",     color: "#ffb95f" },
  error:   { icon: "error",       color: "#ffb4ab" },
  success: { icon: "check_circle", color: "#6ffbbe" },
};

export default function EvidenceFeed({ events }: EvidenceFeedProps) {
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-label-mono text-on-surface-variant">
        Waiting for analysis to begin…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 custom-scrollbar max-h-[360px] overflow-y-auto">
      {events.map((event, i) => {
        const conf = EVENT_ICONS[event.type];
        const isLatest = i === events.length - 1;

        return (
          <div
            key={event.id}
            className="flex items-start gap-sm py-1 px-sm rounded transition-all duration-200"
            style={{
              opacity: isLatest ? 1 : 0.75,
              backgroundColor: isLatest ? "rgba(32,31,32,0.4)" : "transparent",
            }}
          >
            <span
              className="material-symbols-outlined shrink-0 mt-0.5"
              style={{ fontSize: "14px", color: conf.color }}
            >
              {conf.icon}
            </span>
            <div className="flex-1 min-w-0">
              <span
                className="text-code-sm"
                style={{ color: event.type === "error" ? "#ffb4ab" : event.type === "warning" ? "#ffb95f" : "#e5e2e3" }}
              >
                {event.message}
              </span>
              {event.detail && (
                <span className="block text-label-mono text-on-surface-variant mt-0.5">
                  {event.detail}
                </span>
              )}
            </div>
            <span className="text-label-mono text-on-surface-variant shrink-0" style={{ fontSize: "10px" }}>
              {formatRelativeTime(event.timestamp)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function formatRelativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  if (diffMs < 1000) return "now";
  if (diffMs < 60000) return `${Math.floor(diffMs / 1000)}s`;
  return `${Math.floor(diffMs / 60000)}m`;
}
