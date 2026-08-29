"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import RiskBadge from "@/components/ui/RiskBadge";
import { useAnalysisStore } from "@/store/analysis-store";
import type { VerdictOutcome } from "@/lib/analysis/types";
import type { IntegrationVerdictOutcome } from "@/lib/simulation/types";
import type { RiskLevel } from "@/types";

const VERDICT_CONFIG: Record<VerdictOutcome, { label: string; color: string; icon: string }> = {
  approved:                  { label: "Approved",    color: "#6ffbbe", icon: "check_circle" },
  approved_with_conditions:  { label: "Conditions",  color: "#ffb95f", icon: "rule" },
  requires_revision:         { label: "Revision",    color: "#ffb4ab", icon: "edit_note" },
  rejected:                  { label: "Rejected",    color: "#ffb4ab", icon: "cancel" },
};

const SIM_VERDICT_CONFIG: Record<IntegrationVerdictOutcome, { label: string; color: string; icon: string }> = {
  safe_to_integrate:        { label: "Safe",         color: "#6ffbbe", icon: "check_circle" },
  approved_with_conditions: { label: "Conditions",   color: "#ffb95f", icon: "rule" },
  conflict_detected:        { label: "Conflict",     color: "#ffb4ab", icon: "error" },
  requires_revision:        { label: "Revision",     color: "#ffb4ab", icon: "edit_note" },
};

function scoreToLevel(score: number): RiskLevel {
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

type RecordType = "all" | "analysis" | "simulation";

export default function MemoryPage() {
  const memory = useAnalysisStore((s) => s.memory);
  const simulationMemory = useAnalysisStore((s) => s.simulationMemory);

  const [search, setSearch] = useState("");
  const [recordType, setRecordType] = useState<RecordType>("all");
  const totalRecords = memory.length + simulationMemory.length;

  // Filtered + searched analyses
  const filteredAnalyses = useMemo(() => {
    if (recordType === "simulation") return [];
    const q = search.toLowerCase().trim();
    return memory.filter((r) =>
      !q ||
      r.title.toLowerCase().includes(q) ||
      r.verdictRationale.toLowerCase().includes(q) ||
      r.changeType.toLowerCase().includes(q)
    );
  }, [memory, search, recordType]);

  // Filtered + searched simulations
  const filteredSims = useMemo(() => {
    if (recordType === "analysis") return [];
    const q = search.toLowerCase().trim();
    return simulationMemory.filter((r) =>
      !q ||
      r.titleA.toLowerCase().includes(q) ||
      r.titleB.toLowerCase().includes(q) ||
      r.verdictRationale.toLowerCase().includes(q)
    );
  }, [simulationMemory, search, recordType]);

  const totalFiltered = filteredAnalyses.length + filteredSims.length;

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-h-screen pt-lg px-margin-desktop pb-xl">
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-xl gap-4">
          <div>
            <h1 className="text-display-lg font-bold text-on-surface tracking-tight">Engineering Memory</h1>
            <p className="text-body-lg text-on-surface-variant mt-sm">
              {totalRecords > 0
                ? `${totalRecords} ${totalRecords === 1 ? "record" : "records"} saved to organizational knowledge`
                : "Every saved analysis becomes part of your team's institutional knowledge."}
            </p>
          </div>
          <div className="flex items-center gap-sm">
            <Link href="/analyze" className="inline-flex items-center gap-sm px-4 py-2 bg-primary-container text-on-primary-fixed-variant text-label-mono rounded hover:bg-primary-fixed-dim transition-colors">
              <span className="material-symbols-outlined text-[16px]">add</span>
              New Analysis
            </Link>
            <Link href="/simulations" className="inline-flex items-center gap-sm px-4 py-2 border border-outline-variant text-on-surface-variant text-label-mono rounded hover:border-primary-fixed-dim hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-[16px]">science</span>
              New Simulation
            </Link>
          </div>
        </header>

        {totalRecords === 0 ? (
          <div className="card p-16 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-on-surface-variant mb-4" style={{ fontSize: "48px" }}>history</span>
            <h2 className="text-headline-md text-on-surface mb-2">No analyses saved yet</h2>
            <p className="text-body-md text-on-surface-variant mb-6 max-w-sm">
              Run your first analysis and click &ldquo;Save to Engineering Memory&rdquo; to build your knowledge base.
            </p>
            <Link href="/analyze" className="inline-flex items-center gap-sm px-6 py-2.5 bg-primary-container text-on-primary-fixed-variant text-label-mono rounded hover:bg-primary-fixed-dim transition-colors">
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>
              Analyze a Change
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-xl">
            {/* Search + filter toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-sm flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px] pointer-events-none">search</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search memory…"
                  className="input-base w-full pl-9 pr-3 py-2 text-body-md"
                />
              </div>

              <div className="flex items-center gap-sm">
                {(["all", "analysis", "simulation"] as RecordType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setRecordType(t)}
                    className="text-label-mono px-3 py-1.5 rounded border transition-colors"
                    style={
                      recordType === t
                        ? { color: "#00f0ff", borderColor: "rgba(0,240,255,0.4)", backgroundColor: "rgba(0,240,255,0.08)" }
                        : { color: "#57606a", borderColor: "#2d2d30", backgroundColor: "transparent" }
                    }
                  >
                    {t === "all" ? "All" : t === "analysis" ? "Analyses" : "Simulations"}
                    <span className="ml-1.5 opacity-60">
                      {t === "all" ? totalRecords : t === "analysis" ? memory.length : simulationMemory.length}
                    </span>
                  </button>
                ))}
              </div>

              {search && (
                <span className="text-label-mono text-on-surface-variant ml-auto">
                  {totalFiltered} result{totalFiltered !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Change Analyses */}
            {recordType !== "simulation" && filteredAnalyses.length > 0 && (
              <div>
                <div className="flex items-center gap-sm mb-md">
                  <span className="material-symbols-outlined text-[16px] text-primary-container">analytics</span>
                  <h2 className="text-headline-md text-on-surface">Change Analyses</h2>
                  <span className="text-label-mono text-on-surface-variant ml-1">({filteredAnalyses.length})</span>
                </div>
                <div className="flex flex-col gap-md">
                  {filteredAnalyses.map((record) => {
                    const vCfg = VERDICT_CONFIG[record.verdict];
                    return (
                      <Link key={record.id} href={`/analyze/${record.id}`}
                        className="card p-lg hover:bg-surface-container-high transition-colors group">
                        <div className="flex items-start justify-between gap-md">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-sm mb-2 flex-wrap">
                              <span className="text-label-mono px-2 py-0.5 rounded border uppercase tracking-wider"
                                style={{ color: "#7df4ff", borderColor: "rgba(0,240,255,0.2)", backgroundColor: "rgba(0,240,255,0.06)", fontSize: "11px" }}>
                                {record.changeType}
                              </span>
                              <RiskBadge level={scoreToLevel(record.riskScore)} />
                            </div>
                            <h3 className="text-body-lg font-semibold text-on-surface truncate group-hover:text-primary-fixed transition-colors">
                              {record.title}
                            </h3>
                            <p className="text-body-md text-on-surface-variant mt-1 line-clamp-2">{record.verdictRationale}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px]" style={{ color: vCfg.color }}>{vCfg.icon}</span>
                              <span className="text-label-mono" style={{ color: vCfg.color }}>{vCfg.label}</span>
                            </div>
                            <div className="text-headline-md font-bold"
                              style={{ color: record.riskScore >= 60 ? "#ffb4ab" : record.riskScore >= 35 ? "#ffb95f" : "#6ffbbe" }}>
                              {record.riskScore}
                            </div>
                            <span className="text-label-mono text-on-surface-variant" style={{ fontSize: "10px" }}>
                              {new Date(record.savedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Simulations */}
            {recordType !== "analysis" && filteredSims.length > 0 && (
              <div>
                <div className="flex items-center gap-sm mb-md">
                  <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">science</span>
                  <h2 className="text-headline-md text-on-surface">Merge Simulations</h2>
                  <span className="text-label-mono text-on-surface-variant ml-1">({filteredSims.length})</span>
                </div>
                <div className="flex flex-col gap-md">
                  {filteredSims.map((record) => {
                    const vCfg = SIM_VERDICT_CONFIG[record.verdict];
                    return (
                      <Link key={record.id} href={`/simulations/${record.id}`}
                        className="card p-lg hover:bg-surface-container-high transition-colors group">
                        <div className="flex items-start justify-between gap-md">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-sm mb-2 flex-wrap">
                              <span className="text-label-mono px-2 py-0.5 rounded border uppercase tracking-wider"
                                style={{ color: "#6ffbbe", borderColor: "rgba(111,251,190,0.2)", backgroundColor: "rgba(111,251,190,0.06)", fontSize: "11px" }}>
                                MERGE SIM
                              </span>
                              {record.criticalConflictCount > 0 && (
                                <span className="text-label-mono px-2 py-0.5 rounded border"
                                  style={{ color: "#ffb4ab", borderColor: "rgba(255,180,171,0.2)", backgroundColor: "rgba(255,180,171,0.05)", fontSize: "11px" }}>
                                  {record.criticalConflictCount} Critical
                                </span>
                              )}
                            </div>
                            <h3 className="text-body-lg font-semibold text-on-surface group-hover:text-primary-fixed transition-colors">
                              {record.titleA} <span className="text-on-surface-variant mx-1">↔</span> {record.titleB}
                            </h3>
                            <p className="text-body-md text-on-surface-variant mt-1 line-clamp-2">{record.verdictRationale}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px]" style={{ color: vCfg.color }}>{vCfg.icon}</span>
                              <span className="text-label-mono" style={{ color: vCfg.color }}>{vCfg.label}</span>
                            </div>
                            <div className="text-headline-md font-bold"
                              style={{ color: record.integrationRiskScore >= 60 ? "#ffb4ab" : record.integrationRiskScore >= 35 ? "#ffb95f" : "#6ffbbe" }}>
                              {record.integrationRiskScore}
                            </div>
                            <span className="text-label-mono text-on-surface-variant" style={{ fontSize: "10px" }}>
                              {new Date(record.savedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No results state */}
            {search && totalFiltered === 0 && (
              <div className="card p-12 flex flex-col items-center text-center">
                <span className="material-symbols-outlined text-on-surface-variant mb-3" style={{ fontSize: "36px" }}>search_off</span>
                <p className="text-body-md text-on-surface-variant">No records match &ldquo;{search}&rdquo;</p>
                <button
                  onClick={() => setSearch("")}
                  className="mt-4 text-label-mono text-primary-container hover:underline"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
