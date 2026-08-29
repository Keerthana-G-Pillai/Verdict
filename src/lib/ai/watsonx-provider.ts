// ============================================================
// VERDICT AI — IBM watsonx Provider
//
// Primary provider for IBM hackathon / Call for Code submissions.
// Uses IBM Granite models via watsonx.ai REST API.
//
// Setup: https://cloud.ibm.com/apidocs/watsonx-ai
// Free tier: IBM Cloud lite plan includes watsonx.ai credits.
// IBM Granite is IBM's flagship foundation model — using it
// demonstrates IBM technology stack for hackathon judging.
//
// Environment variables required:
//   WATSONX_API_KEY      — IBM Cloud IAM API key
//   WATSONX_PROJECT_ID   — watsonx.ai project ID
//   WATSONX_URL          — service URL (optional, defaults to Dallas)
//   WATSONX_MODEL_ID     — model ID (optional, defaults to Granite 3.3)
// ============================================================

import type { AIProvider, AIAnalysisRequest, AIAnalysisResponse, AISimulationRequest, AISimulationResponse, ChatMessage } from "./types";
import { buildAnalysisPrompt, buildSimulationPrompt } from "./prompts";
import { validateAnalysisResponse, validateSimulationResponse } from "./validator";

const DEFAULT_URL = "https://us-south.ml.cloud.ibm.com";
// IBM Granite 3.3 8B Instruct — IBM's flagship open model, excellent reasoning
const DEFAULT_MODEL = "ibm/granite-3-3-8b-instruct";

// ── IBM IAM Token exchange ────────────────────────────────────
// IBM Cloud uses IAM API keys that must be exchanged for bearer tokens.
let _cachedToken: string | null = null;
let _tokenExpiry = 0;

async function getIAMToken(apiKey: string): Promise<string> {
  // Return cached token if still valid (with 60s margin)
  if (_cachedToken && Date.now() < _tokenExpiry - 60000) {
    return _cachedToken;
  }

  const res = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${encodeURIComponent(apiKey)}`,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`IBM IAM token exchange failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  _cachedToken = data.access_token;
  // expires_in is in seconds
  _tokenExpiry = Date.now() + (data.expires_in ?? 3600) * 1000;
  return _cachedToken!;
}

// ── Core chat function ────────────────────────────────────────
async function callWatsonx(
  messages: ChatMessage[],
  apiKey: string,
  opts: { maxTokens?: number } = {}
): Promise<string> {
  const serviceUrl = process.env.WATSONX_URL ?? DEFAULT_URL;
  const modelId = process.env.WATSONX_MODEL_ID ?? DEFAULT_MODEL;
  const projectId = process.env.WATSONX_PROJECT_ID;

  if (!projectId) throw new Error("WATSONX_PROJECT_ID is required");

  const token = await getIAMToken(apiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${serviceUrl}/ml/v1/text/chat?version=2024-05-31`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        model_id: modelId,
        project_id: projectId,
        messages,
        parameters: {
          max_new_tokens: opts.maxTokens ?? 2048,
          temperature: 0.3,
          decoding_method: "greedy",
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText);
      throw new Error(`watsonx API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error(`Unexpected watsonx response shape: ${JSON.stringify(data).slice(0, 300)}`);
    }
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Single-prompt helper (for analyzeChange / analyzeSimulation) ──
async function callWatsonxSinglePrompt(prompt: string, apiKey: string): Promise<string> {
  return callWatsonx([{ role: "user", content: prompt }], apiKey);
}

// ── Strip JSON fences ─────────────────────────────────────────
function stripFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
}

// ── Provider export ───────────────────────────────────────────
export const watsonxProvider: AIProvider = {
  name: "watsonx",

  async isAvailable(): Promise<boolean> {
    return !!(process.env.WATSONX_API_KEY && process.env.WATSONX_PROJECT_ID);
  },

  async analyzeChange(req: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const apiKey = process.env.WATSONX_API_KEY!;
    const prompt = buildAnalysisPrompt(req);
    const raw = await callWatsonxSinglePrompt(prompt, apiKey);
    const parsed = JSON.parse(stripFences(raw));
    return validateAnalysisResponse(parsed);
  },

  async analyzeSimulation(req: AISimulationRequest): Promise<AISimulationResponse> {
    const apiKey = process.env.WATSONX_API_KEY!;
    const prompt = buildSimulationPrompt(req);
    const raw = await callWatsonxSinglePrompt(prompt, apiKey);
    const parsed = JSON.parse(stripFences(raw));
    return validateSimulationResponse(parsed);
  },

  async chatRaw(messages: ChatMessage[], opts?: { maxTokens?: number }): Promise<string> {
    const apiKey = process.env.WATSONX_API_KEY!;
    return callWatsonx(messages, apiKey, opts);
  },
};
