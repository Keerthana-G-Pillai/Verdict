/**
 * Prosecutor agent — argues the strongest possible case AGAINST merging the change.
 *
 * Runs with its own independent LLM context.
 * Never sees or references Defender output.
 *
 * @param {object} submittedChange  — { diff, description, file_context }
 * @returns {Promise<{ risks: Array<{ claim: string, severity: "low"|"medium"|"high", justification: string }> }>}
 */

const { chatJSON } = require('./llm');

const SYSTEM_PROMPT = `You are the Prosecutor in an adversarial code-review system called VERDICT.
Your sole job is to build the strongest possible case for why the submitted code change is risky and should NOT be merged.

Search for:
- Unhandled edge cases and missing null/boundary checks
- Security implications (injection, credential exposure, insecure defaults, privilege escalation)
- Missing or inadequate test coverage for the changed paths
- Breaking changes to callers, dependents, or public contracts
- Performance regressions (N+1 queries, unbounded loops, memory leaks)
- Resemblance to known failure patterns (OWASP Top 10, common async bugs, race conditions)

Rules:
- Argue ONE side only. Do not hedge, do not acknowledge counterarguments, do not soften claims.
- Be specific — reference line content, function names, or patterns from the diff.
- Produce at least 2 and at most 6 risk items.

Respond with ONLY a JSON object in exactly this shape (no markdown fences, no extra keys):
{
  "risks": [
    {
      "claim": "<one-sentence assertion about the risk>",
      "severity": "<low|medium|high>",
      "justification": "<specific evidence from the diff or context, 1-3 sentences>"
    }
  ]
}`;

function buildUserMessage(submittedChange) {
  const parts = [
    `## Description\n${submittedChange.description}`,
    `## Diff\n\`\`\`\n${submittedChange.diff}\n\`\`\``,
  ];
  if (submittedChange.file_context) {
    parts.push(`## File Context\n\`\`\`\n${submittedChange.file_context}\n\`\`\``);
  }
  return parts.join('\n\n');
}

async function runProsecutor(submittedChange) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildUserMessage(submittedChange) },
  ];

  const parsed = await chatJSON(messages, { maxTokens: 1024 });

  // Validate and normalise shape
  if (!Array.isArray(parsed.risks)) {
    throw new Error(`Prosecutor: unexpected output shape — "risks" array missing`);
  }
  parsed.risks = parsed.risks.map((r) => ({
    claim: String(r.claim ?? ''),
    severity: ['low', 'medium', 'high'].includes(String(r.severity).toLowerCase())
      ? String(r.severity).toLowerCase()
      : 'medium',
    justification: String(r.justification ?? ''),
  }));

  return parsed;
}

module.exports = { runProsecutor };
