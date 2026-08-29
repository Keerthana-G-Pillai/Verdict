"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import ChangeTypeSelector from "@/components/analysis/ChangeTypeSelector";
import type { ChangeType } from "@/lib/analysis/types";
import type { SimulationChange, SimulationInput } from "@/lib/simulation/types";
import { nanoid } from "@/lib/analysis/nanoid";
import { useAnalysisStore } from "@/store/analysis-store";
import { DEMO_SIMULATION_SCENARIOS } from "@/lib/demo-scenarios";

interface ChangePanel {
  id: "a" | "b";
  title: string;
  changeType: ChangeType;
  language: string;
  content: string;
  description: string;
}

const DEFAULT_PANEL = (id: "a" | "b"): ChangePanel => ({
  id,
  title: "",
  changeType: "code",
  language: "",
  content: "",
  description: "",
});

const PANEL_LABELS = {
  a: { label: "Change A", sublabel: "Your Implementation", accent: "#00f0ff", accentBg: "rgba(0,240,255,0.06)", accentBorder: "rgba(0,240,255,0.2)" },
  b: { label: "Change B", sublabel: "Incoming Implementation", accent: "#6ffbbe", accentBg: "rgba(111,251,190,0.06)", accentBorder: "rgba(111,251,190,0.2)" },
};

function ChangePanelForm({
  panel,
  onChange,
  error,
}: {
  panel: ChangePanel;
  onChange: (updates: Partial<ChangePanel>) => void;
  error?: string;
}) {
  const { label, sublabel, accent, accentBg, accentBorder } = PANEL_LABELS[panel.id];

  return (
    <div
      className="rounded-lg flex flex-col overflow-hidden"
      style={{ border: `1px solid ${accentBorder}`, backgroundColor: "#141416" }}
    >
      {/* Panel header */}
      <div
        className="px-5 py-4 border-b flex items-center gap-3"
        style={{ borderColor: accentBorder, backgroundColor: accentBg }}
      >
        <div
          className="w-8 h-8 rounded flex items-center justify-center text-label-mono font-bold shrink-0"
          style={{ backgroundColor: `${accent}18`, border: `1px solid ${accentBorder}`, color: accent, fontSize: "13px" }}
        >
          {panel.id.toUpperCase()}
        </div>
        <div>
          <div className="text-body-md font-semibold text-on-surface">{label}</div>
          <div className="text-label-mono text-on-surface-variant" style={{ fontSize: "11px" }}>{sublabel}</div>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-md">
        {/* Title */}
        <div>
          <label className="block text-label-mono text-on-surface-variant mb-xs" style={{ fontSize: "11px" }}>
            TITLE <span className="text-outline normal-case">— optional</span>
          </label>
          <input
            type="text"
            value={panel.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder={panel.id === "a" ? "e.g. Migrate JWT to sessions" : "e.g. Extend JWT refresh logic"}
            className="input-base w-full px-3 py-2 text-body-md"
          />
        </div>

        {/* Change type */}
        <div>
          <label className="block text-label-mono text-on-surface-variant mb-xs" style={{ fontSize: "11px" }}>
            CHANGE TYPE
          </label>
          <ChangeTypeSelector
            selected={panel.changeType}
            onChange={(t) => onChange({ changeType: t })}
          />
        </div>

        {/* Content */}
        <div>
          <div className="flex items-center justify-between mb-xs">
            <label className="block text-label-mono text-on-surface-variant" style={{ fontSize: "11px" }}>
              CONTENT <span className="text-error">*</span>
            </label>
            <span className="text-label-mono text-on-surface-variant" style={{ fontSize: "10px" }}>
              {panel.content.length > 0 && `${panel.content.length} chars`}
            </span>
          </div>
          <textarea
            value={panel.content}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder={
              panel.changeType === "decision"
                ? `Describe the change or decision…\n\nExamples:\n• "Migrate from JWT to session-based auth"\n• "Increase payment retry attempts from 3 to 5"`
                : "Paste code, diff, or PR description here…"
            }
            rows={10}
            className={`input-base w-full px-3 py-2 resize-none text-code-sm leading-relaxed ${error ? "border-error" : ""}`}
            style={{ fontFamily: panel.changeType === "decision" ? "var(--font-sans)" : "var(--font-mono)" }}
          />
          {error && (
            <p className="mt-1 text-label-mono text-error flex items-center gap-1" style={{ fontSize: "11px" }}>
              <span className="material-symbols-outlined text-[13px]">error</span>
              {error}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-label-mono text-on-surface-variant mb-xs" style={{ fontSize: "11px" }}>
            CONTEXT <span className="text-outline normal-case">— optional</span>
          </label>
          <textarea
            value={panel.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Additional context for this change…"
            rows={2}
            className="input-base w-full px-3 py-2 resize-none text-body-md"
          />
        </div>
      </div>
    </div>
  );
}

export default function SimulationsPage() {
  const router = useRouter();
  const saveSimulation = useAnalysisStore((s) => s.saveSimulation);

  const [panelA, setPanelA] = useState<ChangePanel>(DEFAULT_PANEL("a"));
  const [panelB, setPanelB] = useState<ChangePanel>(DEFAULT_PANEL("b"));
  const [errors, setErrors] = useState<{ a?: string; b?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const loadDemoScenario = useCallback((scenarioId: string) => {
    const scenario = DEMO_SIMULATION_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return;
    setPanelA((p) => ({
      ...p,
      title: scenario.changeA.title,
      changeType: scenario.changeA.changeType,
      content: scenario.changeA.content,
    }));
    setPanelB((p) => ({
      ...p,
      title: scenario.changeB.title,
      changeType: scenario.changeB.changeType,
      content: scenario.changeB.content,
    }));
    setErrors({});
    setShowDemo(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    const newErrors: typeof errors = {};
    if (!panelA.content.trim() || panelA.content.trim().length < 10)
      newErrors.a = "Provide at least 10 characters for Change A.";
    if (!panelB.content.trim() || panelB.content.trim().length < 10)
      newErrors.b = "Provide at least 10 characters for Change B.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    const simId = nanoid();

    const makeChange = (p: ChangePanel): SimulationChange => ({
      id: p.id,
      title: p.title.trim() || `Change ${p.id.toUpperCase()}`,
      changeType: p.changeType,
      language: p.language || undefined,
      content: p.content.trim(),
      description: p.description.trim() || undefined,
    });

    const input: SimulationInput = {
      id: simId,
      changeA: makeChange(panelA),
      changeB: makeChange(panelB),
      createdAt: new Date().toISOString(),
    };

    // Persist a placeholder so the result page can find the input
    saveSimulation({
      id: simId,
      input,
      stages: [],
      events: [],
      domainsA: [],
      domainsB: [],
      domainOverlaps: [],
      directConflicts: [],
      semanticConflicts: [],
      integrationChecks: [],
      integrationSteps: [],
      integrationRiskScore: 0,
      confidence: 0,
      conflictCount: 0,
      criticalConflictCount: 0,
      verdict: "safe_to_integrate",
      verdictRationale: "",
      analyzedAt: "",
      executionMs: 0,
    });

    router.push(`/simulations/${simId}`);
  }, [panelA, panelB, saveSimulation, router]);

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-h-screen pt-lg px-margin-desktop pb-xl">
        {/* Header */}
        <header className="mb-xl">
          <div className="flex items-center justify-between mb-sm">
            <div className="flex items-center gap-sm text-label-mono text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px]">account_tree</span>
              <span>/</span>
              <span className="text-on-surface">Merge Simulation</span>
            </div>
            {/* Demo mode toggle */}
            <button
              onClick={() => setShowDemo((v) => !v)}
              className="inline-flex items-center gap-sm px-3 py-1.5 border border-outline-variant text-on-surface-variant text-label-mono rounded hover:border-primary-fixed-dim hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">science</span>
              Load Demo Scenario
            </button>
          </div>
          <h1 className="text-display-lg font-bold text-on-surface tracking-tight">
            Can these changes safely coexist?
          </h1>
          <p className="text-body-lg text-on-surface-variant mt-sm max-w-2xl">
            Compare two independent changes before they collide. VERDICT detects semantic conflicts that Git cannot.
          </p>
        </header>

        {/* Demo scenario picker */}
        {showDemo && (
          <div className="card p-lg mb-xl">
            <div className="flex items-center justify-between mb-md">
              <h2 className="text-headline-md text-on-surface flex items-center gap-sm">
                <span className="material-symbols-outlined text-[18px]" style={{ color: "#6ffbbe" }}>auto_awesome</span>
                Demo Scenarios
              </h2>
              <button onClick={() => setShowDemo(false)} className="text-on-surface-variant hover:text-on-surface material-symbols-outlined text-[18px]">close</button>
            </div>
            <p className="text-body-md text-on-surface-variant mb-md">
              These scenarios run through the real VERDICT simulation engine to show semantic conflict detection.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-sm">
              {DEMO_SIMULATION_SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => loadDemoScenario(scenario.id)}
                  className="text-left px-4 py-4 rounded-lg border border-[#2d2d30] bg-[#141416] hover:border-primary-container/50 hover:bg-surface-container transition-all group relative overflow-hidden"
                >
                  {scenario.signatureDemo && (
                    <div
                      className="absolute top-2 right-2 text-label-mono px-2 py-0.5 rounded"
                      style={{ backgroundColor: "rgba(0,240,255,0.1)", border: "1px solid rgba(0,240,255,0.25)", color: "#00f0ff", fontSize: "9px" }}
                    >
                      SIGNATURE DEMO
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-container transition-colors text-[20px] shrink-0 mt-0.5">{scenario.icon}</span>
                    <div>
                      <div className="text-body-md font-semibold text-on-surface mb-1">{scenario.label}</div>
                      <div className="text-code-sm text-on-surface-variant mb-3">{scenario.description}</div>
                      <div
                        className="inline-flex items-center gap-1 text-label-mono px-2 py-0.5 rounded border"
                        style={{ color: scenario.expectedVerdictColor, borderColor: `${scenario.expectedVerdictColor}33`, backgroundColor: `${scenario.expectedVerdictColor}0d`, fontSize: "10px" }}
                      >
                        Expected: {scenario.expectedVerdict}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Two-panel input grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-lg mb-xl items-start">
          <ChangePanelForm
            panel={panelA}
            onChange={(u) => { setPanelA((p) => ({ ...p, ...u })); setErrors((e) => ({ ...e, a: undefined })); }}
            error={errors.a}
          />

          {/* Connector — desktop only */}
          <div className="hidden xl:flex items-center justify-center absolute left-1/2 -translate-x-1/2 self-center z-10 pointer-events-none" style={{ top: "50%" }}>
            <div className="flex flex-col items-center gap-2">
              <div className="w-[1px] h-8" style={{ background: "linear-gradient(to bottom, transparent, #00f0ff)" }} />
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.3)", boxShadow: "0 0 16px rgba(0,240,255,0.2)" }}
              >
                <span className="material-symbols-outlined text-primary-container text-[18px]">gavel</span>
              </div>
              <div className="w-[1px] h-8" style={{ background: "linear-gradient(to bottom, #00f0ff, transparent)" }} />
            </div>
          </div>

          <ChangePanelForm
            panel={panelB}
            onChange={(u) => { setPanelB((p) => ({ ...p, ...u })); setErrors((e) => ({ ...e, b: undefined })); }}
            error={errors.b}
          />
        </div>

        {/* Central intelligence connector — visible between panels on mobile */}
        <div className="xl:hidden flex items-center gap-md mb-xl">
          <div className="flex-1 h-[1px]" style={{ background: "linear-gradient(to right, transparent, #00f0ff)" }} />
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.3)", boxShadow: "0 0 16px rgba(0,240,255,0.2)" }}
          >
            <span className="material-symbols-outlined text-primary-container text-[18px]">gavel</span>
          </div>
          <div className="flex-1 h-[1px]" style={{ background: "linear-gradient(to left, transparent, #6ffbbe)" }} />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-md">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-sm px-8 py-3 bg-primary-container text-on-primary-fixed-variant text-body-md font-bold rounded hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            style={{ boxShadow: "0 0 15px rgba(0,240,255,0.3)" }}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                Starting Simulation…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">science</span>
                Run Merge Simulation →
              </>
            )}
          </button>
          <p className="text-label-mono text-on-surface-variant">
            Simulation typically takes 8–15 seconds
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}
