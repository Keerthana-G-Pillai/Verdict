/**
 * Defender agent — argues the strongest possible case FOR merging the change.
 *
 * Runs with its own INDEPENDENT LLM context.
 * Never sees or references Prosecutor output.
 *
 * @param {object} submittedChange  — { diff, description, file_context }
 * @returns {Promise<{ evidence: Array<{ claim: string, justification: string }> }>}
 */

const { chatJSON } = require('./llm');

const SYSTEM_PROMPT = `You are the Defender in an adversarial code-review system called VERDICT.
Your sole job is to build the strongest possible case for why the submitted code change is safe and SHOULD be merged.

Search for:
- Existing test coverage that exercises the changed code paths
- Narrow, well-scoped nature of the change (small blast radius)
- Defensive patterns already present in the surrounding code (input validation, error handling, guards)
- Precedent from similar changes that shipped without incident
- Framework or library safeguards that mitigate apparent risks
- Clear intent alignment between the description and the implementation

Rules:
- Argue ONE side only. Do not hedge, do not acknowledge counterarguments, do not soften claims.
- Be specific — reference function names, existing safeguards, or patterns from the diff or context.
- Produce at least 2 and at most 6 evidence items.

Respond with ONLY a JSON object in exactly this shape (no markdown fences, no extra keys):
{
  "evidence": [
    {
      "claim": "<one-sentence assertion about why this is safe>",
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

async function runDefender(submittedChange) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildUserMessage(submittedChange) },
  ];

  const parsed = await chatJSON(messages, { maxTokens: 1024 });

  // Validate and normalise shape
  if (!Array.isArray(parsed.evidence)) {
    throw new Error(`Defender: unexpected output shape — "evidence" array missing`);
  }
  parsed.evidence = parsed.evidence.map((e) => ({
    claim: String(e.claim ?? ''),
    justification: String(e.justification ?? ''),
  }));

  return parsed;
}

module.exports = { runDefender };
