"use client";

import { useState, useMemo, useCallback } from "react";
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
type VerdictFilter = "all" | VerdictOutcome;
type DomainFilter = string; // "all" | detected domain string

const RISK_RANGE_OPTIONS: { label: string; min: number; max: number }[] = [
  { label: "All risk scores",   min: 0,   max: 100 },
  { label: "Low (0–34)",        min: 0,   max: 34  },
  { label: "Medium (35–59)",    min: 35,  max: 59  },
  { label: "High (60–100)",     min: 60,  max: 100 },
];

export default function MemoryPage() {
  const memory = useAnalysisStore((s) => s.memory);
  const simulationMemory = useAnalysisStore((s) => s.simulationMemory);
  const removeFromMemory = useAnalysisStore((s) => s.removeFromMemory);
  const removeSimulationFromMemory = useAnalysisStore((s) => s.removeSimulationFromMemory);

  const [search, setSearch] = useState("");
  const [recordType, setRecordType] = useState<RecordType>("all");
  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>("all");
  const [riskRangeIdx, setRiskRangeIdx] = useState(0);
  const [domainFilter, setDomainFilter] = useState<DomainFilter>("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const totalRecords = memory.length + simulationMemory.length;

  const handleDeleteAnalysis = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirmDelete === id) {
      removeFromMemory(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  }, [confirmDelete, removeFromMemory]);

  const handleDeleteSimulation = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirmDelete === id) {
      removeSimulationFromMemory(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  }, [confirmDelete, removeSimulationFromMemory]);

  // All unique domains from memory
  const allDomains = useMemo(() => {
    const domains = new Set<string>();
    memory.forEach((r) => {
      const domain = r.result?.context?.detectedDomain;
      if (domain && domain !== "general" && domain !== "") domains.add(domain);
    });
    return Array.from(domains).sort();
  }, [memory]);

  const riskRange = RISK_RANGE_OPTIONS[riskRangeIdx];

  // Date cutoff
  const dateCutoffMs = useMemo(() => {
    const now = Date.now();
    if (dateFilter === "7d")  return now - 7  * 24 * 60 * 60 * 1000;
    if (dateFilter === "30d") return now - 30 * 24 * 60 * 60 * 1000;
    if (dateFilter === "90d") return now - 90 * 24 * 60 * 60 * 1000;
    return 0;
  }, [dateFilter]);

  // Filtered + searched analyses
  const filteredAnalyses = useMemo(() => {
    if (recordType === "simulation") return [];
    const q = search.toLowerCase().trim();
    return memory.filter((r) => {
      if (q && !r.title.toLowerCase().includes(q) && !r.verdictRationale.toLowerCase().includes(q) && !r.changeType.toLowerCase().includes(q)) return false;
      if (verdictFilter !== "all" && r.verdict !== verdictFilter) return false;
      if (r.riskScore < riskRange.min || r.riskScore > riskRange.max) return false;
      if (domainFilter !== "all" && r.result?.context?.detectedDomain !== domainFilter) return false;
      if (dateCutoffMs > 0 && new Date(r.savedAt).getTime() < dateCutoffMs) return false;
      return true;
    });
  }, [memory, search, recordType, verdictFilter, riskRange, domainFilter, dateCutoffMs]);

  // Filtered + searched simulations
  const filteredSims = useMemo(() => {
    if (recordType === "analysis") return [];
    const q = search.toLowerCase().trim();
    return simulationMemory.filter((r) => {
      if (q && !r.titleA.toLowerCase().includes(q) && !r.titleB.toLowerCase().includes(q) && !r.verdictRationale.toLowerCase().includes(q)) return false;
      if (r.integrationRiskScore < riskRange.min || r.integrationRiskScore > riskRange.max) return false;
      if (dateCutoffMs > 0 && new Date(r.savedAt).getTime() < dateCutoffMs) return false;
      return true;
    });
  }, [simulationMemory, search, recordType, riskRange, dateCutoffMs]);

  const totalFiltered = filteredAnalyses.length + filteredSims.length;

  // ── Memory Insights ─────────────────────────────────────────
  const insights = useMemo(() => {
    if (memory.length === 0) return null;

    // Verdict distribution
    const verdictCounts: Record<VerdictOutcome, number> = {
      approved: 0, approved_with_conditions: 0, requires_revision: 0, rejected: 0,
    };
    memory.forEach((r) => { verdictCounts[r.verdict] = (verdictCounts[r.verdict] ?? 0) + 1; });

    // Domain frequency
    const domainCounts: Record<string, number> = {};
    memory.forEach((r) => {
      const d = r.result?.context?.detectedDomain || "general";
      domainCounts[d] = (domainCounts[d] ?? 0) + 1;
    });
    const topDomains = Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    // Average risk score
    const avgRisk = Math.round(memory.reduce((s, r) => s + r.riskScore, 0) / memory.length);

    // Approval rate
    const approvalCount = verdictCounts.approved + verdictCounts.approved_with_conditions;
    const approvalRate = Math.round((approvalCount / memory.length) * 100);

    return { verdictCounts, topDomains, avgRisk, approvalRate };
  }, [memory]);

  const hasActiveFilters = verdictFilter !== "all" || riskRangeIdx !== 0 || domainFilter !== "all" || dateFilter !== "all";

  const clearFilters = () => {
    setVerdictFilter("all");
    setRiskRangeIdx(0);
    setDomainFilter("all");
    setDateFilter("all");
    setSearch("");
  };

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-h-screen pt-lg px-margin-desktop pb-xl">
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-xl gap-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface tracking-tight">Engineering Memory</h1>
            <p className="text-body-md text-on-surface-variant mt-sm">
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

            {/* ── Memory Insights ── */}
            {insights && (
              <div className="card p-lg">
                <h2 className="text-headline-md text-on-surface mb-md flex items-center gap-sm">
                  <span className="material-symbols-outlined text-[18px] text-primary-container">insights</span>
                  Memory Insights
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                  {/* Approval rate */}
                  <div className="flex flex-col gap-1">
                    <span className="text-label-mono text-on-surface-variant uppercase tracking-wider" style={{ fontSize: "10px" }}>Approval Rate</span>
                    <div className="text-headline-md font-bold" style={{ color: insights.approvalRate >= 70 ? "#6ffbbe" : insights.approvalRate >= 40 ? "#ffb95f" : "#ffb4ab" }}>
                      {insights.approvalRate}%
                    </div>
                    <div className="progress-track mt-1">
                      <div className="h-full rounded-full" style={{ width: `${insights.approvalRate}%`, backgroundColor: insights.approvalRate >= 70 ? "#6ffbbe" : insights.approvalRate >= 40 ? "#ffb95f" : "#ffb4ab" }} />
                    </div>
                  </div>

                  {/* Avg risk score */}
                  <div className="flex flex-col gap-1">
                    <span className="text-label-mono text-on-surface-variant uppercase tracking-wider" style={{ fontSize: "10px" }}>Avg Risk Score</span>
                    <div className="text-headline-md font-bold" style={{ color: insights.avgRisk >= 60 ? "#ffb4ab" : insights.avgRisk >= 35 ? "#ffb95f" : "#6ffbbe" }}>
                      {insights.avgRisk}
                    </div>
                    <div className="progress-track mt-1">
                      <div className="h-full rounded-full" style={{ width: `${insights.avgRisk}%`, backgroundColor: insights.avgRisk >= 60 ? "#ffb4ab" : insights.avgRisk >= 35 ? "#ffb95f" : "#6ffbbe" }} />
                    </div>
                  </div>

                  {/* Top domains */}
                  <div className="flex flex-col gap-1">
                    <span className="text-label-mono text-on-surface-variant uppercase tracking-wider" style={{ fontSize: "10px" }}>Top Domains</span>
                    <div className="flex flex-col gap-1 mt-1">
                      {insights.topDomains.slice(0, 3).map(([domain, count]) => (
                        <div key={domain} className="flex items-center justify-between">
                          <span className="text-code-sm text-on-surface capitalize" style={{ fontSize: "11px" }}>{domain.replace(/-/g, " ")}</span>
                          <span className="text-label-mono text-on-surface-variant" style={{ fontSize: "10px" }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Verdict breakdown */}
                  <div className="flex flex-col gap-1">
                    <span className="text-label-mono text-on-surface-variant uppercase tracking-wider" style={{ fontSize: "10px" }}>Verdict Breakdown</span>
                    <div className="flex flex-col gap-1 mt-1">
                      {(Object.entries(insights.verdictCounts) as [VerdictOutcome, number][])
                        .filter(([, c]) => c > 0)
                        .map(([verdict, count]) => (
                          <div key={verdict} className="flex items-center justify-between">
                            <span className="text-label-mono" style={{ color: VERDICT_CONFIG[verdict].color, fontSize: "10px" }}>
                              {VERDICT_CONFIG[verdict].label}
                            </span>
                            <span className="text-label-mono text-on-surface-variant" style={{ fontSize: "10px" }}>{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Search + filter toolbar ── */}
            <div className="flex flex-col gap-sm">
              {/* Row 1: search + type + clear */}
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

                {(search || hasActiveFilters) && (
                  <button
                    onClick={clearFilters}
                    className="text-label-mono text-on-surface-variant hover:text-on-surface ml-auto transition-colors flex items-center gap-1"
                    style={{ fontSize: "11px" }}
                  >
                    <span className="material-symbols-outlined text-[13px]">close</span>
                    Clear filters
                  </button>
                )}
              </div>

              {/* Row 2: additional filters */}
              <div className="flex flex-wrap gap-sm">
                {/* Verdict filter — analyses only */}
                {recordType !== "simulation" && (
                  <select
                    value={verdictFilter}
                    onChange={(e) => setVerdictFilter(e.target.value as VerdictFilter)}
                    className="input-base px-3 py-1.5 text-label-mono"
                    style={{ fontSize: "11px" }}
                  >
                    <option value="all">All verdicts</option>
                    <option value="approved">Approved</option>
                    <option value="approved_with_conditions">Conditions</option>
                    <option value="requires_revision">Requires Revision</option>
                    <option value="rejected">Rejected</option>
                  </select>
                )}

                {/* Risk range */}
                <select
                  value={riskRangeIdx}
                  onChange={(e) => setRiskRangeIdx(Number(e.target.value))}
                  className="input-base px-3 py-1.5 text-label-mono"
                  style={{ fontSize: "11px" }}
                >
                  {RISK_RANGE_OPTIONS.map((opt, i) => (
                    <option key={opt.label} value={i}>{opt.label}</option>
                  ))}
                </select>

                {/* Domain filter */}
                {allDomains.length > 0 && recordType !== "simulation" && (
                  <select
                    value={domainFilter}
                    onChange={(e) => setDomainFilter(e.target.value)}
                    className="input-base px-3 py-1.5 text-label-mono"
                    style={{ fontSize: "11px" }}
                  >
                    <option value="all">All domains</option>
                    {allDomains.map((d) => (
                      <option key={d} value={d}>{d.replace(/-/g, " ")}</option>
                    ))}
                  </select>
                )}

                {/* Date range */}
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="input-base px-3 py-1.5 text-label-mono"
                  style={{ fontSize: "11px" }}
                >
                  <option value="all">Any time</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>

                {(search || hasActiveFilters) && (
                  <span className="text-label-mono text-on-surface-variant self-center" style={{ fontSize: "11px" }}>
                    {totalFiltered} result{totalFiltered !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* ── Change Analyses ── */}
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
                    const isConfirming = confirmDelete === record.id;
                    return (
                      <div key={record.id} className="relative group/row">
                        <Link href={`/analyze/${record.id}`}
                          className="card p-lg hover:bg-surface-container-high transition-colors block group">
                          <div className="flex items-start justify-between gap-md">
                            <div className="flex-1 min-w-0 pr-8">
                              <div className="flex items-center gap-sm mb-2 flex-wrap">
                                <span className="text-label-mono px-2 py-0.5 rounded border uppercase tracking-wider"
                                  style={{ color: "#7df4ff", borderColor: "rgba(0,240,255,0.2)", backgroundColor: "rgba(0,240,255,0.06)", fontSize: "11px" }}>
                                  {record.changeType}
                                </span>
                                <RiskBadge level={scoreToLevel(record.riskScore)} />
                                {record.result?.context?.detectedDomain && record.result.context.detectedDomain !== "general" && (
                                  <span className="text-label-mono px-2 py-0.5 rounded border"
                                    style={{ color: "#b9cacb", borderColor: "#2d2d30", backgroundColor: "#141416", fontSize: "10px" }}>
                                    {record.result.context.detectedDomain.replace(/-/g, " ")}
                                  </span>
                                )}
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
                              <span className="text-label-mono text-on-surface-variant" style={{ fontSize: "10px" }} suppressHydrationWarning>
                                {new Date(record.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            </div>
                          </div>
                        </Link>
                        {/* Delete button */}
                        <button
                          onClick={(e) => handleDeleteAnalysis(record.id, e)}
                          className="absolute top-3 right-3 p-1.5 rounded opacity-0 group-hover/row:opacity-100 transition-all"
                          style={isConfirming
                            ? { backgroundColor: "rgba(147,0,10,0.3)", color: "#ffb4ab", opacity: 1 }
                            : { backgroundColor: "rgba(45,45,48,0.6)", color: "#57606a" }}
                          title={isConfirming ? "Click again to confirm delete" : "Remove from memory"}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {isConfirming ? "warning" : "delete"}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Simulations ── */}
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
                    const isConfirming = confirmDelete === record.id;
                    return (
                      <div key={record.id} className="relative group/row">
                        <Link href={`/simulations/${record.id}`}
                          className="card p-lg hover:bg-surface-container-high transition-colors block group">
                          <div className="flex items-start justify-between gap-md">
                            <div className="flex-1 min-w-0 pr-8">
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
                              <span className="text-label-mono text-on-surface-variant" style={{ fontSize: "10px" }} suppressHydrationWarning>
                                {new Date(record.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            </div>
                          </div>
                        </Link>
                        {/* Delete button */}
                        <button
                          onClick={(e) => handleDeleteSimulation(record.id, e)}
                          className="absolute top-3 right-3 p-1.5 rounded opacity-0 group-hover/row:opacity-100 transition-all"
                          style={isConfirming
                            ? { backgroundColor: "rgba(147,0,10,0.3)", color: "#ffb4ab", opacity: 1 }
                            : { backgroundColor: "rgba(45,45,48,0.6)", color: "#57606a" }}
                          title={isConfirming ? "Click again to confirm delete" : "Remove from memory"}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {isConfirming ? "warning" : "delete"}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No results state */}
            {(search || hasActiveFilters) && totalFiltered === 0 && (
              <div className="card p-12 flex flex-col items-center text-center">
                <span className="material-symbols-outlined text-on-surface-variant mb-3" style={{ fontSize: "36px" }}>search_off</span>
                <p className="text-body-md text-on-surface-variant">No records match the current filters.</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-label-mono text-primary-container hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
