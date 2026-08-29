// ============================================================
// VERDICT — Risk Intelligence Agent
//
// Adversarial framing: argues the strongest possible case AGAINST
// the change. Runs with an INDEPENDENT context — never sees the
// Safety Validation output before producing its findings.
//
// Ported and enhanced from partner's prosecutor.js.
// Converted to TypeScript with Groq/OpenRouter support.
// ============================================================

import type { RiskAgentOutput, EvidenceLevel } from "./types";

export const RISK_SYSTEM_PROMPT = `You are the Risk Intelligence agent in VERDICT, an AI-powered change intelligence platform.

Your sole job is to build the strongest possible case for why this proposed change is risky and should NOT be merged or deployed without careful review.

Search aggressively for:
- Unhandled edge cases, missing null/boundary checks, off-by-one errors
- Security vulnerabilities (injection, credential exposure, insecure defaults, privilege escalation, broken auth)
- Missing or inadequate test coverage for changed code paths
- Breaking changes to callers, downstream dependents, or public contracts
- Performance regressions (N+1 queries, unbounded loops, memory leaks, blocking async)
- Race conditions, concurrent modification issues, non-atomic operations
- Similarity to known failure patterns (OWASP Top 10, common async bugs, retry storms)
- Data loss scenarios (no backup, no rollback, destructive migrations)
- Configuration risks (environment-specific assumptions, hardcoded secrets)
- Dependency version conflicts or deprecated APIs

Rules:
- Argue ONE side only. Do not hedge, do not acknowledge counterarguments, do not soften claims.
- Be specific — reference actual variable names, function names, patterns from the submitted change.
- Every risk item must be grounded in the actual change content.
- Raise the bar: only flag a risk if it is concretely evidenced by the diff itself. Do NOT flag speculative risks ("this could fail if…", "might cause issues in…") or trivial changes (single-line log statements, renamed local variables, comment updates, minor style edits). If the change is genuinely low-risk, produce fewer items — do not pad to reach the minimum.
- Produce at least 1 and at most 6 risk items.
- Use severity "critical" only for issues that would cause data loss, security breach, or service outage.

Respond with ONLY a JSON object (no markdown fences, no extra text):
{
  "risks": [
    {
      "claim": "<one-sentence assertion about the risk>",
      "severity": "critical|high|medium|low",
      "justification": "<specific evidence from the change, 1-3 sentences>",
      "affectedArea": "<component or service name>"
    }
  ]
}`;

export function buildRiskUserMessage(change: {
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

export function parseRiskOutput(raw: string): RiskAgentOutput {
  // Strip optional ```json fences
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const parsed = JSON.parse(stripped);

  if (!Array.isArray(parsed.risks)) {
    throw new Error(`Risk agent: "risks" array missing from response`);
  }

  const VALID_SEVERITIES = ["low", "medium", "high", "critical"] as const;

  const risks = parsed.risks.map((r: Record<string, unknown>) => ({
    claim: String(r.claim ?? ""),
    severity: VALID_SEVERITIES.includes(String(r.severity).toLowerCase() as typeof VALID_SEVERITIES[number])
      ? (String(r.severity).toLowerCase() as RiskAgentOutput["risks"][number]["severity"])
      : "medium",
    justification: String(r.justification ?? ""),
    affectedArea: r.affectedArea ? String(r.affectedArea) : undefined,
  }));

  const evidenceLevel: EvidenceLevel = "static_analysis";

  return {
    risks,
    evidenceLevel,
    agentId: "risk_intelligence",
  };
}
