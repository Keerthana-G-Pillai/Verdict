// ============================================================
// VERDICT AI — Response Validator
// Validates AI JSON responses before use.
// If invalid, throws so the provider manager can fall back.
// ============================================================

import type { AIAnalysisResponse, AISimulationResponse, AIFinding, AIConflict } from "./types";

const VALID_SEVERITIES = new Set(["info", "low", "medium", "high", "critical"]);
const VALID_CONFLICT_TYPES = new Set(["direct", "semantic", "contract", "state", "ordering", "configuration"]);

function validateFinding(raw: unknown): AIFinding {
  if (!raw || typeof raw !== "object") throw new Error("Invalid finding");
  const f = raw as Record<string, unknown>;
  return {
    title: String(f.title ?? "Finding"),
    description: String(f.description ?? ""),
    severity: (VALID_SEVERITIES.has(String(f.severity)) ? f.severity : "medium") as AIFinding["severity"],
    affectedArea: f.affectedArea ? String(f.affectedArea) : undefined,
    recommendation: f.recommendation ? String(f.recommendation) : undefined,
    confidence: typeof f.confidence === "number" ? Math.min(100, Math.max(0, f.confidence)) : 75,
  };
}

function validateConflict(raw: unknown): AIConflict {
  if (!raw || typeof raw !== "object") throw new Error("Invalid conflict");
  const c = raw as Record<string, unknown>;
  return {
    title: String(c.title ?? "Conflict"),
    description: String(c.description ?? ""),
    type: (VALID_CONFLICT_TYPES.has(String(c.type)) ? c.type : "semantic") as AIConflict["type"],
    severity: (VALID_SEVERITIES.has(String(c.severity)) ? c.severity : "high") as AIConflict["severity"],
    changeAAssumption: String(c.changeAAssumption ?? ""),
    changeBAssumption: String(c.changeBAssumption ?? ""),
    collisionReason: String(c.collisionReason ?? ""),
    consequence: String(c.consequence ?? ""),
    resolution: String(c.resolution ?? ""),
    affectedArea: String(c.affectedArea ?? ""),
    confidence: typeof c.confidence === "number" ? Math.min(100, Math.max(0, c.confidence)) : 80,
  };
}

export function validateAnalysisResponse(raw: unknown): AIAnalysisResponse {
  if (!raw || typeof raw !== "object") throw new Error("AI returned non-object response");
  const r = raw as Record<string, unknown>;

  return {
    contextSummary: String(r.contextSummary ?? ""),
    domains: Array.isArray(r.domains) ? r.domains.map(String).slice(0, 5) : [],
    detectedLanguage: r.detectedLanguage ? String(r.detectedLanguage) : undefined,
    riskFindings: Array.isArray(r.riskFindings)
      ? r.riskFindings.slice(0, 8).map(validateFinding)
      : [],
    safetyFindings: Array.isArray(r.safetyFindings)
      ? r.safetyFindings.slice(0, 5).map(validateFinding)
      : [],
    recommendations: Array.isArray(r.recommendations)
      ? r.recommendations.map(String).slice(0, 6)
      : [],
    confidence: typeof r.confidence === "number" ? Math.min(98, Math.max(40, r.confidence)) : 70,
    reasoningSummary: String(r.reasoningSummary ?? ""),
  };
}

export function validateSimulationResponse(raw: unknown): AISimulationResponse {
  if (!raw || typeof raw !== "object") throw new Error("AI returned non-object response");
  const r = raw as Record<string, unknown>;

  return {
    domainsA: Array.isArray(r.domainsA) ? r.domainsA.map(String).slice(0, 5) : [],
    domainsB: Array.isArray(r.domainsB) ? r.domainsB.map(String).slice(0, 5) : [],
    directConflicts: Array.isArray(r.directConflicts)
      ? r.directConflicts.slice(0, 4).map(validateConflict)
      : [],
    semanticConflicts: Array.isArray(r.semanticConflicts)
      ? r.semanticConflicts.slice(0, 6).map(validateConflict)
      : [],
    recommendations: Array.isArray(r.recommendations)
      ? r.recommendations.map(String).slice(0, 6)
      : [],
    confidence: typeof r.confidence === "number" ? Math.min(98, Math.max(40, r.confidence)) : 70,
    reasoningSummary: String(r.reasoningSummary ?? ""),
  };
}
