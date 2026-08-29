// ============================================================
// VERDICT — Safety Validation Agent
//
// Adversarial framing: argues the strongest possible case FOR
// the change being safe to merge. Runs with an INDEPENDENT
// context — never sees Risk Intelligence output.
//
// Ported and enhanced from partner's defender.js.
// Converted to TypeScript with Groq/OpenRouter support.
// ============================================================

import type { SafetyAgentOutput, EvidenceLevel } from "./types";

export const SAFETY_SYSTEM_PROMPT = `You are the Safety Validation agent in VERDICT, an AI-powered change intelligence platform.

Your sole job is to build the strongest possible case for why this proposed change is SAFE and SHOULD be merged or deployed.

Search for evidence of safety:
- Existing test coverage that exercises the changed code paths
- Narrow, well-scoped nature of the change (small blast radius, limited surface area)
- Defensive patterns already present in surrounding code (input validation, error handling, guards, circuit breakers)
- Precedent from similar changes that have shipped successfully
- Framework or library safeguards that mitigate apparent risks
- Clear alignment between stated intent and actual implementation
- Rollback capability or feature flag protection
- Backward compatibility preservation
- Idempotency or safe retry semantics
- Monitoring and observability already in place

Rules:
- Argue ONE side only. Do not hedge, do not acknowledge counterarguments, do not soften claims.
- Be specific — reference existing safeguards, function names, or patterns from the diff or context.
- Every evidence item must be grounded in the actual change content or reasonable inference from it.
- Produce at least 2 and at most 6 evidence items.

Respond with ONLY a JSON object (no markdown fences, no extra text):
{
  "evidence": [
    {
      "claim": "<one-sentence assertion about why this change is safe>",
      "justification": "<specific evidence from the change or its context, 1-3 sentences>",
      "affectedArea": "<component or service name>"
    }
  ]
}`;

export function buildSafetyUserMessage(change: {
  changeType: string;
  title: string;
  content: string;
  description?: string;
  language?: string;
  fileContext?: string;
}): string {
  const parts: string[] = [];
  parts.push(`## Change Type\n${change.changeType}`);
  parts.push(`## Title\n${change.title}`);
  if (change.language) parts.push(`## Language\n${change.language}`);
  if (change.description) parts.push(`## Description\n${change.description}`);
  if (change.fileContext) parts.push(`## Repository / File Context\n${change.fileContext}`);
  parts.push(`## Change Content\n\`\`\`\n${change.content.slice(0, 3000)}\n\`\`\``);
  return parts.join("\n\n");
}

export function parseSafetyOutput(raw: string): SafetyAgentOutput {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const parsed = JSON.parse(stripped);

  if (!Array.isArray(parsed.evidence)) {
    throw new Error(`Safety agent: "evidence" array missing from response`);
  }

  const evidence = parsed.evidence.map((e: Record<string, unknown>) => ({
    claim: String(e.claim ?? ""),
    justification: String(e.justification ?? ""),
    affectedArea: e.affectedArea ? String(e.affectedArea) : undefined,
  }));

  const evidenceLevel: EvidenceLevel = "static_analysis";

  return {
    evidence,
    evidenceLevel,
    agentId: "safety_validation",
  };
}
