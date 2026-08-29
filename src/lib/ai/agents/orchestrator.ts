// ============================================================
// VERDICT — 4-Agent Orchestrator
//
// Execution order (from partner's orchestrator.js architecture):
//   Step 1 — Risk Intelligence + Safety Validation run in PARALLEL
//             with fully INDEPENDENT contexts. Neither sees the
//             other's output before producing its findings.
//   Step 2 — Validation Engine runs static analysis
//   Step 3 — Decision Engine (Judge) receives all three outputs
//             and synthesizes a verdict explanation
//
// The AI Judge EXPLAINS the verdict — it does NOT override the
// deterministic scoring engine. Scores and thresholds remain in
// verdict-engine.ts.
// ============================================================

import type { AgentTrialResult, RiskAgentOutput, SafetyAgentOutput } from "./types";
import type { ChangeType } from "@/lib/analysis/types";
import {
  RISK_SYSTEM_PROMPT,
  buildRiskUserMessage,
  parseRiskOutput,
} from "./risk-agent";
import {
  SAFETY_SYSTEM_PROMPT,
  buildSafetyUserMessage,
  parseSafetyOutput,
} from "./safety-agent";
import {
  buildJudgeSystemPrompt,
  buildJudgeUserMessage,
  parseJudgeOutput,
} from "./judge-agent";
import { runValidationEngine } from "./validation-engine";

export interface OrchestratorRequest {
  changeType: ChangeType;
  title: string;
  content: string;
  description?: string;
  language?: string;
  fileContext?: string;
}

// ── Low-level provider chat function ─────────────────────────
// Calls the given provider's raw chat endpoint.
// Providers expose a `chatRaw` method for direct message-based calls.
// Falls back gracefully on any provider error.

import type { ChatMessage } from "../types";
export type ChatFn = (messages: ChatMessage[], opts?: { maxTokens?: number }) => Promise<string>;

// ── Main orchestrator ─────────────────────────────────────────

export async function runAgentTrial(
  req: OrchestratorRequest,
  chatFn: ChatFn,
  providerName: string
): Promise<AgentTrialResult> {
  const changeForAgents = {
    changeType: req.changeType,
    title: req.title,
    content: req.content,
    description: req.description,
    language: req.language,
    fileContext: req.fileContext,
  };

  // ── Retry helper: up to 3 attempts with exponential backoff ──────────────
  // fn always returns a raw string from chatFn; parse converts to typed output.
  async function withRetry<T>(
    fn: () => Promise<string>,
    parse: (raw: string) => T,
    agentName: string
  ): Promise<T> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const raw = await fn();
        return parse(raw);
      } catch (err) {
        lastErr = err;
        console.warn(`[VERDICT] ${agentName} parse attempt ${attempt}/3 failed:`, err instanceof Error ? err.message : String(err));
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 300 * attempt));
        }
      }
    }
    throw lastErr;
  }

  // ── Step 1: Risk + Safety in TRUE PARALLEL, independent contexts ──────────
  const [riskOutput, safetyOutput] = await Promise.all([
    withRetry(
      () => chatFn([
        { role: "system", content: RISK_SYSTEM_PROMPT },
        { role: "user", content: buildRiskUserMessage(changeForAgents) },
      ], { maxTokens: 1200 }),
      parseRiskOutput,
      "RiskAgent"
    ),
    withRetry(
      () => chatFn([
        { role: "system", content: SAFETY_SYSTEM_PROMPT },
        { role: "user", content: buildSafetyUserMessage(changeForAgents) },
      ], { maxTokens: 1200 }),
      parseSafetyOutput,
      "SafetyAgent"
    ),
  ]);

  // ── Step 2: Validation Engine (static/deterministic, no fabrication) ──────
  const validationOutput = runValidationEngine({
    changeType: req.changeType,
    title: req.title,
    content: req.content,
    language: req.language,
  });

  // ── Step 3: Judge synthesizes all three outputs ───────────────────────────
  const judgeOutput = await withRetry(
    () => chatFn([
      { role: "system", content: buildJudgeSystemPrompt() },
      { role: "user", content: buildJudgeUserMessage(riskOutput, safetyOutput, validationOutput, req.title) },
    ], { maxTokens: 800 }),
    parseJudgeOutput,
    "JudgeAgent"
  );

  // ── Agent disagreement detection ─────────────────────────────────────────
  // Disagreement = Risk found ≥1 critical/high AND Safety found ≥2 strong claims,
  // or Judge verdict diverges significantly from what Risk severity implies.
  const highSeverityRisks = riskOutput.risks.filter((r) => r.severity === "critical" || r.severity === "high").length;
  const safetyClaimCount = safetyOutput.evidence.length;
  const agentDisagreement = highSeverityRisks >= 1 && safetyClaimCount >= 2;

  return {
    riskAgent: riskOutput,
    safetyAgent: safetyOutput,
    validationAgent: validationOutput,
    judgeAgent: judgeOutput,
    provider: providerName,
    aiEnhanced: true,
    parallelExecuted: true,
    agentDisagreement,
  };
}

// ── Deterministic fallback trial ──────────────────────────────
// Used when all AI providers are unavailable.
export function buildFallbackTrial(req: OrchestratorRequest): AgentTrialResult {
  const validationOutput = runValidationEngine({
    changeType: req.changeType,
    title: req.title,
    content: req.content,
    language: req.language,
  });

  return {
    riskAgent: {
      risks: [],
      evidenceLevel: "static_analysis",
      agentId: "risk_intelligence",
    },
    safetyAgent: {
      evidence: [],
      evidenceLevel: "static_analysis",
      agentId: "safety_validation",
    },
    validationAgent: validationOutput,
    judgeAgent: {
      verdictSuggestion: "REQUIRES_REVISION",
      reasoning: "AI analysis unavailable. Verdict is based on deterministic analysis only.",
      conditions: [],
      saferAlternative: null,
      agentId: "decision_engine",
    },
    provider: "fallback",
    aiEnhanced: false,
    parallelExecuted: false,
  };
}
