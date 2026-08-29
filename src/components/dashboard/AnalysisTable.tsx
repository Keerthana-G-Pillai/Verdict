import Link from "next/link";
import type { AnalysisRecord } from "@/types";
import RiskBadge from "@/components/ui/RiskBadge";
import StatusIndicator from "@/components/ui/StatusIndicator";

interface AnalysisTableProps {
  records: AnalysisRecord[];
  viewAllHref?: string;
}

const changeTypeLabels: Record<string, string> = {
  code: "Code",
  diff: "Diff",
  pr: "PR",
  decision: "Decision",
  config: "Config",
  migration: "Migration",
  merge: "Merge",
};

export default function AnalysisTable({ records, viewAllHref = "/analyses" }: AnalysisTableProps) {
  return (
    <div className="card p-lg flex flex-col h-[500px]">
      <div className="flex justify-between items-center mb-lg">
        <h2 className="text-headline-md text-on-surface">Recent Analyses</h2>
        <Link
          href={viewAllHref}
          className="text-primary-fixed hover:text-primary-fixed-dim text-label-mono flex items-center gap-xs transition-colors"
        >
          View All
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>

      <div
        className="flex-1 overflow-auto rounded custom-scrollbar"
        style={{ border: "1px solid #2d2d30" }}
      >
        <table className="w-full text-left border-collapse">
          <thead
            className="sticky top-0 z-10"
            style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
          >
            <tr>
              {["Name", "Type", "Risk Level", "Status", "Time"].map((col, i) => (
                <th
                  key={col}
                  className="py-sm px-md text-label-mono text-on-surface-variant font-normal"
                  style={{
                    borderBottom: "1px solid #2d2d30",
                    textAlign: i === 4 ? "right" : "left",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-code-sm">
            {records.map((record) => (
              <tr
                key={record.id}
                className="transition-colors cursor-pointer hover:bg-surface-container-highest/30"
                style={{ borderBottom: "1px solid rgba(45,45,48,0.5)" }}
              >
                <td className="py-md px-md text-on-surface">{record.name}</td>
                <td className="py-md px-md text-on-surface-variant">
                  {changeTypeLabels[record.type] ?? record.type}
                </td>
                <td className="py-md px-md">
                  <RiskBadge level={record.riskLevel} />
                </td>
                <td className="py-md px-md">
                  <StatusIndicator status={record.status} />
                </td>
                <td className="py-md px-md text-on-surface-variant text-right">
                  {record.timeAgo}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
