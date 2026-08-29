// ============================================================
// VERDICT AI — Provider Manager
//
// Provider priority (first available wins):
//   1. IBM watsonx (Granite) — primary for hackathon/IBM scoring
//   2. Groq (free tier)
//   3. OpenRouter (free models)
//   4. Deterministic fallback — always works, no API required
//
// AI_PROVIDER env var overrides auto-detection.
// All provider selection logic lives here.
// UI never knows which provider runs.
// ============================================================

import type { AIProvider, AIAnalysisRequest, AIAnalysisResponse, AISimulationRequest, AISimulationResponse, ProviderName, ChatMessage } from "./types";
import { watsonxProvider } from "./watsonx-provider";
import { groqProvider } from "./groq-provider";
import { openrouterProvider } from "./openrouter-provider";

// watsonx is first — used when IBM credentials are available (hackathon priority)
const PROVIDERS: AIProvider[] = [watsonxProvider, groqProvider, openrouterProvider];

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

  const ordered = preferredProvider && preferredProvider !== "fallback"
    ? PROVIDERS.filter((p) => p.name === preferredProvider)
    : PROVIDERS;

  for (const provider of ordered) {
    if (!(await provider.isAvailable())) continue;
    return {
      chatFn: provider.chatRaw.bind(provider),
      providerName: provider.name,
    };
  }
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
