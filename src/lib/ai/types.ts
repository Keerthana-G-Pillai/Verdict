// ============================================================
// VERDICT AI Layer — Shared Types
// ============================================================

import type { ChangeType } from "@/lib/analysis/types";
import type { SimulationChange } from "@/lib/simulation/types";

// What we send to an AI provider
export interface AIAnalysisRequest {
  changeType: ChangeType;
  title: string;
  content: string;
  description?: string;
  language?: string;
}

export interface AISimulationRequest {
  changeA: SimulationChange;
  changeB: SimulationChange;
}

// Structured JSON the AI must return (validated before use)
export interface AIFinding {
  title: string;
  description: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  affectedArea?: string;
  recommendation?: string;
  confidence?: number;
}

export interface AIAnalysisResponse {
  contextSummary: string;
  domains: string[];
  detectedLanguage?: string;
  riskFindings: AIFinding[];
  safetyFindings: AIFinding[];
  recommendations: string[];
  confidence: number;
  reasoningSummary: string;
}

export interface AISimulationResponse {
  domainsA: string[];
  domainsB: string[];
  directConflicts: AIConflict[];
  semanticConflicts: AIConflict[];
  recommendations: string[];
  confidence: number;
  reasoningSummary: string;
}

export interface AIConflict {
  title: string;
  description: string;
  type: "direct" | "semantic" | "contract" | "state" | "ordering" | "configuration";
  severity: "critical" | "high" | "medium" | "low";
  changeAAssumption: string;
  changeBAssumption: string;
  collisionReason: string;
  consequence: string;
  resolution: string;
  affectedArea: string;
  confidence?: number;
}

export type ProviderName = "watsonx" | "groq" | "openrouter" | "fallback";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIProvider {
  name: ProviderName;
  isAvailable(): Promise<boolean>;
  analyzeChange(req: AIAnalysisRequest): Promise<AIAnalysisResponse>;
  analyzeSimulation(req: AISimulationRequest): Promise<AISimulationResponse>;
  // Raw chat for multi-agent calls — returns raw text (not validated JSON)
  chatRaw(messages: ChatMessage[], opts?: { maxTokens?: number }): Promise<string>;
}
