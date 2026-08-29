// ============================================================
// VERDICT AI — OpenRouter Provider
// Free tier: https://openrouter.ai (free models available)
// Free models verified as of 2024: google/gemma-2-9b-it:free,
// meta-llama/llama-3.1-8b-instruct:free, mistralai/mistral-7b-instruct:free
// ============================================================

import type { AIProvider, AIAnalysisRequest, AIAnalysisResponse, AISimulationRequest, AISimulationResponse, ChatMessage } from "./types";
import { buildAnalysisPrompt, buildSimulationPrompt } from "./prompts";
import { validateAnalysisResponse, validateSimulationResponse } from "./validator";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
// Use a verified free model — configurable via env
const MODEL = process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free";

async function callOpenRouterMessages(messages: ChatMessage[], apiKey: string, opts: { maxTokens?: number } = {}): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://verdict.app",
        "X-Title": "VERDICT Change Intelligence",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.3,
        max_tokens: opts.maxTokens ?? 2048,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText);
      throw new Error(`OpenRouter API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  } finally {
    clearTimeout(timeout);
  }
}

export const openrouterProvider: AIProvider = {
  name: "openrouter",

  async isAvailable(): Promise<boolean> {
    return !!process.env.OPENROUTER_API_KEY;
  },

  async analyzeChange(req: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const apiKey = process.env.OPENROUTER_API_KEY!;
    const prompt = buildAnalysisPrompt(req);
    const raw = await callOpenRouterMessages([{ role: "user", content: prompt }], apiKey);
    const parsed = JSON.parse(raw);
    return validateAnalysisResponse(parsed);
  },

  async analyzeSimulation(req: AISimulationRequest): Promise<AISimulationResponse> {
    const apiKey = process.env.OPENROUTER_API_KEY!;
    const prompt = buildSimulationPrompt(req);
    const raw = await callOpenRouterMessages([{ role: "user", content: prompt }], apiKey);
    const parsed = JSON.parse(raw);
    return validateSimulationResponse(parsed);
  },

  async chatRaw(messages: ChatMessage[], opts?: { maxTokens?: number }): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY!;
    return callOpenRouterMessages(messages, apiKey, opts);
  },
};
