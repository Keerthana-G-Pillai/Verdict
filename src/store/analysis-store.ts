// ============================================================
// VERDICT — Combined Store (Analysis + Simulation)
// Replaces analysis-store.ts with a single unified store.
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

  // ── Simulation ────────────────────────────────────────────
  simulations: Record<string, SimulationResult>;
  simulationMemory: SimulationMemoryRecord[];

  saveSimulation: (result: SimulationResult) => void;
  getSimulation: (id: string) => SimulationResult | undefined;
  saveSimulationToMemory: (result: SimulationResult) => void;
  isSimulationInMemory: (id: string) => boolean;
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
        const record: MemoryRecord = {
          id: result.id,
          title: result.input.title || `${result.input.changeType} analysis`,
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
