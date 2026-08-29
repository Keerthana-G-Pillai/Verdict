// ============================================================
// VERDICT AI — Groq Provider
// Free tier: https://console.groq.com (no credit card required)
// Models verified free as of 2024: llama-3.1-8b-instant, llama3-8b-8192
// ============================================================

import type { AIProvider, AIAnalysisRequest, AIAnalysisResponse, AISimulationRequest, AISimulationResponse, ChatMessage } from "./types";
import { buildAnalysisPrompt, buildSimulationPrompt } from "./prompts";
import { validateAnalysisResponse, validateSimulationResponse } from "./validator";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
// Default model — resolved at call time so .env.local changes take effect
// without a full server restart (hot-reload safe).
const DEFAULT_MODEL = "llama-3.1-8b-instant";

async function callGroqMessages(messages: ChatMessage[], apiKey: string, opts: { maxTokens?: number } = {}): Promise<string> {
  // Read at call time, not module-load time, so env changes picked up on restart.
  const model = process.env.GROQ_MODEL ?? DEFAULT_MODEL;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: opts.maxTokens ?? 2048,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText);
      throw new Error(`Groq API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  } finally {
    clearTimeout(timeout);
  }
}

export const groqProvider: AIProvider = {
  name: "groq",

  async isAvailable(): Promise<boolean> {
    return !!process.env.GROQ_API_KEY;
  },

  async analyzeChange(req: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const apiKey = process.env.GROQ_API_KEY!;
    const prompt = buildAnalysisPrompt(req);
    const raw = await callGroqMessages([{ role: "user", content: prompt }], apiKey);
    const parsed = JSON.parse(raw);
    return validateAnalysisResponse(parsed);
  },

  async analyzeSimulation(req: AISimulationRequest): Promise<AISimulationResponse> {
    const apiKey = process.env.GROQ_API_KEY!;
    const prompt = buildSimulationPrompt(req);
    const raw = await callGroqMessages([{ role: "user", content: prompt }], apiKey);
    const parsed = JSON.parse(raw);
    return validateSimulationResponse(parsed);
  },

  async chatRaw(messages: ChatMessage[], opts?: { maxTokens?: number }): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY!;
    return callGroqMessages(messages, apiKey, opts);
  },
};
