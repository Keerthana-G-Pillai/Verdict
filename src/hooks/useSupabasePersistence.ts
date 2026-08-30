// ============================================================
// VERDICT — useSupabasePersistence
// Syncs completed analyses/simulations to Supabase when user
// is authenticated. Gracefully handles unconfigured Supabase.
// ============================================================

"use client";

import { useCallback } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "@/lib/auth/auth-context";
import { SUPABASE_CONFIGURED } from "@/lib/supabase/client";
import type { AnalysisResult, MemoryRecord } from "@/lib/analysis/types";
import type { SimulationResult, SimulationMemoryRecord } from "@/lib/simulation/types";

export interface PersistResult {
  success: boolean;
  error?: string;
}

export function useSupabasePersistence() {
  const { user } = useAuth();

  // Lazy Supabase client — only initialised when configured
  // Typed as generic SupabaseClient to avoid template inference issues
  const getSupabase = useCallback(async (): Promise<SupabaseClient | null> => {
    if (!SUPABASE_CONFIGURED) return null;
    const { createClient } = await import("@/lib/supabase/client");
    return createClient() as SupabaseClient;
  }, []);

  // ── Save analysis ────────────────────────────────────────────
  const saveAnalysisToDb = useCallback(async (result: AnalysisResult): Promise<PersistResult> => {
    if (!user) return { success: false, error: "Not authenticated" };
    if (!result.analyzedAt) return { success: false, error: "Analysis not complete" };
    const supabase = await getSupabase();
    if (!supabase) return { success: false, error: "Cloud storage not configured" };

    const { error } = await supabase.from("analyses").upsert({
      id: result.id,
      user_id: user.id,
      title: result.input.title || `${result.input.changeType} analysis`,
      change_type: result.input.changeType,
      language: result.input.language ?? null,
      domain: result.context?.detectedDomain ?? null,
      verdict: result.verdict,
      risk_score: result.riskScore,
      confidence: result.confidence,
      critical_count: result.criticalCount,
      high_count: result.highCount,
      result: result as unknown as Record<string, unknown>,
      ai_provider: (result as { aiProvider?: string }).aiProvider ?? null,
      ai_enhanced: (result as { aiEnhanced?: boolean }).aiEnhanced ?? false,
      created_at: result.analyzedAt,
    }, { onConflict: "id" });

    if (error) {
      console.error("[VERDICT DB] saveAnalysis error:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  }, [user, getSupabase]);

  // ── Save to memory (bookmark) ────────────────────────────────
  const saveToMemoryDb = useCallback(async (analysisId: string): Promise<PersistResult> => {
    if (!user) return { success: false, error: "Not authenticated" };
    const supabase = await getSupabase();
    if (!supabase) return { success: false, error: "Cloud storage not configured" };

    const { error } = await supabase.from("memory").upsert({
      user_id: user.id,
      analysis_id: analysisId,
    }, { onConflict: "user_id,analysis_id" });

    if (error) return { success: false, error: error.message };
    return { success: true };
  }, [user, getSupabase]);

  // ── Remove from memory ───────────────────────────────────────
  const removeFromMemoryDb = useCallback(async (analysisId: string): Promise<PersistResult> => {
    if (!user) return { success: false, error: "Not authenticated" };
    const supabase = await getSupabase();
    if (!supabase) return { success: false, error: "Cloud storage not configured" };

    const { error } = await supabase
      .from("memory")
      .delete()
      .eq("user_id", user.id)
      .eq("analysis_id", analysisId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }, [user, getSupabase]);

  // ── Save simulation ──────────────────────────────────────────
  const saveSimulationToDb = useCallback(async (result: SimulationResult): Promise<PersistResult> => {
    if (!user) return { success: false, error: "Not authenticated" };
    if (!result.analyzedAt) return { success: false, error: "Simulation not complete" };
    const supabase = await getSupabase();
    if (!supabase) return { success: false, error: "Cloud storage not configured" };

    const { error } = await supabase.from("simulations").upsert({
      id: result.id,
      user_id: user.id,
      title_a: result.input.changeA.title,
      title_b: result.input.changeB.title,
      domains_a: result.domainsA ?? [],
      domains_b: result.domainsB ?? [],
      conflict_count: result.conflictCount,
      critical_conflict_count: result.criticalConflictCount,
      integration_risk_score: result.integrationRiskScore,
      verdict: result.verdict,
      verdict_rationale: result.verdictRationale,
      result: result as unknown as Record<string, unknown>,
      ai_provider: (result as { aiProvider?: string }).aiProvider ?? null,
      created_at: result.analyzedAt,
    }, { onConflict: "id" });

    if (error) {
      console.error("[VERDICT DB] saveSimulation error:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  }, [user, getSupabase]);

  // ── Save simulation to memory ────────────────────────────────
  const saveSimulationToMemoryDb = useCallback(async (simId: string): Promise<PersistResult> => {
    if (!user) return { success: false, error: "Not authenticated" };
    const supabase = await getSupabase();
    if (!supabase) return { success: false, error: "Cloud storage not configured" };

    const { error } = await supabase.from("simulation_memory").upsert({
      user_id: user.id,
      simulation_id: simId,
    }, { onConflict: "user_id,simulation_id" });

    if (error) return { success: false, error: error.message };
    return { success: true };
  }, [user, getSupabase]);

  // ── Remove simulation from memory ───────────────────────────
  const removeSimulationFromMemoryDb = useCallback(async (simId: string): Promise<PersistResult> => {
    if (!user) return { success: false, error: "Not authenticated" };
    const supabase = await getSupabase();
    if (!supabase) return { success: false, error: "Cloud storage not configured" };

    const { error } = await supabase
      .from("simulation_memory")
      .delete()
      .eq("user_id", user.id)
      .eq("simulation_id", simId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }, [user, getSupabase]);

  // ── Fetch all memory records for authenticated user ──────────
  const fetchMemory = useCallback(async (): Promise<{ analyses: AnalysisResult[]; simulations: SimulationResult[] }> => {
    if (!user) return { analyses: [], simulations: [] };
    const supabase = await getSupabase();
    if (!supabase) return { analyses: [], simulations: [] };

    const [memRes, simMemRes] = await Promise.all([
      supabase
        .from("memory")
        .select("analysis_id, saved_at, analyses(*)")
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false })
        .limit(50),
      supabase
        .from("simulation_memory")
        .select("simulation_id, saved_at, simulations(*)")
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false })
        .limit(50),
    ]);

    const analyses: AnalysisResult[] = [];
    const simulations: SimulationResult[] = [];

    if (memRes.data) {
      for (const row of memRes.data) {
        const analysis = (row as { analyses: unknown }).analyses;
        if (analysis && typeof analysis === "object" && "result" in analysis) {
          analyses.push((analysis as { result: AnalysisResult }).result);
        }
      }
    }

    if (simMemRes.data) {
      for (const row of simMemRes.data) {
        const sim = (row as { simulations: unknown }).simulations;
        if (sim && typeof sim === "object" && "result" in sim) {
          simulations.push((sim as { result: SimulationResult }).result);
        }
      }
    }

    return { analyses, simulations };
  }, [user, getSupabase]);

  return {
    isAuthenticated: !!user,
    saveAnalysisToDb,
    saveToMemoryDb,
    removeFromMemoryDb,
    saveSimulationToDb,
    saveSimulationToMemoryDb,
    removeSimulationFromMemoryDb,
    fetchMemory,
  };
}

// ── Helper: convert analysis result to MemoryRecord format ───
export function analysisToMemoryRecord(result: AnalysisResult, savedAt: string): MemoryRecord {
  return {
    id: result.id,
    title: result.input.title || `${result.input.changeType} analysis`,
    changeType: result.input.changeType,
    riskScore: result.riskScore,
    confidence: result.confidence,
    verdict: result.verdict,
    verdictRationale: result.verdictRationale,
    criticalCount: result.criticalCount,
    highCount: result.highCount,
    savedAt,
    result,
  };
}

// ── Helper: convert simulation result to SimulationMemoryRecord format ──
export function simulationToMemoryRecord(result: SimulationResult, savedAt: string): SimulationMemoryRecord {
  return {
    id: result.id,
    titleA: result.input.changeA.title,
    titleB: result.input.changeB.title,
    domainsA: result.domainsA ?? [],
    domainsB: result.domainsB ?? [],
    conflictCount: result.conflictCount,
    criticalConflictCount: result.criticalConflictCount,
    integrationRiskScore: result.integrationRiskScore,
    verdict: result.verdict,
    verdictRationale: result.verdictRationale,
    savedAt,
    result,
  };
}
