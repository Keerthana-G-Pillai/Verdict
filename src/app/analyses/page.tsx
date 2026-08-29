"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import RiskBadge from "@/components/ui/RiskBadge";
import { useAnalysisStore } from "@/store/analysis-store";
import type { VerdictOutcome, ChangeType } from "@/lib/analysis/types";
import type { RiskLevel } from "@/types";

const VERDICT_CONFIG: Record<VerdictOutcome, { label: string; color: string; icon: string; bg: string }> = {
  approved:                 { label: "Approved",    color: "#6ffbbe", icon: "check_circle",  bg: "rgba(111,251,190,0.06)" },
  approved_with_conditions: { label: "Conditions",  color: "#ffb95f", icon: "rule",          bg: "rgba(255,185,95,0.06)"  },
  requires_revision:        { label: "Revision",    color: "#ffb4ab", icon: "edit_note",     bg: "rgba(255,180,171,0.06)" },
  rejected:                 { label: "Rejected",    color: "#ffb4ab", icon: "cancel",        bg: "rgba(255,180,171,0.06)" },
};

const CHANGE_TYPE_ICONS: Record<ChangeType, string> = {
  code:     "code",
  diff:     "difference",
  pr:       "merge_type",
  decision: "psychology",
};

type FilterVerdict = "all" | VerdictOutcome;
type SortKey = "newest" | "oldest" | "risk_high" | "risk_low";

function scoreToLevel(score: number): RiskLevel {
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

export default function AnalysesPage() {
  const analyses = useAnalysisStore((s) => s.analyses);
  const memory = useAnalysisStore((s) => s.memory);

  const [search, setSearch] = useState("");
  const [filterVerdict, setFilterVerdict] = useState<FilterVerdict>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  // Merge all analyses — prioritize memory records for extra metadata, fallback to raw analyses
  const allItems = useMemo(() => {
    const raw = Object.values(analyses).filter((a) => a.analyzedAt);
    return raw.map((a) => {
      const memRecord = memory.find((m) => m.id === a.id);
      return { analysis: a, inMemory: !!memRecord };
    });
  }, [analyses, memory]);

  const filtered = useMemo(() => {
    let items = allItems;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(({ analysis: a }) =>
        (a.input.title ?? "").toLowerCase().includes(q) ||
        a.input.changeType.toLowerCase().includes(q) ||
        a.verdictRationale.toLowerCase().includes(q) ||
        (a.context.detectedDomain ?? "").toLowerCase().includes(q)
      );
    }

    // Verdict filter
    if (filterVerdict !== "all") {
      items = items.filter(({ analysis: a }) => a.verdict === filterVerdict);
    }

    // Sort
    items = [...items].sort((x, y) => {
      switch (sortKey) {
        case "newest":   return new Date(y.analysis.analyzedAt).getTime() - new Date(x.analysis.analyzedAt).getTime();
        case "oldest":   return new Date(x.analysis.analyzedAt).getTime() - new Date(y.analysis.analyzedAt).getTime();
        case "risk_high": return y.analysis.riskScore - x.analysis.riskScore;
        case "risk_low":  return x.analysis.riskScore - y.analysis.riskScore;
      }
    });

    return items;
  }, [allItems, search, filterVerdict, sortKey]);

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-h-screen pt-lg px-margin-desktop pb-xl">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-xl gap-4">
          <div>
            <h1 className="text-display-lg font-bold text-on-surface tracking-tight">Change Analyses</h1>
            <p className="text-body-lg text-on-surface-variant mt-sm">
              {allItems.length > 0
                ? `${allItems.length} ${allItems.length === 1 ? "analysis" : "analyses"} in session`
                : "No analyses yet — run your first change analysis."}
            </p>
          </div>
          <Link
            href="/analyze"
            className="self-start md:self-auto inline-flex items-center gap-sm px-4 py-2 bg-primary-container text-on-primary-fixed-variant text-label-mono rounded hover:bg-primary-fixed-dim transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Analysis
          </Link>
        </header>

        {allItems.length === 0 ? (
          /* Empty state */
          <div className="card p-16 flex flex-col items-center text-center max-w-lg mx-auto">
            <span className="material-symbols-outlined text-on-surface-variant mb-4" style={{ fontSize: "48px" }}>analytics</span>
            <h2 className="text-headline-md text-on-surface mb-2">No analyses yet</h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              Submit a code snippet, diff, PR, or engineering decision to get started. VERDICT will analyze risks and issue a verdict.
            </p>
            <div className="flex items-center gap-sm flex-wrap justify-center">
              <Link
                href="/analyze"
                className="inline-flex items-center gap-sm px-6 py-2.5 bg-primary-container text-on-primary-fixed-variant text-label-mono rounded hover:bg-primary-fixed-dim transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                Analyze a Change
              </Link>
              <Link
                href="/simulations"
                className="inline-flex items-center gap-sm px-6 py-2.5 border border-outline-variant text-on-surface-variant text-label-mono rounded hover:border-primary-fixed-dim hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">science</span>
                Run Merge Simulation
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-sm mb-lg flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px] pointer-events-none">search</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search analyses…"
                  className="input-base w-full pl-9 pr-3 py-2 text-body-md"
                />
              </div>

              {/* Verdict filter */}
              <select
                value={filterVerdict}
                onChange={(e) => setFilterVerdict(e.target.value as FilterVerdict)}
                className="input-base px-3 py-2 text-label-mono text-on-surface-variant"
              >
                <option value="all">All Verdicts</option>
                <option value="approved">Approved</option>
                <option value="approved_with_conditions">With Conditions</option>
                <option value="requires_revision">Requires Revision</option>
                <option value="rejected">Rejected</option>
              </select>

              {/* Sort */}
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="input-base px-3 py-2 text-label-mono text-on-surface-variant"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="risk_high">Highest risk</option>
                <option value="risk_low">Lowest risk</option>
              </select>

              {/* Result count */}
              {(search || filterVerdict !== "all") && (
                <span className="text-label-mono text-on-surface-variant ml-auto">
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Results */}
            {filtered.length === 0 ? (
              <div className="card p-12 flex flex-col items-center text-center">
                <span className="material-symbols-outlined text-on-surface-variant mb-3" style={{ fontSize: "36px" }}>search_off</span>
                <p className="text-body-md text-on-surface-variant">No analyses match your filters.</p>
                <button
                  onClick={() => { setSearch(""); setFilterVerdict("all"); }}
                  className="mt-4 text-label-mono text-primary-container hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-sm">
                {filtered.map(({ analysis: a, inMemory }) => {
                  const vCfg = VERDICT_CONFIG[a.verdict];
                  const typeIcon = CHANGE_TYPE_ICONS[a.input.changeType];
                  const riskLevel = scoreToLevel(a.riskScore);

                  return (
                    <Link
                      key={a.id}
                      href={`/analyze/${a.id}`}
                      className="card p-md hover:bg-surface-container-high transition-colors group"
                    >
                      <div className="flex items-start gap-md">
                        {/* Change type icon */}
                        <div
                          className="w-9 h-9 rounded flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: "rgba(0,240,255,0.06)", border: "1px solid rgba(0,240,255,0.12)" }}
                        >
                          <span className="material-symbols-outlined text-[18px]" style={{ color: "#00f0ff" }}>{typeIcon}</span>
                        </div>

                        {/* Main content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-sm mb-1 flex-wrap">
                            <span
                              className="text-label-mono uppercase tracking-wider px-2 py-0.5 rounded border"
                              style={{ color: "#7df4ff", borderColor: "rgba(0,240,255,0.2)", backgroundColor: "rgba(0,240,255,0.06)", fontSize: "10px" }}
                            >
                              {a.input.changeType}
                            </span>
                            <RiskBadge level={riskLevel} />
                            {inMemory && (
                              <span
                                className="text-label-mono px-2 py-0.5 rounded border"
                                style={{ color: "#6ffbbe", borderColor: "rgba(111,251,190,0.2)", backgroundColor: "rgba(111,251,190,0.05)", fontSize: "10px" }}
                              >
                                IN MEMORY
                              </span>
                            )}
                          </div>
                          <h3 className="text-body-lg font-semibold text-on-surface group-hover:text-primary-fixed transition-colors truncate">
                            {a.input.title || `${a.input.changeType} analysis`}
                          </h3>
                          <p className="text-body-md text-on-surface-variant mt-0.5 line-clamp-1">{a.verdictRationale}</p>
                          <div className="flex items-center gap-md mt-2 flex-wrap">
                            {a.context.detectedDomain && (
                              <span className="text-label-mono text-on-surface-variant" style={{ fontSize: "11px" }}>
                                <span className="material-symbols-outlined text-[12px] align-middle mr-0.5">domain</span>
                                {a.context.detectedDomain}
                              </span>
                            )}
                            <span className="text-label-mono text-on-surface-variant" style={{ fontSize: "11px" }} suppressHydrationWarning>
                              <span className="material-symbols-outlined text-[12px] align-middle mr-0.5">schedule</span>
                              {new Date(a.analyzedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {a.criticalCount > 0 && (
                              <span className="text-label-mono" style={{ color: "#ffb4ab", fontSize: "11px" }}>
                                <span className="material-symbols-outlined text-[12px] align-middle mr-0.5">warning</span>
                                {a.criticalCount} critical
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Verdict + score */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded"
                            style={{ backgroundColor: vCfg.bg, border: `1px solid ${vCfg.color}33` }}
                          >
                            <span className="material-symbols-outlined text-[14px]" style={{ color: vCfg.color }}>{vCfg.icon}</span>
                            <span className="text-label-mono" style={{ color: vCfg.color, fontSize: "11px" }}>{vCfg.label}</span>
                          </div>
                          <div
                            className="text-headline-md font-bold"
                            style={{ color: a.riskScore >= 60 ? "#ffb4ab" : a.riskScore >= 35 ? "#ffb95f" : "#6ffbbe" }}
                          >
                            {a.riskScore}
                          </div>
                          <span className="text-label-mono text-on-surface-variant" style={{ fontSize: "10px" }}>RISK SCORE</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
