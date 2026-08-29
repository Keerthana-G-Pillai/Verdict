// ============================================================
// VERDICT — Multi-Agent Type System
// 4-agent adversarial pipeline:
//   Risk Intelligence (Prosecutor) ─┐
//                                    ├─► Decision Engine (Judge)
//   Safety Validation (Defender)  ─┘
//          ↓
//   Validation Engine (Experimenter — static/deterministic)
//
// Agents run with INDEPENDENT contexts. Risk never sees Safety
// output before forming its findings, and vice versa.
// ============================================================

// ── Evidence level taxonomy ──────────────────────────────────
// Displayed in the UI to distinguish evidence quality.
export type EvidenceLevel =
  | "execution_evidence"   // Real code was run in an isolated environment
  | "static_analysis"      // Pattern-based analysis of code structure
  | "inferred_risk"        // Probabilistic inference from patterns and context
  | "not_executable";      // Cannot be executed — decision-only change

// ── Risk Intelligence Agent output ──────────────────────────
export interface RiskFinding {
  claim: string;
  severity: "low" | "medium" | "high" | "critical";
  justification: string;
  affectedArea?: string;
}

export interface RiskAgentOutput {
  risks: RiskFinding[];
  evidenceLevel: EvidenceLevel;
  agentId: "risk_intelligence";
}

// ── Safety Validation Agent output ──────────────────────────
export interface SafetyEvidence {
  claim: string;
  justification: string;
  affectedArea?: string;
}

export interface SafetyAgentOutput {
  evidence: SafetyEvidence[];
  evidenceLevel: EvidenceLevel;
  agentId: "safety_validation";
}

// ── Validation Engine output ─────────────────────────────────
// Static + deterministic — never fabricates execution.
export interface ValidationAgentOutput {
  executed: boolean;
  result: "PASS" | "FAIL" | "PARTIAL" | "NOT_EXECUTABLE" | "STATIC_ANALYSIS";
  details: string;
  unexpectedFindings: string | null;
  evidenceLevel: EvidenceLevel;
  agentId: "validation_engine";
}

// ── Decision Engine (Judge) output ───────────────────────────
// AI may explain the verdict, but NEVER overrides the
// deterministic scoring engine's safety thresholds.
export interface JudgeAgentOutput {
  verdictSuggestion: "APPROVED" | "APPROVED_WITH_CONDITIONS" | "REQUIRES_REVISION" | "REJECTED";
  reasoning: string;
  conditions: string[];
  saferAlternative: string | null;
  agentId: "decision_engine";
}

// ── Full 4-agent trial result ─────────────────────────────────
export interface AgentTrialResult {
  riskAgent: RiskAgentOutput;
  safetyAgent: SafetyAgentOutput;
  validationAgent: ValidationAgentOutput;
  judgeAgent: JudgeAgentOutput;
  provider: string;
  aiEnhanced: boolean;
  parallelExecuted: boolean;  // true if Risk + Safety ran in true parallel
}
