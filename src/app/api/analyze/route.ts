// ============================================================
// POST /api/analyze
// 4-agent adversarial pipeline:
//   1. Risk Intelligence + Safety Validation — PARALLEL, independent
//   2. Validation Engine — static analysis, no fabrication
//   3. Decision Engine — synthesizes evidence, explains verdict
//
// Falls back to deterministic analysis if all AI providers fail.
// The deterministic verdict engine is ALWAYS the scoring truth.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getAvailableChatFn } from "@/lib/ai/provider-manager";
import { runAgentTrial, buildFallbackTrial } from "@/lib/ai/agents/orchestrator";
import type { OrchestratorRequest, ChatFn } from "@/lib/ai/agents/orchestrator";
import type { ChangeType } from "@/lib/analysis/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { changeType, title, content, description, language, fileContext } = body;

    if (!content || typeof content !== "string" || content.trim().length < 5) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const orchestratorReq: OrchestratorRequest = {
      changeType: (changeType as ChangeType) ?? "code",
      title: String(title ?? ""),
      content: String(content),
      description: description ? String(description) : undefined,
      language: language ? String(language) : undefined,
      fileContext: fileContext ? String(fileContext) : undefined,
    };

    // Try to get an available AI provider for multi-agent orchestration
    const chatProvider = await getAvailableChatFn();

    if (!chatProvider) {
      // All providers unavailable — return fallback trial
      const fallback = buildFallbackTrial(orchestratorReq);
      return NextResponse.json({
        data: fallback,
        provider: "fallback",
        aiEnhanced: false,
      });
    }

    // Run the 4-agent parallel trial
    const trialResult = await runAgentTrial(
      orchestratorReq,
      chatProvider.chatFn,
      chatProvider.providerName
    );

    return NextResponse.json({
      data: trialResult,
      provider: chatProvider.providerName,
      aiEnhanced: true,
    });

  } catch (err) {
    console.error("[/api/analyze]", err);
    return NextResponse.json(
      { data: null, provider: "fallback", aiEnhanced: false },
      { status: 200 }
    );
  }
}
