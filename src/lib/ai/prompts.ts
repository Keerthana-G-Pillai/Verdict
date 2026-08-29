// ============================================================
// VERDICT AI — Prompt Templates
// Shared prompts for both Groq and OpenRouter providers.
// ============================================================

import type { AIAnalysisRequest, AISimulationRequest } from "./types";

export function buildAnalysisPrompt(req: AIAnalysisRequest): string {
  return `You are VERDICT, an AI-powered change intelligence engine. Analyze the following proposed engineering change and return a structured JSON response.

CHANGE TYPE: ${req.changeType}
TITLE: ${req.title}
${req.language ? `LANGUAGE: ${req.language}` : ""}
${req.description ? `CONTEXT: ${req.description}` : ""}

CHANGE CONTENT:
${req.content.slice(0, 3000)}

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "contextSummary": "Brief summary of what this change does",
  "domains": ["domain1", "domain2"],
  "detectedLanguage": "TypeScript",
  "riskFindings": [
    {
      "title": "Risk title",
      "description": "Detailed description",
      "severity": "critical|high|medium|low|info",
      "affectedArea": "ServiceName",
      "recommendation": "What to do",
      "confidence": 85
    }
  ],
  "safetyFindings": [
    {
      "title": "Safety control title",
      "description": "What safety mechanism exists",
      "severity": "info",
      "affectedArea": "ServiceName",
      "recommendation": "How to leverage this",
      "confidence": 80
    }
  ],
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2"],
  "confidence": 82,
  "reasoningSummary": "Brief explanation of the overall assessment"
}

Focus on REAL risks specific to this exact change. Do not fabricate generic findings. Domains should be from: payment-processing, authentication, database, caching, api, async-processing, infrastructure, configuration, frontend, logging.`;
}

export function buildSimulationPrompt(req: AISimulationRequest): string {
  return `You are VERDICT, an AI-powered merge simulation engine. Analyze whether these two changes can safely coexist. Look for SEMANTIC conflicts — behavioral incompatibilities that Git cannot detect.

CHANGE A: ${req.changeA.title}
${req.changeA.content.slice(0, 1500)}

CHANGE B: ${req.changeB.title}
${req.changeB.content.slice(0, 1500)}

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "domainsA": ["domain1"],
  "domainsB": ["domain2"],
  "directConflicts": [],
  "semanticConflicts": [
    {
      "title": "Conflict title",
      "description": "What the conflict is",
      "type": "semantic",
      "severity": "critical|high|medium|low",
      "changeAAssumption": "What Change A assumes",
      "changeBAssumption": "What Change B assumes",
      "collisionReason": "Why these assumptions conflict",
      "consequence": "What breaks if merged without resolution",
      "resolution": "How to fix this",
      "affectedArea": "ServiceName",
      "confidence": 88
    }
  ],
  "recommendations": ["Step 1", "Step 2"],
  "confidence": 85,
  "reasoningSummary": "Brief explanation"
}

CRITICAL: Only report REAL conflicts based on the actual content. If the changes are genuinely unrelated, return empty conflict arrays. This is a professional engineering tool — accuracy matters more than finding conflicts.`;
}
