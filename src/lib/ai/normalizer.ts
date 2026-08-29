// ============================================================
// VERDICT AI — AI Result Normalizer
//
// Two merge paths:
//   1. mergeAgentTrial  — new 4-agent pipeline (from orchestrator)
//   2. mergeAIAnalysis  — legacy single-prompt path (kept for simulation)
//
// AI enhances the deterministic engine. Never replaces it.
// The deterministic verdict engine is always the scoring truth.
// ============================================================

import type { AIAnalysisResponse, AISimulationResponse, AIFinding, AIConflict } from "./types";
import type { AgentTrialResult } from "./agents/types";
import type { Finding, AnalysisResult, EvidenceItem } from "@/lib/analysis/types";
import type { SimConflict, SimulationResult } from "@/lib/simulation/types";
import { nanoid } from "@/lib/analysis/nanoid";
import {
  computeRiskScore,
  computeConfidence,
  countBySeverity,
  deriveVerdict,
  deriveConditions,
  deriveRecommendations,
  buildEvidenceItems,
} from "@/lib/analysis/verdict-engine";
import {
  computeIntegrationRisk,
  computeSimConfidence,
  deriveIntegrationVerdict,
} from "@/lib/simulation/semantic-conflict-engine";
import { generateIntegrationStrategy } from "@/lib/simulation/integration-strategy";
import { detectDomains } from "@/lib/simulation/domain-detector";

// ── Convert AI finding → internal Finding ───────────────────

function aiFindingToFinding(f: AIFinding, category: Finding["category"]): Finding {
  return {
    id: nanoid(),
    title: f.title,
    description: f.description,
    severity: f.severity,
    category,
    affectedArea: f.affectedArea,
    recommendation: f.recommendation,
    evidence: "AI contextual analysis",
    confidence: f.confidence ?? 78,
  };
}

// ── Convert AI conflict → internal SimConflict ───────────────

function aiConflictToSimConflict(c: AIConflict): SimConflict {
  return {
    id: nanoid(),
    type: c.type,
    severity: c.severity,
    title: c.title,
    description: c.description,
    changeAAssumption: c.changeAAssumption,
    changeBAssumption: c.changeBAssumption,
    collisionReason: c.collisionReason,
    consequence: c.consequence,
    resolution: c.resolution,
    affectedArea: c.affectedArea,
    confidence: c.confidence ?? 80,
  };
}

// ── Merge AI analysis into a deterministic result ────────────

export function mergeAIAnalysis(
  base: AnalysisResult,
  ai: AIAnalysisResponse,
  provider: string
): AnalysisResult {
  // Merge AI findings with deterministic ones (deduplicate by title similarity)
  const existingTitles = new Set(base.riskFindings.map((f) => f.title.toLowerCase()));
  const newRiskFindings: Finding[] = ai.riskFindings
    .filter((f) => !existingTitles.has(f.title.toLowerCase()))
    .map((f) => aiFindingToFinding(f, "risk"));

  const existingSafetyTitles = new Set(base.safetyFindings.map((f) => f.title.toLowerCase()));
  const newSafetyFindings: Finding[] = ai.safetyFindings
    .filter((f) => !existingSafetyTitles.has(f.title.toLowerCase()))
    .map((f) => aiFindingToFinding(f, "safety"));

  const mergedRisk = [...base.riskFindings, ...newRiskFindings];
  const mergedSafety = [...base.safetyFindings, ...newSafetyFindings];

  // Re-run scoring with merged findings
  const riskScore = computeRiskScore(mergedRisk);
  const confidence = Math.max(base.confidence, ai.confidence);
  const counts = countBySeverity(mergedRisk);
  const { verdict, rationale } = deriveVerdict(riskScore, mergedRisk, mergedSafety);
  const conditions = deriveConditions(mergedRisk, verdict);
  const recommendations = [
    ...new Set([...ai.recommendations, ...base.recommendations]),
  ].slice(0, 6);

  // Update context with AI insights
  const updatedContext = {
    ...base.context,
    summary: ai.contextSummary || base.context.summary,
    detectedLanguage: ai.detectedLanguage ?? base.context.detectedLanguage,
  };

  const evidence = buildEvidenceItems(mergedRisk, mergedSafety, base.simulationResults, updatedContext);

  return {
    ...base,
    context: updatedContext,
    riskFindings: mergedRisk,
    safetyFindings: mergedSafety,
    evidence,
    riskScore,
    confidence,
    criticalCount: counts.critical,
    highCount: counts.high,
    mediumCount: counts.medium,
    lowCount: counts.low,
    verdict,
    verdictRationale: rationale,
    conditions,
    recommendations,
    analyzerVersion: `ai-${provider}-v1.0`,
  };
}

// ── Merge AI simulation into a deterministic result ──────────

export function mergeAISimulation(
  base: SimulationResult,
  ai: AISimulationResponse,
  provider: string
): SimulationResult {
  const existingConflictTitles = new Set([
    ...base.directConflicts.map((c) => c.title.toLowerCase()),
    ...base.semanticConflicts.map((c) => c.title.toLowerCase()),
  ]);

  const newDirect = ai.directConflicts
    .filter((c) => !existingConflictTitles.has(c.title.toLowerCase()))
    .map(aiConflictToSimConflict);

  const newSemantic = ai.semanticConflicts
    .filter((c) => !existingConflictTitles.has(c.title.toLowerCase()))
    .map(aiConflictToSimConflict);

  const mergedDirect = [...base.directConflicts, ...newDirect];
  const mergedSemantic = [...base.semanticConflicts, ...newSemantic];
  const allConflicts = [...mergedDirect, ...mergedSemantic];

  const domainsA = ai.domainsA.length > 0 ? ai.domainsA : base.domainsA;
  const domainsB = ai.domainsB.length > 0 ? ai.domainsB : base.domainsB;

  const detectedDomainsA = detectDomains(`${base.input.changeA.title} ${base.input.changeA.content}`);
  const detectedDomainsB = detectDomains(`${base.input.changeB.title} ${base.input.changeB.content}`);

  const riskScore = computeIntegrationRisk(allConflicts, base.domainOverlaps);
  const confidence = Math.max(base.confidence, ai.confidence);
  const { verdict, rationale } = deriveIntegrationVerdict(riskScore, allConflicts);
  const integrationSteps = generateIntegrationStrategy(allConflicts, detectedDomainsA, detectedDomainsB, verdict);

  return {
    ...base,
    domainsA,
    domainsB,
    directConflicts: mergedDirect,
    semanticConflicts: mergedSemantic,
    integrationRiskScore: riskScore,
    confidence,
    conflictCount: allConflicts.length,
    criticalConflictCount: allConflicts.filter((c) => c.severity === "critical").length,
    verdict,
    verdictRationale: rationale,
    integrationSteps,
  };
}

// ── Merge 4-agent trial into a deterministic analysis result ──
// This is the new primary merge path for the multi-agent pipeline.
// Deterministic scoring remains the source of truth for all numbers.
// The AI Judge enhances the rationale but never overrides thresholds.

export function mergeAgentTrial(
  base: AnalysisResult,
  trial: AgentTrialResult,
  provider: string
): AnalysisResult {
  // Convert Risk agent findings → internal Finding format
  const existingRiskTitles = new Set(base.riskFindings.map((f) => f.title.toLowerCase()));
  const newRiskFindings: Finding[] = trial.riskAgent.risks
    .filter((r) => !existingRiskTitles.has(r.claim.toLowerCase()))
    .map((r) => ({
      id: nanoid(),
      title: r.claim,
      description: r.justification,
      severity: r.severity === "critical" ? "critical" : r.severity as Finding["severity"],
      category: "risk" as const,
      affectedArea: r.affectedArea,
      recommendation: undefined,
      evidence: `Risk Intelligence Agent (${provider}) — adversarial analysis`,
      confidence: 80,
    }));

  // Convert Safety agent evidence → internal Finding format
  const existingSafetyTitles = new Set(base.safetyFindings.map((f) => f.title.toLowerCase()));
  const newSafetyFindings: Finding[] = trial.safetyAgent.evidence
    .filter((e) => !existingSafetyTitles.has(e.claim.toLowerCase()))
    .map((e) => ({
      id: nanoid(),
      title: e.claim,
      description: e.justification,
      severity: "info" as const,
      category: "safety" as const,
      affectedArea: e.affectedArea,
      recommendation: undefined,
      evidence: `Safety Validation Agent (${provider}) — adversarial analysis`,
      confidence: 75,
    }));

  const mergedRisk = [...base.riskFindings, ...newRiskFindings];
  const mergedSafety = [...base.safetyFindings, ...newSafetyFindings];

  // Re-run deterministic scoring with merged findings
  const riskScore = computeRiskScore(mergedRisk);
  const confidence = computeConfidence(mergedRisk, mergedSafety, base.simulationResults, base.input.content.length);
  const counts = countBySeverity(mergedRisk);
  const { verdict, rationale } = deriveVerdict(riskScore, mergedRisk, mergedSafety);
  const conditions = deriveConditions(mergedRisk, verdict);

  // Merge AI Judge recommendations with deterministic ones (dedup)
  const aiRecommendations = trial.judgeAgent.conditions.length > 0
    ? trial.judgeAgent.conditions
    : [];
  const recommendations = [...new Set([...aiRecommendations, ...base.recommendations])].slice(0, 6);

  // Build enhanced verdict rationale — Judge explanation if available
  const verdictRationale = trial.judgeAgent.reasoning && trial.judgeAgent.reasoning.length > 20
    ? trial.judgeAgent.reasoning
    : rationale;

  // Add validation engine evidence as an EvidenceItem
  const validationEvidence: EvidenceItem = {
    id: nanoid(),
    label: `Validation Engine: ${trial.validationAgent.result}`,
    detail: trial.validationAgent.details,
    category: trial.validationAgent.evidenceLevel as EvidenceItem["category"],
    weight: trial.validationAgent.result === "PASS" ? "supporting" : "neutral",
    confidence: 70,
  };

  const evidence = [...buildEvidenceItems(mergedRisk, mergedSafety, base.simulationResults, base.context), validationEvidence];

  return {
    ...base,
    riskFindings: mergedRisk,
    safetyFindings: mergedSafety,
    evidence,
    riskScore,
    confidence,
    criticalCount: counts.critical,
    highCount: counts.high,
    mediumCount: counts.medium,
    lowCount: counts.low,
    verdict,
    verdictRationale,
    conditions,
    recommendations,
    analyzerVersion: `4-agent-${provider}-v2.0`,
  };
}
