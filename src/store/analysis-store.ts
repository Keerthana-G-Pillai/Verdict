// ============================================================
// VERDICT — Combined Store (Analysis + Simulation)
// ============================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AnalysisResult, MemoryRecord } from "@/lib/analysis/types";
import type { SimulationResult, SimulationMemoryRecord } from "@/lib/simulation/types";

interface VerdictStore {
  // ── Analysis ──────────────────────────────────────────────
  analyses: Record<string, AnalysisResult>;
  memory: MemoryRecord[];

  saveAnalysis: (result: AnalysisResult) => void;
  getAnalysis: (id: string) => AnalysisResult | undefined;
  saveToMemory: (result: AnalysisResult) => void;
  isInMemory: (id: string) => boolean;
  clearAnalysis: (id: string) => void;
  removeFromMemory: (id: string) => void;

  // ── Simulation ────────────────────────────────────────────
  simulations: Record<string, SimulationResult>;
  simulationMemory: SimulationMemoryRecord[];

  saveSimulation: (result: SimulationResult) => void;
  getSimulation: (id: string) => SimulationResult | undefined;
  saveSimulationToMemory: (result: SimulationResult) => void;
  isSimulationInMemory: (id: string) => boolean;
  clearSimulation: (id: string) => void;
  removeSimulationFromMemory: (id: string) => void;
}

const safeStorage = () =>
  typeof window !== "undefined"
    ? localStorage
    : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

export const useAnalysisStore = create<VerdictStore>()(
  persist(
    (set, get) => ({
      // ── Analysis state ──────────────────────────────────
      analyses: {},
      memory: [],

      saveAnalysis: (result) =>
        set((state) => ({ analyses: { ...state.analyses, [result.id]: result } })),

      getAnalysis: (id) => get().analyses[id],

      saveToMemory: (result) => {
        if (get().memory.some((m) => m.id === result.id)) return;
        // Build a descriptive fallback title when the user left the field blank.
        // Priority: explicit title → first ~50 chars of description → first ~50 chars of content.
        const fallbackSource = result.input.description?.trim() || result.input.content?.trim() || "";
        const fallbackSnippet = fallbackSource.slice(0, 50).replace(/\s+/g, " ").trim();
        const fallbackSuffix = fallbackSnippet.length === 50 ? "…" : "";
        const fallbackTitle = fallbackSnippet
          ? `${fallbackSnippet}${fallbackSuffix}`
          : `${result.input.changeType} analysis`;
        const record: MemoryRecord = {
          id: result.id,
          title: result.input.title || fallbackTitle,
          changeType: result.input.changeType,
          riskScore: result.riskScore,
          confidence: result.confidence,
          verdict: result.verdict,
          verdictRationale: result.verdictRationale,
          criticalCount: result.criticalCount,
          highCount: result.highCount,
          savedAt: new Date().toISOString(),
          result,
        };
        set((state) => ({ memory: [record, ...state.memory] }));
      },

      isInMemory: (id) => get().memory.some((m) => m.id === id),

      clearAnalysis: (id) =>
        set((state) => {
          const { [id]: _r, ...rest } = state.analyses;
          return { analyses: rest };
        }),

      removeFromMemory: (id) =>
        set((state) => ({ memory: state.memory.filter((m) => m.id !== id) })),

      // ── Simulation state ────────────────────────────────
      simulations: {},
      simulationMemory: [],

      saveSimulation: (result) =>
        set((state) => ({ simulations: { ...state.simulations, [result.id]: result } })),

      getSimulation: (id) => get().simulations[id],

      saveSimulationToMemory: (result) => {
        if (get().simulationMemory.some((m) => m.id === result.id)) return;
        const record: SimulationMemoryRecord = {
          id: result.id,
          titleA: result.input.changeA.title,
          titleB: result.input.changeB.title,
          domainsA: result.domainsA,
          domainsB: result.domainsB,
          conflictCount: result.conflictCount,
          criticalConflictCount: result.criticalConflictCount,
          integrationRiskScore: result.integrationRiskScore,
          verdict: result.verdict,
          verdictRationale: result.verdictRationale,
          savedAt: new Date().toISOString(),
          result,
        };
        set((state) => ({ simulationMemory: [record, ...state.simulationMemory] }));
      },

      isSimulationInMemory: (id) => get().simulationMemory.some((m) => m.id === id),

      clearSimulation: (id) =>
        set((state) => {
          const { [id]: _r, ...rest } = state.simulations;
          return { simulations: rest };
        }),

      removeSimulationFromMemory: (id) =>
        set((state) => ({
          simulationMemory: state.simulationMemory.filter((m) => m.id !== id),
        })),
    }),
    {
      name: "verdict-store-v2",
      storage: createJSONStorage(safeStorage),
      partialize: (state) => ({
        memory: state.memory,
        simulationMemory: state.simulationMemory,
        analyses: Object.fromEntries(Object.entries(state.analyses).slice(-20)),
        simulations: Object.fromEntries(Object.entries(state.simulations).slice(-20)),
      }),
    }
  )
);
