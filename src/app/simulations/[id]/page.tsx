"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import AnalysisPipeline from "@/components/analysis/AnalysisPipeline";
import EvidenceFeed from "@/components/analysis/EvidenceFeed";
import ConflictCard from "@/components/simulation/ConflictCard";
import IntegrationStrategyPanel from "@/components/simulation/IntegrationStrategyPanel";
import IntegrationVerdictCard from "@/components/simulation/IntegrationVerdictCard";
import { useAnalysisStore } from "@/store/analysis-store";
import { mockSimulator, SIM_PIPELINE_STAGES } from "@/lib/simulation/mock-simulator";
import { mergeAISimulation } from "@/lib/ai/normalizer";
import type {
  SimulationResult,
  SimEvent,
  SimPipelineStage,
  SimPipelineStageId,
  SimPipelineStageStatus,
  IntegrationCheck,
} from "@/lib/simulation/types";
import type { PipelineStage, AnalysisEvent } from "@/lib/analysis/types";
import type { ProviderName } from "@/lib/ai/types";

type TabId = "overview" | "conflicts" | "integration" | "strategy";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "overview",    label: "Overview",    icon: "dashboard" },
  { id: "conflicts",   label: "Conflicts",   icon: "psychology" },
  { id: "integration", label: "Integration", icon: "science" },
  { id: "strategy",    label: "Strategy",    icon: "route" },
];

// Convert SimPipelineStage → PipelineStage for the shared AnalysisPipeline component
function adaptStages(simStages: SimPipelineStage[]): PipelineStage[] {
  return simStages.map((s) => ({
    id: s.id as unknown as import("@/lib/analysis/types").PipelineStageId,
    label: s.label,
    shortLabel: s.shortLabel,
    icon: s.icon,
    status: s.status,
    startedAt: s.startedAt,
    completedAt: s.completedAt,
    summary: s.summary,
  }));
}

// Convert SimEvent → AnalysisEvent for the shared EvidenceFeed component
function adaptEvents(simEvents: SimEvent[]): AnalysisEvent[] {
  return simEvents.map((e) => ({
    id: e.id,
    stageId: e.stageId as unknown as import("@/lib/analysis/types").PipelineStageId,
    message: e.message,
    detail: e.detail,
    timestamp: e.timestamp,
    type: e.type,
  }));
}

export default function SimulationResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const getSimulation = useAnalysisStore((s) => s.getSimulation);
  const saveSimulation = useAnalysisStore((s) => s.saveSimulation);
  const saveSimulationToMemory = useAnalysisStore((s) => s.saveSimulationToMemory);
  const isSimulationInMemory = useAnalysisStore((s) => s.isSimulationInMemory);

  const [stages, setStages] = useState<SimPipelineStage[]>(
    SIM_PIPELINE_STAGES.map((s) => ({ ...s }))
  );
  const [simEvents, setSimEvents] = useState<SimEvent[]>([]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [memorySaved, setMemorySaved] = useState(false);
  const [aiProvider, setAiProvider] = useState<ProviderName | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [simEvents]);

  const runSimulation = useCallback(async () => {
    const stored = getSimulation(id);
    if (!stored?.input) {
      router.push("/simulations");
      return;
    }

    // Already completed — restore from store
    if (stored.analyzedAt && stored.conflictCount >= 0 && stored.stages.length > 0) {
      setResult(stored);
      setStages(stored.stages);
      setSimEvents(stored.events);
      setMemorySaved(isSimulationInMemory(id));
      return;
    }

    setIsRunning(true);

    // Run deterministic simulation first
    const deterministicResult = await mockSimulator.simulate(
      stored.input,
      (event) => setSimEvents((prev) => [...prev, event]),
      (stageId: SimPipelineStageId, status: SimPipelineStageStatus, summary?: string) => {
        setStages((prev) =>
          prev.map((s) => s.id === stageId ? { ...s, status, summary: summary ?? s.summary } : s)
        );
      }
    );

    // Try AI enhancement in parallel (non-blocking)
    let finalResult = deterministicResult;
    try {
      const aiResp = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changeA: {
            title: stored.input.changeA.title,
            changeType: stored.input.changeA.changeType,
            content: stored.input.changeA.content,
          },
          changeB: {
            title: stored.input.changeB.title,
            changeType: stored.input.changeB.changeType,
            content: stored.input.changeB.content,
          },
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (aiResp.ok) {
        const { data, provider, aiEnhanced } = await aiResp.json();
        if (aiEnhanced && data) {
          finalResult = mergeAISimulation(deterministicResult, data, provider);
          setAiProvider(provider as ProviderName);
        }
      }
    } catch {
      // AI unavailable — use deterministic result silently
    }

    setResult(finalResult);
    setStages(finalResult.stages);
    saveSimulation(finalResult);
    setIsRunning(false);
    setMemorySaved(isSimulationInMemory(id));
  }, [id, getSimulation, router, saveSimulation, isSimulationInMemory]);

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      runSimulation();
    }
  }, [runSimulation]);

  const handleSaveToMemory = useCallback(() => {
    if (result) { saveSimulationToMemory(result); setMemorySaved(true); }
  }, [result, saveSimulationToMemory]);

  const stored = getSimulation(id);
  if (!stored?.input) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-on-surface-variant mb-4">Simulation not found.</p>
            <Link href="/simulations" className="text-primary-container text-label-mono hover:underline">← New simulation</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const { changeA, changeB } = stored.input;

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-h-screen pt-lg px-margin-desktop pb-xl">
        {/* Header */}
        <header className="mb-xl">
          <div className="flex items-center gap-sm mb-sm text-label-mono text-on-surface-variant">
            <Link href="/simulations" className="hover:text-on-surface transition-colors">Merge Simulation</Link>
            <span>/</span>
            <span className="text-on-surface truncate max-w-xs">{changeA.title} ↔ {changeB.title}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            {/* Change A ↔ Change B titles */}
            <div>
              <div className="flex items-center gap-sm flex-wrap mb-2">
                <span
                  className="px-3 py-1 rounded text-label-mono font-semibold"
                  style={{ backgroundColor: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.2)", color: "#00f0ff", fontSize: "12px" }}
                >
                  A: {changeA.title}
                </span>
                <span className="text-on-surface-variant material-symbols-outlined text-[18px]">compare_arrows</span>
                <span
                  className="px-3 py-1 rounded text-label-mono font-semibold"
                  style={{ backgroundColor: "rgba(111,251,190,0.08)", border: "1px solid rgba(111,251,190,0.2)", color: "#6ffbbe", fontSize: "12px" }}
                >
                  B: {changeB.title}
                </span>
              </div>
              <span className="text-label-mono text-on-surface-variant">
                {new Date(stored.input.createdAt).toLocaleString()}
              </span>
            </div>

            {result && (
              <div className="flex items-center gap-sm flex-wrap justify-end">
                {/* AI provider badge */}
                {aiProvider ? (
                  <span className="inline-flex items-center gap-1 text-label-mono px-2.5 py-1 rounded border"
                    style={{ color: "#00f0ff", borderColor: "rgba(0,240,255,0.25)", backgroundColor: "rgba(0,240,255,0.06)", fontSize: "10px" }}>
                    <span className="material-symbols-outlined text-[11px]">auto_awesome</span>
                    AI-ENHANCED · {aiProvider.toUpperCase()}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-label-mono px-2.5 py-1 rounded border"
                    style={{ color: "#57606a", borderColor: "rgba(87,96,106,0.3)", backgroundColor: "rgba(87,96,106,0.06)", fontSize: "10px" }}>
                    <span className="material-symbols-outlined text-[11px]">rule</span>
                    RULE-BASED ANALYSIS
                  </span>
                )}
                {!memorySaved ? (
                  <button
                    onClick={handleSaveToMemory}
                    className="inline-flex items-center gap-sm px-4 py-2 border border-outline-variant text-on-surface-variant text-label-mono rounded hover:border-primary-fixed-dim hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    Save to Memory
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-sm px-4 py-2 text-label-mono" style={{ color: "#6ffbbe" }}>
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Saved to Engineering Memory
                  </span>
                )}
                <Link
                  href="/simulations"
                  className="inline-flex items-center gap-sm px-4 py-2 bg-primary-container text-on-primary-fixed-variant text-label-mono rounded hover:bg-primary-fixed-dim transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  New Simulation
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg flex-1">
          {/* Left: Pipeline + Feed */}
          <div className="lg:col-span-4 flex flex-col gap-lg">
            <div className="card p-lg">
              <h2 className="text-headline-md text-on-surface mb-lg flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary-container text-[18px]">account_tree</span>
                Simulation Pipeline
              </h2>
              <AnalysisPipeline stages={adaptStages(stages)} />
            </div>

            <div className="card p-lg flex flex-col flex-1 min-h-[300px]">
              <div className="flex items-center gap-sm mb-md">
                <span className="relative flex h-2.5 w-2.5">
                  {isRunning && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />}
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: isRunning ? "#00f0ff" : result ? "#6ffbbe" : "#849495" }} />
                </span>
                <h2 className="text-headline-md text-on-surface">{isRunning ? "Live Activity" : "Activity Log"}</h2>
              </div>
              <div ref={feedRef} className="flex-1 overflow-y-auto custom-scrollbar">
                <EvidenceFeed events={adaptEvents(simEvents)} />
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-8">
            {isRunning && !result && (
              <div className="card p-8 flex flex-col items-center justify-center min-h-[400px] gap-6">
                <div
                  className="w-20 h-20 rounded-full border-2 border-primary-container flex items-center justify-center"
                  style={{ boxShadow: "0 0 24px rgba(0,240,255,0.3)" }}
                >
                  <span className="material-symbols-outlined text-primary-container text-[36px]" style={{ animation: "spin 2s linear infinite" }}>
                    compare_arrows
                  </span>
                </div>
                <div className="text-center">
                  <h2 className="text-headline-md text-on-surface mb-2">Comparing changes…</h2>
                  <p className="text-body-md text-on-surface-variant max-w-sm">
                    Running semantic conflict detection. Results will appear momentarily.
                  </p>
                </div>
              </div>
            )}

            {result && (
              <div className="flex flex-col gap-lg">
                {/* Integration Verdict — always first */}
                <IntegrationVerdictCard
                  verdict={result.verdict}
                  integrationRiskScore={result.integrationRiskScore}
                  confidence={result.confidence}
                  rationale={result.verdictRationale}
                  conflictCount={result.conflictCount}
                  criticalConflictCount={result.criticalConflictCount}
                  directConflictCount={result.directConflicts.length}
                  semanticConflictCount={result.semanticConflicts.length}
                />

                {/* Tabs */}
                <div className="flex border-b border-[#2d2d30] gap-0">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-sm px-4 py-3 text-label-mono border-b-2 transition-colors duration-150 ${
                        activeTab === tab.id
                          ? "border-primary-container text-primary-container"
                          : "border-transparent text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab panels */}
                <div>
                  {activeTab === "overview" && <OverviewTab result={result} />}
                  {activeTab === "conflicts" && <ConflictsTab result={result} />}
                  {activeTab === "integration" && <IntegrationTab result={result} />}
                  {activeTab === "strategy" && (
                    <IntegrationStrategyPanel steps={result.integrationSteps} />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}

// ── Sub-panels ────────────────────────────────────────────────

function OverviewTab({ result }: { result: SimulationResult }) {
  const metrics = [
    { label: "Total Conflicts", value: result.conflictCount, color: result.conflictCount > 0 ? "#ffb4ab" : "#6ffbbe", icon: "psychology" },
    { label: "Critical", value: result.criticalConflictCount, color: result.criticalConflictCount > 0 ? "#ffb4ab" : "#6ffbbe", icon: "error" },
    { label: "Semantic", value: result.semanticConflicts.length, color: result.semanticConflicts.length > 0 ? "#ffb95f" : "#6ffbbe", icon: "compare_arrows" },
    { label: "Domain Overlaps", value: result.domainOverlaps.length, color: "#7df4ff", icon: "hub" },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <div className="grid grid-cols-2 gap-md">
        {metrics.map((m) => (
          <div key={m.label} className="card p-md">
            <div className="flex items-center gap-sm mb-sm">
              <span className="material-symbols-outlined text-[16px]" style={{ color: m.color }}>{m.icon}</span>
              <span className="text-label-mono text-on-surface-variant">{m.label}</span>
            </div>
            <div className="text-headline-md font-bold" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Domain signatures */}
      <div className="card p-lg">
        <h3 className="text-headline-md text-on-surface mb-md">Domain Signatures</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <span className="text-label-mono text-primary-fixed-dim block mb-sm" style={{ fontSize: "11px" }}>CHANGE A DOMAINS</span>
            <div className="flex flex-wrap gap-xs">
              {result.domainsA.length > 0
                ? result.domainsA.map((d) => (
                    <span key={d} className="text-code-sm px-2 py-0.5 rounded border" style={{ color: "#7df4ff", borderColor: "rgba(0,240,255,0.2)", backgroundColor: "rgba(0,240,255,0.05)" }}>
                      {d}
                    </span>
                  ))
                : <span className="text-on-surface-variant text-code-sm">General</span>}
            </div>
          </div>
          <div>
            <span className="text-label-mono text-secondary-fixed block mb-sm" style={{ fontSize: "11px" }}>CHANGE B DOMAINS</span>
            <div className="flex flex-wrap gap-xs">
              {result.domainsB.length > 0
                ? result.domainsB.map((d) => (
                    <span key={d} className="text-code-sm px-2 py-0.5 rounded border" style={{ color: "#6ffbbe", borderColor: "rgba(111,251,190,0.2)", backgroundColor: "rgba(111,251,190,0.05)" }}>
                      {d}
                    </span>
                  ))
                : <span className="text-on-surface-variant text-code-sm">General</span>}
            </div>
          </div>
        </div>

        {result.domainOverlaps.length > 0 && (
          <div className="mt-md pt-md" style={{ borderTop: "1px solid #2d2d30" }}>
            <span className="text-label-mono text-on-surface-variant block mb-sm" style={{ fontSize: "11px" }}>SHARED DOMAINS (OVERLAP)</span>
            <div className="flex flex-wrap gap-sm">
              {result.domainOverlaps.map((ov) => (
                <span key={ov.domain} className="inline-flex items-center gap-1 text-code-sm px-2 py-0.5 rounded border"
                  style={{ color: "#ffb95f", borderColor: "rgba(255,185,95,0.2)", backgroundColor: "rgba(255,185,95,0.05)" }}>
                  <span className="material-symbols-outlined text-[11px]">warning</span>
                  {ov.domain}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-sm text-label-mono text-on-surface-variant" style={{ fontSize: "11px" }}>
        <span className="material-symbols-outlined text-[14px]">schedule</span>
        Analyzed in {result.executionMs}ms · Static analysis · No execution environment
      </div>
    </div>
  );
}

function ConflictsTab({ result }: { result: SimulationResult }) {
  const allConflicts = [...result.directConflicts, ...result.semanticConflicts];

  if (allConflicts.length === 0) {
    return (
      <div className="card p-12 flex flex-col items-center text-center">
        <span className="material-symbols-outlined text-secondary-fixed mb-4" style={{ fontSize: "48px" }}>check_circle</span>
        <h3 className="text-headline-md text-on-surface mb-2">No Conflicts Detected</h3>
        <p className="text-body-md text-on-surface-variant max-w-sm">
          VERDICT found no direct or semantic conflicts between these two changes. They can safely coexist.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-xl">
      {/* Direct conflicts */}
      {result.directConflicts.length > 0 && (
        <div>
          <div className="flex items-center gap-sm mb-md">
            <span className="material-symbols-outlined text-[14px] text-error">compare_arrows</span>
            <h3 className="text-label-mono text-on-surface-variant uppercase tracking-wider" style={{ fontSize: "11px" }}>
              Direct Conflicts ({result.directConflicts.length})
            </h3>
          </div>
          <div className="flex flex-col gap-md">
            {result.directConflicts.map((c) => (
              <ConflictCard key={c.id} conflict={c} />
            ))}
          </div>
        </div>
      )}

      {/* Semantic conflicts — highlighted */}
      {result.semanticConflicts.length > 0 && (
        <div>
          <div className="flex items-center gap-sm mb-sm">
            <span className="material-symbols-outlined text-[14px] text-tertiary-fixed-dim">psychology</span>
            <h3 className="text-label-mono text-on-surface-variant uppercase tracking-wider" style={{ fontSize: "11px" }}>
              Semantic Conflicts ({result.semanticConflicts.length})
            </h3>
          </div>
          <div
            className="px-4 py-2 rounded mb-md flex items-center gap-sm"
            style={{ backgroundColor: "rgba(255,185,95,0.06)", border: "1px solid rgba(255,185,95,0.18)" }}
          >
            <span className="material-symbols-outlined text-tertiary-fixed-dim shrink-0" style={{ fontSize: "14px" }}>info</span>
            <p className="text-code-sm text-on-surface-variant">
              Semantic conflicts are <strong className="text-on-surface">not visible in a Git diff</strong>. They arise from incompatible behavioral assumptions between the two changes.
            </p>
          </div>
          <div className="flex flex-col gap-md">
            {result.semanticConflicts.map((c) => (
              <ConflictCard key={c.id} conflict={c} isSemanticHighlight />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IntegrationTab({ result }: { result: SimulationResult }) {
  const OUTCOME_CONFIG = {
    compatible:    { icon: "check_circle",  color: "#6ffbbe", label: "Compatible" },
    conflict:      { icon: "cancel",        color: "#ffb4ab", label: "Conflict" },
    warning:       { icon: "warning",       color: "#ffb95f", label: "Warning" },
    not_connected: { icon: "cloud_off",     color: "#849495", label: "Not Connected" },
    skipped:       { icon: "skip_next",     color: "#849495", label: "Skipped" },
  };

  const ANALYSIS_TYPE_LABELS: Record<IntegrationCheck["analysisType"], string> = {
    static_analysis:    "STATIC ANALYSIS",
    inferred:           "INFERRED",
    execution_evidence: "EXECUTION",
  };

  return (
    <div className="flex flex-col gap-lg">
      <div
        className="px-4 py-3 rounded flex gap-sm"
        style={{ backgroundColor: "rgba(255,185,95,0.06)", border: "1px solid rgba(255,185,95,0.2)" }}
      >
        <span className="material-symbols-outlined text-tertiary-fixed-dim shrink-0 mt-0.5" style={{ fontSize: "16px" }}>info</span>
        <p className="text-body-md text-on-surface-variant">
          No execution environment connected. All integration checks are based on{" "}
          <strong className="text-on-surface">static analysis</strong> and{" "}
          <strong className="text-on-surface">semantic inference</strong>. Real test execution requires a connected sandbox.
        </p>
      </div>

      <div className="flex flex-col gap-sm">
        {result.integrationChecks.map((check, i) => {
          const oc = OUTCOME_CONFIG[check.outcome] ?? { icon: "info", color: "#b9cacb", label: check.outcome };
          return (
            <div key={i} className="card p-4 flex gap-md items-start">
              <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5" style={{ color: oc.color }}>{oc.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-sm mb-1 flex-wrap">
                  <span className="text-body-md font-medium text-on-surface">{check.label}</span>
                  <span className="text-label-mono px-1.5 py-0.5 rounded border"
                    style={{ fontSize: "10px", color: "#849495", borderColor: "#2d2d30", backgroundColor: "#141416" }}>
                    {ANALYSIS_TYPE_LABELS[check.analysisType]}
                  </span>
                </div>
                <p className="text-code-sm text-on-surface-variant">{check.detail}</p>
                {check.confidence > 0 && (
                  <p className="text-label-mono text-on-surface-variant mt-1" style={{ fontSize: "10px" }}>
                    Confidence: {check.confidence}%
                  </p>
                )}
              </div>
              <span className="text-label-mono shrink-0" style={{ color: oc.color, fontSize: "11px" }}>{oc.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
