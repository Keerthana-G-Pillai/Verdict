// ============================================================
// VERDICT — Decision Engine (Judge Agent)
//
// The Judge synthesizes outputs from Risk Intelligence and Safety
// Validation to produce a human-readable explanation of the verdict.
//
// IMPORTANT: The Judge does NOT override the deterministic verdict
// engine. The deterministic scoring engine remains the source of
// truth for all safety thresholds. The Judge's role is:
//   - Synthesize the adversarial evidence
//   - Explain WHY the verdict was reached
//   - Surface disagreements between agents
//   - Suggest conditions or safer alternatives
//   - Produce a readable rationale
//
// Based on partner's judge.js, fully implemented (not a stub).
// ============================================================

import type { RiskAgentOutput, SafetyAgentOutput, ValidationAgentOutput, JudgeAgentOutput } from "./types";

export function buildJudgeSystemPrompt(): string {
  return `You are the Decision Engine in VERDICT, an AI-powered change intelligence platform.

You receive evidence from three independent sources:
1. Risk Intelligence Agent — found reasons the change should NOT be merged
2. Safety Validation Agent — found reasons the change IS safe to merge  
3. Validation Engine — static/deterministic analysis results

Your job is to synthesize this evidence into a final verdict explanation. Be precise, balanced, and specific.

Rules:
- Weigh the SEVERITY of risks against the STRENGTH of safety evidence
- A single "critical" risk outweighs multiple "low" safety claims
- Execution evidence (if available) carries more weight than inferred analysis
- Acknowledge genuine disagreements between Risk and Safety agents
- Your verdict suggestion must match the weight of evidence
- Be concise but specific — reference actual claims from the agents

Respond with ONLY a JSON object (no markdown fences, no extra text):
{
  "verdictSuggestion": "APPROVED|APPROVED_WITH_CONDITIONS|REQUIRES_REVISION|REJECTED",
  "reasoning": "<2-4 sentence explanation of the verdict, referencing specific agent findings>",
  "conditions": ["<condition 1 if any>", "<condition 2 if any>"],
  "saferAlternative": "<one specific safer implementation suggestion, or null>"
}`;
}

export function buildJudgeUserMessage(
  riskOutput: RiskAgentOutput,
  safetyOutput: SafetyAgentOutput,
  validationOutput: ValidationAgentOutput,
  changeTitle: string
): string {
  const riskSummary = riskOutput.risks.map((r, i) =>
    `  ${i + 1}. [${r.severity.toUpperCase()}] ${r.claim}\n     ${r.justification}`
  ).join("\n");

  const safetySummary = safetyOutput.evidence.map((e, i) =>
    `  ${i + 1}. ${e.claim}\n     ${e.justification}`
  ).join("\n");

  return `## Change Being Evaluated
${changeTitle}

## Risk Intelligence Findings (${riskOutput.risks.length} risks found)
${riskSummary || "  (no risks identified)"}

## Safety Validation Evidence (${safetyOutput.evidence.length} safety factors found)
${safetySummary || "  (no safety evidence identified)"}

## Validation Engine Result
Status: ${validationOutput.result}
Details: ${validationOutput.details}
${validationOutput.unexpectedFindings ? `Unexpected findings: ${validationOutput.unexpectedFindings}` : "No unexpected findings."}

Based on this evidence, provide your verdict synthesis.`;
}

export function parseJudgeOutput(raw: string): JudgeAgentOutput {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const parsed = JSON.parse(stripped);

  const VALID_VERDICTS = ["APPROVED", "APPROVED_WITH_CONDITIONS", "REQUIRES_REVISION", "REJECTED"] as const;

  const verdictSuggestion = VALID_VERDICTS.includes(String(parsed.verdictSuggestion).toUpperCase() as typeof VALID_VERDICTS[number])
    ? String(parsed.verdictSuggestion).toUpperCase() as JudgeAgentOutput["verdictSuggestion"]
    : "REQUIRES_REVISION";

  return {
    verdictSuggestion,
    reasoning: String(parsed.reasoning ?? ""),
    conditions: Array.isArray(parsed.conditions) ? parsed.conditions.map(String) : [],
    saferAlternative: parsed.saferAlternative ? String(parsed.saferAlternative) : null,
    agentId: "decision_engine",
  };
}
