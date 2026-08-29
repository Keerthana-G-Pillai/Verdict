// ============================================================
// VERDICT Analysis Engine — Core Type System
// All analysis data structures are defined here.
// UI components consume these types; analyzers produce them.
// ============================================================

export type ChangeType = "code" | "diff" | "pr" | "decision";
export type Severity = "info" | "low" | "medium" | "high" | "critical";
export type VerdictOutcome = "approved" | "approved_with_conditions" | "requires_revision" | "rejected";
export type EvidenceCategory = "static_analysis" | "inferred_risk" | "validation_available" | "execution_evidence" | "context";

export type PipelineStageId =
  | "understand_context"
  | "risk_intelligence"
  | "safety_validation"
  | "simulation"
  | "decision_engine";

export type PipelineStageStatus = "waiting" | "running" | "complete" | "warning" | "failed";

// ── Input submitted by the user ─────────────────────────────
export interface AnalysisInput {
  id: string;
  title: string;
  changeType: ChangeType;
  language?: string;
  content: string;          // The main change content (code, diff, description)
  description?: string;     // Additional context
  projectContext?: string;  // Repo / service name
  fileContext?: string;     // Repository / file path context (from partner's file_context)
  createdAt: string;        // ISO timestamp
}

// ── Individual finding ──────────────────────────────────────
export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: "risk" | "safety" | "info";
  affectedArea?: string;
  recommendation?: string;
  evidence?: string;
  confidence: number;       // 0–100
}

// ── Piece of evidence backing the verdict ───────────────────
export interface EvidenceItem {
  id: string;
  label: string;
  detail: string;
  category: EvidenceCategory;
  weight: "supporting" | "against" | "neutral";
  confidence: number;
}

// ── Pipeline stage progress ─────────────────────────────────
export interface PipelineStage {
  id: PipelineStageId;
  label: string;
  shortLabel: string;
  icon: string;
  status: PipelineStageStatus;
  startedAt?: number;       // ms since epoch
  completedAt?: number;
  summary?: string;
  eventCount?: number;
}

// ── Live event emitted during analysis ──────────────────────
export interface AnalysisEvent {
  id: string;
  stageId: PipelineStageId;
  message: string;
  detail?: string;
  timestamp: number;
  type: "info" | "warning" | "error" | "success";
}

// ── Per-stage context result ─────────────────────────────────
export interface ContextResult {
  summary: string;
  changeType: ChangeType;
  detectedLanguage?: string;
  detectedDomain: string;
  affectedAreas: string[];
  dependencies: string[];
  scope: "narrow" | "moderate" | "broad" | "system-wide";
}

// ── Simulation / validation result ──────────────────────────
export interface SimulationResult {
  type: "static_analysis" | "inferred" | "execution";
  label: string;
  outcome: "passed" | "failed" | "warning" | "skipped" | "no_environment";
  detail: string;
  confidence: number;
}

// ── Complete analysis result ─────────────────────────────────
export interface AnalysisResult {
  id: string;
  input: AnalysisInput;

  // Pipeline
  stages: PipelineStage[];
  events: AnalysisEvent[];

  // Core intelligence
  context: ContextResult;
  riskFindings: Finding[];
  safetyFindings: Finding[];
  simulationResults: SimulationResult[];
  evidence: EvidenceItem[];

  // Scoring
  riskScore: number;        // 0–100
  confidence: number;       // 0–100
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;

  // Verdict
  verdict: VerdictOutcome;
  verdictRationale: string;
  conditions: string[];
  recommendations: string[];

  // Meta
  analyzedAt: string;       // ISO timestamp
  analyzerVersion: string;
  executionMs: number;

  // AI enhancement metadata — set by mergeAgentTrial when AI ran successfully.
  // Used by the result page to: (a) display the correct badge, (b) skip
  // re-running the AI layer on revisit (avoids double-billing API calls).
  aiEnhanced?: boolean;
  aiProvider?: string;
}

// ── Persisted memory record ──────────────────────────────────
export interface MemoryRecord {
  id: string;
  title: string;
  changeType: ChangeType;
  riskScore: number;
  confidence: number;
  verdict: VerdictOutcome;
  verdictRationale: string;
  criticalCount: number;
  highCount: number;
  savedAt: string;
  result: AnalysisResult;
}

// ── Analyzer contract ────────────────────────────────────────
export interface Analyzer {
  analyze(
    input: AnalysisInput,
    onEvent: (event: AnalysisEvent) => void,
    onStageUpdate: (stageId: PipelineStageId, status: PipelineStageStatus, summary?: string) => void
  ): Promise<AnalysisResult>;
}
