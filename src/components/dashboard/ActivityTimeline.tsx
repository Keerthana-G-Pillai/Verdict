import type { ActivityEvent } from "@/types";

const eventTypeConfig = {
  analyzing: { dot: "w-2 h-2 rounded-full bg-primary-fixed animate-pulse", icon: null },
  mapping:   { dot: null, icon: "sync" },
  completed: { dot: null, icon: "check" },
  approved:  { dot: null, icon: "fact_check" },
  failed:    { dot: null, icon: "cancel" },
  simulating:{ dot: null, icon: "science" },
};

const iconColors = {
  analyzing: "#7df4ff",
  mapping:   "#ffb95f",
  completed: "#6ffbbe",
  approved:  "#7df4ff",
  failed:    "#ffb4ab",
  simulating:"#ffb95f",
};

interface ActivityTimelineProps {
  events: ActivityEvent[];
}

export default function ActivityTimeline({ events }: ActivityTimelineProps) {
  return (
    <div className="card p-lg flex flex-col h-[500px]">
      <h2 className="text-headline-md text-on-surface mb-lg flex items-center gap-sm">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-fixed" />
        </span>
        Live Activity
      </h2>

      <div className="flex-1 overflow-y-auto pr-sm custom-scrollbar relative">
        {/* Timeline vertical line */}
        <div
          className="absolute left-[11px] top-2 bottom-2 w-[1px]"
          style={{ backgroundColor: "#2d2d30" }}
        />

        <div className="flex flex-col gap-lg relative">
          {events.map((event) => {
            const typeConf = eventTypeConfig[event.type];
            const color = iconColors[event.type];

            return (
              <div key={event.id} className="flex gap-md relative z-10">
                {/* Node */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 border-2"
                  style={{
                    backgroundColor: "var(--color-surface-container-lowest)",
                    borderColor: "#2d2d30",
                  }}
                >
                  {typeConf.dot ? (
                    <span className={typeConf.dot} />
                  ) : (
                    <span
                      className="material-symbols-outlined text-[12px]"
                      style={{ color }}
                    >
                      {typeConf.icon}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div>
                  <p className="text-on-surface text-body-md">{event.message}</p>
                  <span className="text-label-mono text-on-surface-variant" style={{ fontSize: "10px" }}>
                    {event.timestamp}
                    {event.meta && ` • ${event.meta}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
