// ============================================================
// VERDICT AI — Provider Manager
//
// Provider priority (first available wins):
//   1. Groq (llama-3.1-8b-instant / compound-mini) — active default
//      while watsonx credentials are not yet configured
//   2. IBM watsonx (Granite) — wire back to position 1 once
//      WATSONX_API_KEY + WATSONX_PROJECT_ID are set in .env.local
//   3. OpenRouter (free models)
//   4. Deterministic fallback — always works, no API required
//
// AI_PROVIDER env var overrides auto-detection.
// All provider selection logic lives here.
// UI never knows which provider runs.
//
// NOTE: swap PROVIDERS back to [watsonx, groq, openrouter] before
// final submission once watsonx credentials are configured.
// ============================================================

import type { AIProvider, AIAnalysisRequest, AIAnalysisResponse, AISimulationRequest, AISimulationResponse, ProviderName, ChatMessage } from "./types";
import { watsonxProvider } from "./watsonx-provider";
import { groqProvider } from "./groq-provider";
import { openrouterProvider } from "./openrouter-provider";

// BEFORE (teammate's branch): [watsonxProvider, groqProvider, openrouterProvider]
// AFTER  (Groq-first):        [groqProvider, watsonxProvider, openrouterProvider]
//
// watsonxProvider.isAvailable() is a pure env-var check — no network call,
// no timeout, no error. With empty WATSONX_API_KEY it returns false instantly
// and is skipped. AI_PROVIDER=groq in .env.local also short-circuits the loop
// so watsonx is never even evaluated.
const PROVIDERS: AIProvider[] = [groqProvider, watsonxProvider, openrouterProvider];

export interface ProviderResult<T> {
  data: T;
  provider: ProviderName;
  aiEnhanced: boolean;
}

// ── Select and call the best available provider ───────────────

export async function runWithProvider<T>(
  operation: (provider: AIProvider) => Promise<T>,
  fallbackFn: () => T
): Promise<{ data: T; provider: ProviderName; aiEnhanced: boolean }> {
  const preferredProvider = process.env.AI_PROVIDER as ProviderName | undefined;

  // Try the explicitly preferred provider first
  if (preferredProvider && preferredProvider !== "fallback") {
    const preferred = PROVIDERS.find((p) => p.name === preferredProvider);
    if (preferred && (await preferred.isAvailable())) {
      try {
        const data = await operation(preferred);
        return { data, provider: preferred.name, aiEnhanced: true };
      } catch (err) {
        console.error(`[VERDICT AI] ${preferred.name} failed, falling back:`, err instanceof Error ? err.message : String(err));
      }
    }
  }

  // Auto-detect: try each provider in priority order
  for (const provider of PROVIDERS) {
    // Skip if we have a specific preference and this isn't it
    if (preferredProvider && preferredProvider !== "fallback" && provider.name !== preferredProvider) continue;
    if (!(await provider.isAvailable())) continue;
    try {
      const data = await operation(provider);
      return { data, provider: provider.name, aiEnhanced: true };
    } catch (err) {
      console.error(`[VERDICT AI] ${provider.name} failed:`, err instanceof Error ? err.message : String(err));
    }
  }

  // Fallback: deterministic analysis
  console.info("[VERDICT AI] All providers unavailable — using deterministic fallback");
  return { data: fallbackFn(), provider: "fallback", aiEnhanced: false };
}

// ── Get an available provider's chatRaw function ──────────────
// Used by the multi-agent orchestrator for direct message-based calls.

export async function getAvailableChatFn(): Promise<{
  chatFn: (messages: ChatMessage[], opts?: { maxTokens?: number }) => Promise<string>;
  providerName: ProviderName;
} | null> {
  const preferredProvider = process.env.AI_PROVIDER as ProviderName | undefined;

  // ── Debug: log env state at request time so failures are visible ──────────
  console.log(
    `[VERDICT AI] getAvailableChatFn — AI_PROVIDER="${preferredProvider ?? "(unset)"}" ` +
    `GROQ_API_KEY=${process.env.GROQ_API_KEY ? `set (${process.env.GROQ_API_KEY.slice(0, 8)}…)` : "MISSING"} ` +
    `GROQ_MODEL="${process.env.GROQ_MODEL ?? "(unset, will use default)"}" ` +
    `WATSONX_API_KEY=${process.env.WATSONX_API_KEY ? "set" : "not set"}`
  );

  const ordered = preferredProvider && preferredProvider !== "fallback"
    ? PROVIDERS.filter((p) => p.name === preferredProvider)
    : PROVIDERS;

  for (const provider of ordered) {
    const available = await provider.isAvailable();
    console.log(`[VERDICT AI] ${provider.name}.isAvailable() → ${available}`);
    if (!available) continue;
    console.log(`[VERDICT AI] selected provider: ${provider.name}`);
    return {
      chatFn: provider.chatRaw.bind(provider),
      providerName: provider.name,
    };
  }
  console.warn("[VERDICT AI] getAvailableChatFn → null (no provider available)");
  return null;
}

export async function getAnalysisFromAI(req: AIAnalysisRequest): Promise<ProviderResult<AIAnalysisResponse | null>> {
  try {
    return await runWithProvider(
      (p) => p.analyzeChange(req),
      () => null
    );
  } catch {
    return { data: null, provider: "fallback", aiEnhanced: false };
  }
}

export async function getSimulationFromAI(req: AISimulationRequest): Promise<ProviderResult<AISimulationResponse | null>> {
  try {
    return await runWithProvider(
      (p) => p.analyzeSimulation(req),
      () => null
    );
  } catch {
    return { data: null, provider: "fallback", aiEnhanced: false };
  }
}
