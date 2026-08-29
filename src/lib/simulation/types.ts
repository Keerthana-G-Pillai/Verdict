// ============================================================
// VERDICT Merge Simulation — Core Type System
// ============================================================

import type { ChangeType } from "@/lib/analysis/types";

export type SimConflictSeverity = "critical" | "high" | "medium" | "low";
export type SimConflictType =
  | "direct"          // Same code/function modified incompatibly
  | "semantic"        // Behavioral assumption clash — "Git sees no conflict. VERDICT found one."
  | "contract"        // API/data contract incompatibility
  | "state"           // Shared state assumption conflict
  | "ordering"        // Timing / sequencing conflict
  | "configuration";  // Config/env conflict

export type IntegrationVerdictOutcome =
  | "safe_to_integrate"
  | "approved_with_conditions"
  | "conflict_detected"
  | "requires_revision";

export type SimPipelineStageId =
  | "compare_changes"
  | "detect_overlap"
  | "analyze_semantics"
  | "simulate_integration"
  | "validate_coexistence"
  | "integration_verdict";

export type SimPipelineStageStatus = "waiting" | "running" | "complete" | "warning" | "failed";

// ── One submitted change ─────────────────────────────────────
export interface SimulationChange {
  id: "a" | "b";
  title: string;
  changeType: ChangeType;
  language?: string;
  content: string;
  description?: string;
}

// ── Simulation input ─────────────────────────────────────────
export interface SimulationInput {
  id: string;
  changeA: SimulationChange;
  changeB: SimulationChange;
  createdAt: string;
}

// ── Domain overlap ────────────────────────────────────────────
export interface DomainOverlap {
  domain: string;
  sharedKeywords: string[];
  sharedAreas: string[];
  overlapScore: number; // 0–1
}

// ── A single conflict ─────────────────────────────────────────
export interface SimConflict {
  id: string;
  type: SimConflictType;
  severity: SimConflictSeverity;
  title: string;
  description: string;

  // What each side assumes / does
  changeAAssumption: string;
  changeBAssumption: string;

  // Why they collide
  collisionReason: string;

  // What happens if merged without resolution
  consequence: string;

  // How to fix it
  resolution: string;

  // Specific areas touched
  affectedArea: string;
  confidence: number;
}

// ── Pipeline stage ────────────────────────────────────────────
export interface SimPipelineStage {
  id: SimPipelineStageId;
  label: string;
  shortLabel: string;
  icon: string;
  status: SimPipelineStageStatus;
  startedAt?: number;
  completedAt?: number;
  summary?: string;
}

// ── Live event ────────────────────────────────────────────────
export interface SimEvent {
  id: string;
  stageId: SimPipelineStageId;
  message: string;
  detail?: string;
  timestamp: number;
  type: "info" | "warning" | "error" | "success";
}

// ── Integration check result ──────────────────────────────────
export interface IntegrationCheck {
  label: string;
  category: "build" | "api_contracts" | "shared_state" | "behavioral" | "execution";
  outcome: "compatible" | "conflict" | "warning" | "not_connected" | "skipped";
  detail: string;
  analysisType: "static_analysis" | "inferred" | "execution_evidence";
  confidence: number;
}

// ── Integration strategy step ─────────────────────────────────
export interface IntegrationStep {
  order: number;
  action: string;
  rationale: string;
  priority: "required" | "recommended" | "optional";
}

// ── Full simulation result ────────────────────────────────────
export interface SimulationResult {
  id: string;
  input: SimulationInput;

  // Pipeline
  stages: SimPipelineStage[];
  events: SimEvent[];

  // Intelligence output
  domainsA: string[];
  domainsB: string[];
  domainOverlaps: DomainOverlap[];
  directConflicts: SimConflict[];
  semanticConflicts: SimConflict[];
  integrationChecks: IntegrationCheck[];
  integrationSteps: IntegrationStep[];

  // Verdict
  integrationRiskScore: number;
  confidence: number;
  conflictCount: number;
  criticalConflictCount: number;
  verdict: IntegrationVerdictOutcome;
  verdictRationale: string;

  // Meta
  analyzedAt: string;
  executionMs: number;
}

// ── Persisted simulation memory record ───────────────────────
export interface SimulationMemoryRecord {
  id: string;
  titleA: string;
  titleB: string;
  domainsA: string[];
  domainsB: string[];
  conflictCount: number;
  criticalConflictCount: number;
  integrationRiskScore: number;
  verdict: IntegrationVerdictOutcome;
  verdictRationale: string;
  savedAt: string;
  result: SimulationResult;
}

// ── Simulator contract ────────────────────────────────────────
export interface Simulator {
  simulate(
    input: SimulationInput,
    onEvent: (event: SimEvent) => void,
    onStageUpdate: (stageId: SimPipelineStageId, status: SimPipelineStageStatus, summary?: string) => void
  ): Promise<SimulationResult>;
}
