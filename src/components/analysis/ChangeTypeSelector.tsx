"use client";

import type { ChangeType } from "@/lib/analysis/types";

const CHANGE_TYPES: {
  id: ChangeType;
  label: string;
  sublabel: string;
  icon: string;
  placeholder: string;
  contentLabel: string;
  mono?: string;
}[] = [
  {
    id: "code",
    label: "Code Change",
    sublabel: "Snippet or implementation",
    icon: "code",
    placeholder: "Paste your code here…",
    contentLabel: "Code",
    mono: "CODE",
  },
  {
    id: "diff",
    label: "Code Diff",
    sublabel: "Git diff or patch",
    icon: "difference",
    placeholder: "Paste your diff here (unified diff format)…",
    contentLabel: "Diff",
    mono: "DIFF",
  },
  {
    id: "pr",
    label: "Pull Request",
    sublabel: "PR description + changes",
    icon: "merge_type",
    placeholder: "Paste your PR description and changed code…",
    contentLabel: "PR Content",
    mono: "PR",
  },
  {
    id: "decision",
    label: "Engineering Decision",
    sublabel: "Architecture or system design",
    icon: "architecture",
    placeholder: 'Describe the decision you want to validate…\n\nExamples:\n• "Should we migrate authentication from JWT to session-based?"\n• "Should we increase payment retries from 3 to 5?"\n• "Should we move this service from REST to event-driven?"',
    contentLabel: "Decision Description",
    mono: "DECISION",
  },
];

interface ChangeTypeSelectorProps {
  selected: ChangeType;
  onChange: (type: ChangeType) => void;
}

export default function ChangeTypeSelector({ selected, onChange }: ChangeTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-sm">
      {CHANGE_TYPES.map((type) => {
        const isActive = selected === type.id;
        return (
          <button
            key={type.id}
            onClick={() => onChange(type.id)}
            className={`relative flex flex-col items-start p-4 rounded-lg border transition-all duration-200 text-left group ${
              isActive
                ? "border-primary-container bg-surface-container"
                : "border-[#2d2d30] bg-[#141416] hover:border-outline hover:bg-surface-container"
            }`}
            style={
              isActive
                ? { boxShadow: "0 0 12px rgba(0,240,255,0.1)" }
                : undefined
            }
          >
            {/* Active indicator */}
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-lg bg-primary-container" />
            )}

            <span
              className="material-symbols-outlined mb-2 text-[22px]"
              style={{ color: isActive ? "#00f0ff" : "#849495" }}
            >
              {type.icon}
            </span>

            <span
              className="text-body-md font-semibold mb-0.5 block"
              style={{ color: isActive ? "#e5e2e3" : "#b9cacb" }}
            >
              {type.label}
            </span>
            <span
              className="text-label-mono block"
              style={{ color: isActive ? "#b9cacb" : "#849495", fontSize: "11px" }}
            >
              {type.sublabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export { CHANGE_TYPES };
