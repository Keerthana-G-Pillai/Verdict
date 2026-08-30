"use client";

import Link from "next/link";
import { useMemo } from "react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/dashboard/MetricCard";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import AnalysisTable from "@/components/dashboard/AnalysisTable";
import { useAnalysisStore } from "@/store/analysis-store";
import type { ActivityEvent, AnalysisRecord } from "@/types";

const CHANGE_TYPE_ICONS: Record<string, string> = {
  code:     "code",
  diff:     "difference",
  pr:       "merge_type",
  decision: "psychology",
};

const VERDICT_STATUS_MAP: Record<string, AnalysisRecord["status"]> = {
  approved:                 "completed",
  approved_with_conditions: "completed",
  requires_revision:        "analyzing",
  rejected:                 "failed",
};

const VERDICT_RISK_MAP: Record<string, AnalysisRecord["riskLevel"]> = {
  approved:                 "low",
  approved_with_conditions: "medium",
  requires_revision:        "high",
  rejected:                 "critical",
};

export default function DashboardPage() {
  const analyses = useAnalysisStore((s) => s.analyses);
  const simulations = useAnalysisStore((s) => s.simulations);
  const memory = useAnalysisStore((s) => s.memory);
  const simulationMemory = useAnalysisStore((s) => s.simulationMemory);

  const completedAnalyses = useMemo(
    () => Object.values(analyses).filter((a) => a.analyzedAt),
    [analyses]
  );

  const completedSimulations = useMemo(
    () => Object.values(simulations).filter((s) => s.analyzedAt),
    [simulations]
  );

  const riskCount = useMemo(
    () => completedAnalyses.filter((a) => a.verdict === "requires_revision" || a.verdict === "rejected").length +
          completedSimulations.filter((s) => s.verdict === "conflict_detected").length,
    [completedAnalyses, completedSimulations]
  );

  const successRate = useMemo(() => {
    const total = completedAnalyses.length;
    if (total === 0) return null;
    const safe = completedAnalyses.filter((a) => a.verdict === "approved" || a.verdict === "approved_with_conditions").length;
    return Math.round((safe / total) * 100 * 10) / 10;
  }, [completedAnalyses]);

  // Recent analyses for the table — up to 6, newest first; empty array when no real data
  const recentAnalyses = useMemo((): AnalysisRecord[] => {
    if (completedAnalyses.length === 0) return [];
    return completedAnalyses
      .sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime())
      .slice(0, 6)
      .map((a) => ({
        id: a.id,
        name: a.input.title || `${a.input.changeType} analysis`,
        type: a.input.changeType as AnalysisRecord["type"],
        riskLevel: VERDICT_RISK_MAP[a.verdict] ?? "medium",
        status: VERDICT_STATUS_MAP[a.verdict] ?? "completed",
        timestamp: a.analyzedAt,
        timeAgo: getTimeAgo(a.analyzedAt),
      }));
  }, [completedAnalyses]);

  // Activity feed — merge analyses + simulations; empty array when no real data
  const activityEvents = useMemo((): ActivityEvent[] => {
    if (completedAnalyses.length === 0 && completedSimulations.length === 0) {
      return [];
    }

    const events: ActivityEvent[] = [];

    completedAnalyses.slice().sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()).slice(0, 3).forEach((a) => {
      events.push({
        id: `analysis-${a.id}`,
        message: a.input.title || `${a.input.changeType} analysis`,
        timestamp: getTimeAgo(a.analyzedAt),
        meta: a.context.detectedDomain || a.input.changeType,
        type: a.verdict === "approved" ? "approved" : a.verdict === "approved_with_conditions" ? "approved" : "analyzing",
      });
    });

    completedSimulations.slice().sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()).slice(0, 2).forEach((s) => {
      events.push({
        id: `sim-${s.id}`,
        message: `${s.input.changeA.title} ↔ ${s.input.changeB.title}`,
        timestamp: getTimeAgo(s.analyzedAt),
        meta: `${s.conflictCount} conflict${s.conflictCount !== 1 ? "s" : ""}`,
        type: "simulating",
      });
    });

    events.sort((a) => (a.type === "analyzing" ? -1 : 1));
    return events.slice(0, 6);
  }, [completedAnalyses, completedSimulations]);

  const totalActivity = completedAnalyses.length + completedSimulations.length;

  // Build metrics from real data
  const metrics = useMemo(() => [
    {
      label: "Analyses Run",
      value: String(completedAnalyses.length || 0),
      icon: "donut_large",
      accentColor: "primary" as const,
      trend: completedAnalyses.length > 0
        ? { label: `${completedSimulations.length} merge simulations`, direction: "neutral" as const }
        : undefined,
    },
    {
      label: "Requires Attention",
      value: String(riskCount),
      icon: "warning",
      accentColor: "error" as const,
      trend: riskCount > 0
        ? { label: "Risks or conflicts detected", direction: "neutral" as const }
        : { label: "No critical issues found", direction: "up" as const },
    },
    {
      label: successRate !== null ? "Approval Rate" : "Validation Rate",
      value: successRate !== null ? `${successRate}%` : "—",
      icon: "verified",
      accentColor: "secondary" as const,
    },
  ], [completedAnalyses, completedSimulations, riskCount, successRate]);

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-h-screen pt-lg px-margin-desktop pb-xl overflow-x-hidden">
        {/* Page header */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-xl">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface tracking-tight">
              Engineering Intelligence
            </h1>
            <p className="text-body-md text-on-surface-variant mt-sm">
              {totalActivity > 0
                ? `${totalActivity} analyses completed · ${memory.length + simulationMemory.length} saved to memory`
                : "System status and recent architectural analyses."}
            </p>
          </div>
          <Link
            href="/analyze"
            className="self-start sm:self-auto inline-flex items-center gap-sm px-4 py-2 bg-primary-container text-on-primary-fixed-variant hover:bg-primary-fixed-dim transition-colors duration-200 rounded text-label-mono active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            Run Analysis
          </Link>
        </header>

        {/* Metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
          {metrics.map((metric, i) => (
            <MetricCard key={metric.label} {...metric}>
              {/* Approval rate — inline progress bar */}
              {i === 2 && successRate !== null && (
                <div className="mt-sm progress-track">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${successRate}%`, backgroundColor: "#6ffbbe" }}
                  />
                </div>
              )}
            </MetricCard>
          ))}
        </div>

        {/* Timeline + Table grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg flex-1">
          {/* Live Activity Timeline — 4 cols */}
          <div className="lg:col-span-4">
            {activityEvents.length > 0 ? (
              <ActivityTimeline events={activityEvents} />
            ) : (
              <div className="card p-lg h-full flex flex-col">
                <h2 className="text-headline-md text-on-surface mb-md">Live Activity</h2>
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <span className="material-symbols-outlined text-on-surface-variant mb-3" style={{ fontSize: "36px" }}>timeline</span>
                  <p className="text-body-md text-on-surface-variant">No activity yet.</p>
                  <p className="text-label-mono text-on-surface-variant mt-1">Run your first analysis to see activity here.</p>
                </div>
              </div>
            )}
          </div>

          {/* Recent Analyses Table — 8 cols */}
          <div className="lg:col-span-8">
            {recentAnalyses.length > 0 ? (
              <AnalysisTable records={recentAnalyses} />
            ) : (
              <div className="card p-lg h-full flex flex-col">
                <div className="flex items-center justify-between mb-md">
                  <h2 className="text-headline-md text-on-surface">Recent Analyses</h2>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <span className="material-symbols-outlined text-on-surface-variant mb-4" style={{ fontSize: "48px" }}>analytics</span>
                  <h3 className="text-body-lg font-semibold text-on-surface mb-2">No analyses yet</h3>
                  <p className="text-body-md text-on-surface-variant mb-6 max-w-xs">
                    Submit your first change to see results appear here in real-time.
                  </p>
                  <div className="flex items-center gap-sm flex-wrap justify-center">
                    <Link href="/analyze" className="inline-flex items-center gap-sm px-5 py-2 bg-primary-container text-on-primary-fixed-variant text-label-mono rounded hover:bg-primary-fixed-dim transition-colors">
                      <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                      Analyze a Change
                    </Link>
                    <Link href="/simulations" className="inline-flex items-center gap-sm px-5 py-2 border border-outline-variant text-on-surface-variant text-label-mono rounded hover:border-primary-fixed-dim transition-colors">
                      <span className="material-symbols-outlined text-[16px]">science</span>
                      Merge Simulation
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ── Helpers ────────────────────────────────────────────────────

function getTimeAgo(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
