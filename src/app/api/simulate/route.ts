// ============================================================
// POST /api/simulate
// Server-side simulation endpoint: AI → deterministic fallback
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSimulationFromAI } from "@/lib/ai/provider-manager";
import type { AISimulationRequest } from "@/lib/ai/types";

export async function POST(req: NextRequest) {
  try {
    const body: AISimulationRequest = await req.json();

    if (!body.changeA?.content || !body.changeB?.content) {
      return NextResponse.json({ error: "Both changes required" }, { status: 400 });
    }

    const result = await getSimulationFromAI(body);

    return NextResponse.json({
      data: result.data,
      provider: result.provider,
      aiEnhanced: result.aiEnhanced,
    });
  } catch (err) {
    console.error("[/api/simulate]", err);
    return NextResponse.json(
      { data: null, provider: "fallback", aiEnhanced: false },
      { status: 200 }
    );
  }
}
