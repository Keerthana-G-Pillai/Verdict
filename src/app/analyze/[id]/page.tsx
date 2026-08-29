"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import AnalysisPipeline from "@/components/analysis/AnalysisPipeline";
import EvidenceFeed from "@/components/analysis/EvidenceFeed";
import FindingCard from "@/components/analysis/FindingCard";
import VerdictCard from "@/components/analysis/VerdictCard";
import EvidencePanel from "@/components/analysis/EvidencePanel";
import { useAnalysisStore } from "@/store/analysis-store";
import { mockAnalyzer, PIPELINE_STAGES } from "@/lib/analysis/mock-analyzer";
import { mergeAgentTrial } from "@/lib/ai/normalizer";
import type { AgentTrialResult } from "@/lib/ai/agents/types";
import type {
  AnalysisResult,
  AnalysisEvent,
  PipelineStage,
  PipelineStageId,
  PipelineStageStatus,
} from "@/lib/analysis/types";
import type { ProviderName } from "@/lib/ai/types";

type TabId = "overview" | "findings" | "validation" | "evidence";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "overview",   label: "Overview",   icon: "dashboard" },
  { id: "findings",   label: "Findings",   icon: "troubleshoot" },
  { id: "validation", label: "Validation", icon: "verified_user" },
  { id: "evidence",   label: "Evidence",   icon: "fact_check" },
];

export default function AnalysisResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const getAnalysis = useAnalysisStore((s) => s.getAnalysis);
  const saveAnalysis = useAnalysisStore((s) => s.saveAnalysis);
  const saveToMemory = useAnalysisStore((s) => s.saveToMemory);
  const isInMemory = useAnalysisStore((s) => s.isInMemory);

  const [stages, setStages] = useState<PipelineStage[]>(
    PIPELINE_STAGES.map((s) => ({ ...s }))
  );
  const [events, setEvents] = useState<AnalysisEvent[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [memorySaved, setMemorySaved] = useState(false);
  const [aiProvider, setAiProvider] = useState<ProviderName | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  // Keyed to `id` so a new analysis URL always triggers a fresh run,
  // even if the component is still mounted from a previous navigation.
  const hasStarted = useRef<string | null>(null);

  // Auto-scroll evidence feed
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events]);

  const runAnalysis = useCallback(async () => {
    const stored = getAnalysis(id);
    if (!stored?.input) {
      router.push("/analyze");
      return;
    }

    // If already complete AND AI-enhanced, show the cached result as-is.
    // If analyzedAt is set but aiEnhanced is false (deterministic-only run),
    // fall through and run the AI layer on top.
    if (stored.analyzedAt && stored.riskFindings.length > 0 && stored.aiEnhanced !== false) {
      setResult(stored);
      setStages(stored.stages.length > 0 ? stored.stages : PIPELINE_STAGES.map((s) => ({ ...s, status: "complete" as const })));
      setEvents(stored.events);
      if (stored.aiProvider) setAiProvider(stored.aiProvider as ProviderName);
      setMemorySaved(isInMemory(id));
      return;
    }

    setIsRunning(true);

    // Run deterministic analysis first
    const deterministicResult = await mockAnalyzer.analyze(
      stored.input,
      (event) => setEvents((prev) => [...prev, event]),
      (stageId: PipelineStageId, status: PipelineStageStatus, summary?: string) => {
        setStages((prev) =>
          prev.map((s) => s.id === stageId ? { ...s, status, summary: summary ?? s.summary } : s)
        );
      }
    );

    // Try 4-agent AI enhancement (non-blocking — deterministic result shown immediately)
    let finalResult = deterministicResult;
    try {
      const aiResp = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changeType: stored.input.changeType,
          title: stored.input.title,
          content: stored.input.content,
          description: stored.input.description,
          language: stored.input.language,
          fileContext: stored.input.fileContext,
        }),
        signal: AbortSignal.timeout(45000),
      });
      if (aiResp.ok) {
        const { data, provider, aiEnhanced } = await aiResp.json();
        if (aiEnhanced && data) {
          // New 4-agent trial result format
          finalResult = mergeAgentTrial(deterministicResult, data as AgentTrialResult, provider);
          setAiProvider(provider as ProviderName);
        }
      }
    } catch (aiErr) {
      // AI call failed — deterministic result already shown.
      // Log to browser console so failures are visible during development.
      console.error("[VERDICT] /api/analyze failed — showing deterministic result:", aiErr);
    }

    setResult(finalResult);
    setStages(finalResult.stages);
    saveAnalysis(finalResult);
    setIsRunning(false);
    setMemorySaved(isInMemory(id));
  }, [id, getAnalysis, router, saveAnalysis, isInMemory]);

  useEffect(() => {
    if (hasStarted.current !== id) {
      hasStarted.current = id;
      runAnalysis();
    }
  }, [id, runAnalysis]);

  const handleSaveToMemory = useCallback(() => {
    if (result) {
      saveToMemory(result);
      setMemorySaved(true);
    }
  }, [result, saveToMemory]);

  const stored = getAnalysis(id);
  const input = stored?.input;

  if (!input) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-on-surface-variant mb-4">Analysis not found.</p>
            <Link href="/analyze" className="text-primary-container text-label-mono hover:underline">
              ← Start a new analysis
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-h-screen pt-lg px-margin-desktop pb-xl">
        {/* Breadcrumb + header */}
        <header className="mb-xl">
          <div className="flex items-center justify-between mb-sm">
            <div className="flex items-center gap-sm text-label-mono text-on-surface-variant">
              <Link href="/analyze" className="hover:text-on-surface transition-colors">New Analysis</Link>
              <span>/</span>
              <span className="text-on-surface truncate max-w-xs">{input.title}</span>
            </div>
            {/* Intelligence source indicator */}
            {result && (
              <span
                className="inline-flex items-center gap-1 px-3 py-1 rounded border text-label-mono"
                style={aiProvider
                  ? { color: "#7df4ff", borderColor: "rgba(0,240,255,0.2)", backgroundColor: "rgba(0,240,255,0.06)", fontSize: "11px" }
                  : { color: "#849495", borderColor: "#2d2d30", backgroundColor: "#141416", fontSize: "11px" }
                }
              >
                <span className="material-symbols-outlined text-[12px]">{aiProvider ? "auto_awesome" : "psychology"}</span>
                {aiProvider ? `AI-ENHANCED · ${aiProvider.toUpperCase()}` : "RULE-BASED ANALYSIS"}
              </span>
            )}
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-headline-lg font-bold text-on-surface tracking-tight">
                {input.title}
              </h1>
              <div className="flex items-center gap-md mt-sm">
                <span
                  className="text-label-mono px-2 py-0.5 rounded border uppercase tracking-wider"
                  style={{ color: "#7df4ff", borderColor: "rgba(0,240,255,0.2)", backgroundColor: "rgba(0,240,255,0.06)", fontSize: "11px" }}
                >
                  {input.changeType}
                </span>
                {input.language && (
                  <span className="text-label-mono text-on-surface-variant">{input.language}</span>
                )}
                <span className="text-label-mono text-on-surface-variant">
                  {new Date(input.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {result && (
              <div className="flex items-center gap-sm">
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
                  href="/analyze"
                  className="inline-flex items-center gap-sm px-4 py-2 bg-primary-container text-on-primary-fixed-variant text-label-mono rounded hover:bg-primary-fixed-dim transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  New Analysis
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Main grid: pipeline sidebar + content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg flex-1">
          {/* Left: Pipeline + Evidence Feed */}
          <div className="lg:col-span-4 flex flex-col gap-lg">
            {/* Pipeline */}
            <div className="card p-lg">
              <h2 className="text-headline-md text-on-surface mb-lg flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary-container text-[18px]">
                  account_tree
                </span>
                Analysis Pipeline
              </h2>
              <AnalysisPipeline stages={stages} />
            </div>

            {/* Evidence Feed */}
            <div className="card p-lg flex flex-col flex-1 min-h-[300px]">
              <div className="flex items-center gap-sm mb-md">
                <span className="relative flex h-2.5 w-2.5">
                  {isRunning && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
                  )}
                  <span
                    className="relative inline-flex rounded-full h-2.5 w-2.5"
                    style={{ backgroundColor: isRunning ? "#00f0ff" : result ? "#6ffbbe" : "#849495" }}
                  />
                </span>
                <h2 className="text-headline-md text-on-surface">
                  {isRunning ? "Live Activity" : "Activity Log"}
                </h2>
              </div>
              <div ref={feedRef} className="flex-1 overflow-y-auto custom-scrollbar">
                <EvidenceFeed events={events} />
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-8">
            {/* Running state */}
            {isRunning && !result && (
              <div className="card p-8 flex flex-col items-center justify-center min-h-[400px] gap-6">
                <div className="relative">
                  <div
                    className="w-20 h-20 rounded-full border-2 border-primary-container flex items-center justify-center"
                    style={{ boxShadow: "0 0 24px rgba(0,240,255,0.3)" }}
                  >
                    <span
                      className="material-symbols-outlined text-primary-container text-[36px]"
                      style={{ animation: "spin 2s linear infinite" }}
                    >
                      gavel
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-headline-md text-on-surface mb-2">Analyzing your change…</h2>
                  <p className="text-body-md text-on-surface-variant max-w-sm">
                    Running intelligence pipeline. Findings will appear momentarily.
                  </p>
                </div>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="flex flex-col gap-lg">
                {/* Verdict card — always first */}
                <VerdictCard
                  verdict={result.verdict}
                  riskScore={result.riskScore}
                  confidence={result.confidence}
                  rationale={result.verdictRationale}
                  conditions={result.conditions}
                  criticalCount={result.criticalCount}
                  highCount={result.highCount}
                />

                {/* Tab navigation */}
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
                  {/* ── OVERVIEW ── */}
                  {activeTab === "overview" && (
                    <OverviewTab result={result} />
                  )}

                  {/* ── FINDINGS ── */}
                  {activeTab === "findings" && (
                    <FindingsTab result={result} />
                  )}

                  {/* ── VALIDATION ── */}
                  {activeTab === "validation" && (
                    <ValidationTab result={result} />
                  )}

                  {/* ── EVIDENCE ── */}
                  {activeTab === "evidence" && (
                    <EvidencePanel items={result.evidence} />
                  )}
                </div>

                {/* Recommendations footer */}
                {result.recommendations.length > 0 && (
                  <div className="card p-lg">
                    <h3 className="text-headline-md text-on-surface mb-md flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary-fixed-dim text-[18px]">lightbulb</span>
                      Recommendations
                    </h3>
                    <ul className="flex flex-col gap-sm">
                      {result.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-sm">
                          <span className="text-label-mono text-primary-container shrink-0 mt-0.5" style={{ fontSize: "11px" }}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <p className="text-body-md text-on-surface-variant">{rec}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spin animation injected via style tag */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}

// ── Sub-panels ─────────────────────────────────────────────────

function OverviewTab({ result }: { result: AnalysisResult }) {
  const metrics = [
    {
      label: "Critical Findings",
      value: result.criticalCount,
      color: result.criticalCount > 0 ? "#ffb4ab" : "#6ffbbe",
      icon: "error",
    },
    {
      label: "High Risk Findings",
      value: result.highCount,
      color: result.highCount > 0 ? "#ffb95f" : "#6ffbbe",
      icon: "warning",
    },
    {
      label: "Affected Areas",
      value: result.context.affectedAreas.length,
      color: "#7df4ff",
      icon: "account_tree",
    },
    {
      label: "Safety Controls",
      value: result.safetyFindings.length,
      color: "#6ffbbe",
      icon: "verified",
    },
  ];

  return (
    <div className="flex flex-col gap-lg">
      {/* Metric grid */}
      <div className="grid grid-cols-2 gap-md">
        {metrics.map((m) => (
          <div key={m.label} className="card p-md">
            <div className="flex items-center gap-sm mb-sm">
              <span className="material-symbols-outlined text-[16px]" style={{ color: m.color }}>
                {m.icon}
              </span>
              <span className="text-label-mono text-on-surface-variant">{m.label}</span>
            </div>
            <div className="text-headline-md font-bold" style={{ color: m.color }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Context summary */}
      <div className="card p-lg">
        <h3 className="text-headline-md text-on-surface mb-md">Context Summary</h3>
        <p className="text-body-md text-on-surface-variant mb-md">{result.context.summary}</p>
        <div className="flex flex-col gap-sm">
          <div className="flex gap-md">
            <span className="text-label-mono text-on-surface-variant uppercase" style={{ fontSize: "11px", minWidth: "100px" }}>Domain</span>
            <span className="text-code-sm text-on-surface capitalize">{result.context.detectedDomain?.replace(/-/g, " ") || "General"}</span>
          </div>
          <div className="flex gap-md">
            <span className="text-label-mono text-on-surface-variant uppercase" style={{ fontSize: "11px", minWidth: "100px" }}>Scope</span>
            <span className="text-code-sm text-on-surface capitalize">{result.context.scope.replace("-", " ")}</span>
          </div>
          {result.context.detectedLanguage && (
            <div className="flex gap-md">
              <span className="text-label-mono text-on-surface-variant uppercase" style={{ fontSize: "11px", minWidth: "100px" }}>Language</span>
              <span className="text-code-sm text-on-surface">{result.context.detectedLanguage}</span>
            </div>
          )}
          <div className="flex gap-md">
            <span className="text-label-mono text-on-surface-variant uppercase" style={{ fontSize: "11px", minWidth: "100px" }}>Affected</span>
            <div className="flex flex-wrap gap-xs">
              {result.context.affectedAreas.map((area) => (
                <span
                  key={area}
                  className="text-code-sm px-2 py-0.5 rounded border"
                  style={{ color: "#7df4ff", borderColor: "rgba(0,240,255,0.2)", backgroundColor: "rgba(0,240,255,0.05)" }}
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
          {result.context.dependencies.length > 0 && (
            <div className="flex gap-md">
              <span className="text-label-mono text-on-surface-variant uppercase" style={{ fontSize: "11px", minWidth: "100px" }}>Deps</span>
              <div className="flex flex-wrap gap-xs">
                {result.context.dependencies.map((dep) => (
                  <span
                    key={dep}
                    className="text-code-sm px-2 py-0.5 rounded border"
                    style={{ color: "#b9cacb", borderColor: "#2d2d30", backgroundColor: "#141416" }}
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Execution time */}
      <div className="flex items-center gap-sm text-label-mono text-on-surface-variant" style={{ fontSize: "11px" }}>
        <span className="material-symbols-outlined text-[14px]">schedule</span>
        Analyzed in {result.executionMs}ms · {result.analyzerVersion}
      </div>
    </div>
  );
}

function FindingsTab({ result }: { result: AnalysisResult }) {
  const allFindings = [...result.riskFindings, ...result.safetyFindings];
  const riskFindings = result.riskFindings;
  const safetyFindings = result.safetyFindings;

  if (allFindings.length === 0) {
    return (
      <div className="card p-8 text-center text-on-surface-variant text-body-md">
        No findings generated.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-xl">
      {riskFindings.length > 0 && (
        <div>
          <h3 className="text-label-mono text-on-surface-variant uppercase tracking-wider mb-md flex items-center gap-sm" style={{ fontSize: "11px" }}>
            <span className="material-symbols-outlined text-[14px] text-error">troubleshoot</span>
            Risk Findings ({riskFindings.length})
          </h3>
          <div className="flex flex-col gap-md">
            {riskFindings.map((f) => (
              <FindingCard key={f.id} finding={f} />
            ))}
          </div>
        </div>
      )}

      {safetyFindings.length > 0 && (
        <div>
          <h3 className="text-label-mono text-on-surface-variant uppercase tracking-wider mb-md flex items-center gap-sm" style={{ fontSize: "11px" }}>
            <span className="material-symbols-outlined text-[14px] text-secondary-fixed">verified</span>
            Safety Indicators ({safetyFindings.length})
          </h3>
          <div className="flex flex-col gap-md">
            {safetyFindings.map((f) => (
              <FindingCard key={f.id} finding={f} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ValidationTab({ result }: { result: AnalysisResult }) {
  return (
    <div className="flex flex-col gap-lg">
      {/* Big honesty notice */}
      <div
        className="px-5 py-4 rounded-lg"
        style={{ backgroundColor: "rgba(255,185,95,0.06)", border: "1px solid rgba(255,185,95,0.2)" }}
      >
        <div className="flex gap-sm mb-2">
          <span className="material-symbols-outlined text-tertiary-fixed-dim shrink-0" style={{ fontSize: "18px" }}>
            info
          </span>
          <h3 className="text-body-md font-semibold text-on-surface">Validation Environment Status</h3>
        </div>
        <p className="text-body-md text-on-surface-variant">
          Validation is performed via{" "}
          <strong className="text-on-surface">static analysis</strong> and{" "}
          <strong className="text-on-surface">pattern inference</strong> only.
          Results below are analytical assessments — no code is executed.
        </p>
        <p className="text-body-md text-on-surface-variant mt-2">
          VERDICT performs static and semantic validation only. No sandbox execution is performed or implied.
        </p>
      </div>

      {/* Simulation results */}
      <div>
        <h3 className="text-label-mono text-on-surface-variant uppercase tracking-wider mb-md" style={{ fontSize: "11px" }}>
          Validation Results
        </h3>
        <div className="flex flex-col gap-sm">
          {result.simulationResults.map((sim, i) => {
            const outcomeConfig = {
              passed:  { icon: "check_circle", color: "#6ffbbe", label: "Passed" },
              failed:  { icon: "cancel",       color: "#ffb4ab", label: "Failed" },
              warning: { icon: "warning",      color: "#ffb95f", label: "Warning" },
              skipped: { icon: "skip_next",    color: "#849495", label: "Skipped" },
              no_environment: { icon: "cloud_off", color: "#849495", label: "No Environment" },
            }[sim.outcome] ?? { icon: "info", color: "#b9cacb", label: sim.outcome };

            const typeLabel = {
              static_analysis: "STATIC ANALYSIS",
              inferred: "INFERRED",
              execution: "EXECUTION",
            }[sim.type] ?? "ANALYSIS";

            return (
              <div key={i} className="card p-4 flex gap-md items-start">
                <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5" style={{ color: outcomeConfig.color }}>
                  {outcomeConfig.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-sm mb-1">
                    <span className="text-body-md font-medium text-on-surface">{sim.label}</span>
                    <span
                      className="text-label-mono px-1.5 py-0.5 rounded border"
                      style={{
                        fontSize: "10px",
                        color: "#849495",
                        borderColor: "#2d2d30",
                        backgroundColor: "#141416",
                      }}
                    >
                      {typeLabel}
                    </span>
                  </div>
                  <p className="text-code-sm text-on-surface-variant">{sim.detail}</p>
                  <p className="text-label-mono text-on-surface-variant mt-1" style={{ fontSize: "10px" }}>
                    Confidence: {sim.confidence}%
                  </p>
                </div>
                <span
                  className="text-label-mono shrink-0"
                  style={{ color: outcomeConfig.color, fontSize: "11px" }}
                >
                  {outcomeConfig.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
