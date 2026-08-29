// ============================================================
// VERDICT — /api/status
// Returns health/availability status for all AI providers.
// Used by the Settings page to display live provider state.
// ============================================================

import { NextResponse } from "next/server";

interface ProviderStatus {
  name: string;
  label: string;
  available: boolean;
  reason: string;
}

export async function GET() {
  const statuses: ProviderStatus[] = [];

  // ── IBM watsonx ──────────────────────────────────────────────
  const watsonxKey = process.env.WATSONX_API_KEY;
  const watsonxProject = process.env.WATSONX_PROJECT_ID;
  statuses.push({
    name: "watsonx",
    label: "IBM watsonx (Granite 3.3)",
    available: !!(watsonxKey && watsonxProject),
    reason: !watsonxKey
      ? "WATSONX_API_KEY not set"
      : !watsonxProject
      ? "WATSONX_PROJECT_ID not set"
      : "Credentials configured",
  });

  // ── Groq ─────────────────────────────────────────────────────
  const groqKey = process.env.GROQ_API_KEY;
  statuses.push({
    name: "groq",
    label: "Groq (Llama 3.1 8B)",
    available: !!groqKey,
    reason: groqKey ? "API key configured" : "GROQ_API_KEY not set",
  });

  // ── OpenRouter ───────────────────────────────────────────────
  const orKey = process.env.OPENROUTER_API_KEY;
  statuses.push({
    name: "openrouter",
    label: "OpenRouter (Llama 3.1 8B Free)",
    available: !!orKey,
    reason: orKey ? "API key configured" : "OPENROUTER_API_KEY not set",
  });

  // ── Deterministic fallback ───────────────────────────────────
  statuses.push({
    name: "fallback",
    label: "Deterministic Engine",
    available: true,
    reason: "Always available — no API key required",
  });

  const activeProvider = process.env.AI_PROVIDER || "auto";
  const anyAI = statuses.slice(0, 3).some((s) => s.available);

  return NextResponse.json({
    activeProvider,
    anyAI,
    providers: statuses,
    models: {
      watsonx: process.env.WATSONX_MODEL_ID || "ibm/granite-3-3-8b-instruct",
      groq: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      openrouter: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free",
    },
  });
}
