// ============================================================
// POST /api/simulate
// Merge simulation endpoint — semantic conflict detection via AI.
// Falls back to deterministic analysis if AI is unavailable.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getAvailableChatFn } from "@/lib/ai/provider-manager";
import { validateSimulationResponse } from "@/lib/ai/validator";
import type { AISimulationRequest } from "@/lib/ai/types";
import type { ChatMessage } from "@/lib/ai/types";

// ── Conflict detection prompt ─────────────────────────────────
function buildConflictSystemPrompt(): string {
  return `You are a semantic conflict detection agent in VERDICT, an AI-powered change intelligence platform.

You receive two independent engineering changes and must identify conflicts that Git cannot detect — behavioral incompatibilities, shared-state assumptions, contract mismatches, and ordering dependencies.

Rules:
- Focus on SEMANTIC conflicts — ones that only appear at runtime, not in a diff
- A conflict exists when Change A assumes something about the system that Change B invalidates, or vice versa
- Be specific — name the exact mechanisms that clash
- If changes are genuinely unrelated, return an empty conflicts array
- Produce 0–4 conflicts maximum

Respond with ONLY a JSON object (no markdown fences, no extra text):
{
  "domainsA": ["<domain>"],
  "domainsB": ["<domain>"],
  "directConflicts": [],
  "semanticConflicts": [
    {
      "title": "<short conflict title>",
      "description": "<1-2 sentence description>",
      "type": "semantic|direct|contract|state|ordering|configuration",
      "severity": "critical|high|medium|low",
      "changeAAssumption": "<what change A assumes>",
      "changeBAssumption": "<what change B assumes>",
      "collisionReason": "<why these assumptions are incompatible>",
      "consequence": "<what happens if both are merged>",
      "resolution": "<how to resolve the conflict>",
      "affectedArea": "<component or service>",
      "confidence": 85
    }
  ],
  "recommendations": ["<recommendation>"],
  "confidence": 80,
  "reasoningSummary": "<1-2 sentence overall summary>"
}`;
}

function buildConflictUserMessage(req: AISimulationRequest): string {
  return `## Change A: ${req.changeA.title}
Type: ${req.changeA.changeType}
${req.changeA.language ? `Language: ${req.changeA.language}` : ""}
${req.changeA.description ? `Context: ${req.changeA.description}` : ""}

\`\`\`
${req.changeA.content.slice(0, 2000)}
\`\`\`

## Change B: ${req.changeB.title}
Type: ${req.changeB.changeType}
${req.changeB.language ? `Language: ${req.changeB.language}` : ""}
${req.changeB.description ? `Context: ${req.changeB.description}` : ""}

\`\`\`
${req.changeB.content.slice(0, 2000)}
\`\`\`

Identify all semantic conflicts between these two changes.`;
}

function parseAndValidateConflictOutput(raw: string) {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const parsed = JSON.parse(stripped);
  // Run through the validator to ensure proper AISimulationResponse shape
  return validateSimulationResponse(parsed);
}

async function runSimulationWithAI(
  req: AISimulationRequest,
  chatFn: (messages: ChatMessage[], opts?: { maxTokens?: number }) => Promise<string>
) {
  const messages: ChatMessage[] = [
    { role: "system", content: buildConflictSystemPrompt() },
    { role: "user",   content: buildConflictUserMessage(req) },
  ];
  const raw = await chatFn(messages, { maxTokens: 1500 });
  return parseAndValidateConflictOutput(raw);
}

export async function POST(req: NextRequest) {
  try {
    const body: AISimulationRequest = await req.json();

    if (!body.changeA?.content || !body.changeB?.content) {
      return NextResponse.json({ error: "Both changes required" }, { status: 400 });
    }

    const chatProvider = await getAvailableChatFn();

    if (!chatProvider) {
      console.warn("[/api/simulate] No AI provider available — deterministic only");
      return NextResponse.json({ data: null, provider: "fallback", aiEnhanced: false });
    }

    console.log(`[/api/simulate] Running conflict detection with provider: ${chatProvider.providerName}`);

    const validated = await runSimulationWithAI(body, chatProvider.chatFn);

    console.log(`[/api/simulate] Complete — provider: ${chatProvider.providerName}`);
    return NextResponse.json({
      data: validated,
      provider: chatProvider.providerName,
      aiEnhanced: true,
    });

  } catch (err) {
    console.error("[/api/simulate] Unhandled error — falling back to deterministic:", err);
    return NextResponse.json(
      { data: null, provider: "fallback", aiEnhanced: false },
      { status: 200 }
    );
  }
}
