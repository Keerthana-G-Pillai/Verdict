// ============================================================
// VERDICT — Verdict Engine
// Deterministic scoring and decision logic.
// Centralised here so UI components NEVER contain verdict logic.
// ============================================================

import type {
  Finding,
  VerdictOutcome,
  EvidenceItem,
  SimulationResult,
  ContextResult,
  Severity,
} from "./types";

// ── Risk scoring weights ────────────────────────────────────
const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 40,
  high:     20,
  medium:    8,
  low:       3,
  info:      0,
};

// ── Compute a 0–100 risk score from findings ────────────────
export function computeRiskScore(findings: Finding[]): number {
  if (findings.length === 0) return 5;
  const raw = findings.reduce((sum, f) => sum + SEVERITY_WEIGHTS[f.severity], 0);
  // Diminishing returns: cap at 100
  return Math.min(100, Math.round(raw));
}

// ── Compute a 0–100 confidence score ────────────────────────
export function computeConfidence(
  findings: Finding[],
  safetyFindings: Finding[],
  simResults: SimulationResult[],
  contentLength: number
): number {
  let confidence = 60; // baseline

  // More content = more confident
  if (contentLength > 200) confidence += 10;
  if (contentLength > 600) confidence += 5;

  // More safety evidence = more confident
  const safetySupport = safetyFindings.filter((f) => f.severity === "info" || f.severity === "low").length;
  confidence += Math.min(15, safetySupport * 5);

  // Execution evidence boosts confidence most
  const execEvidence = simResults.filter((r) => r.type === "execution" && r.outcome === "passed").length;
  confidence += execEvidence * 10;

  // Conflicts lower confidence
  const criticals = findings.filter((f) => f.severity === "critical").length;
  confidence -= criticals * 5;

  return Math.min(98, Math.max(45, Math.round(confidence)));
}

// ── Derive count breakdowns ──────────────────────────────────
export function countBySeverity(findings: Finding[]) {
  return {
    critical: findings.filter((f) => f.severity === "critical").length,
    high:     findings.filter((f) => f.severity === "high").length,
    medium:   findings.filter((f) => f.severity === "medium").length,
    low:      findings.filter((f) => f.severity === "low").length,
  };
}

// ── Determine final verdict ──────────────────────────────────
export function deriveVerdict(
  riskScore: number,
  findings: Finding[],
  safetyFindings: Finding[]
): { verdict: VerdictOutcome; rationale: string } {
  const criticals = findings.filter((f) => f.severity === "critical").length;
  const highs     = findings.filter((f) => f.severity === "high").length;
  const safetyCount = safetyFindings.length;

  if (criticals > 0) {
    return {
      verdict: "requires_revision",
      rationale: `${criticals} critical risk${criticals > 1 ? "s" : ""} must be resolved before this change can be deployed safely. The identified issues pose unacceptable risk to system integrity.`,
    };
  }

  if (riskScore >= 70) {
    return {
      verdict: "requires_revision",
      rationale: `The overall risk score of ${riskScore}/100 exceeds the safe deployment threshold. Multiple high-severity concerns require remediation.`,
    };
  }

  if (highs > 0 || riskScore >= 40) {
    const conditionCount = Math.min(highs + 1, 4);
    return {
      verdict: "approved_with_conditions",
      rationale: `${highs} high-risk finding${highs !== 1 ? "s" : ""} identified. The change can proceed after satisfying ${conditionCount} required condition${conditionCount !== 1 ? "s" : ""}. ${safetyCount > 0 ? `${safetyCount} safety control${safetyCount !== 1 ? "s" : ""} support${safetyCount === 1 ? "s" : ""} this decision.` : ""}`,
    };
  }

  if (riskScore >= 20) {
    return {
      verdict: "approved_with_conditions",
      rationale: `Low-to-moderate risk profile. ${safetyCount} safety indicator${safetyCount !== 1 ? "s" : ""} validate the change. Standard review process applies.`,
    };
  }

  return {
    verdict: "approved",
    rationale: `Low risk profile with ${safetyCount} supporting safety indicator${safetyCount !== 1 ? "s" : ""}. No critical or high-severity concerns found. Change can proceed through normal deployment gates.`,
  };
}

// ── Derive conditions from high/critical findings ────────────
export function deriveConditions(
  findings: Finding[],
  verdict: VerdictOutcome
): string[] {
  if (verdict === "approved") return [];

  const conditions: string[] = [];

  const critAndHigh = findings.filter(
    (f) => f.severity === "critical" || f.severity === "high"
  );

  for (const finding of critAndHigh) {
    if (finding.recommendation) {
      conditions.push(finding.recommendation);
    }
  }

  // Ensure at least one condition for non-approved verdicts
  if (conditions.length === 0) {
    conditions.push("Thorough peer review required before merging.");
    conditions.push("Add or update test coverage for affected areas.");
  }

  // Cap at 5
  return conditions.slice(0, 5);
}

// ── Build recommendation list ────────────────────────────────
export function deriveRecommendations(
  findings: Finding[],
  context: ContextResult,
  verdict: VerdictOutcome
): string[] {
  const recs: string[] = [];

  // Top-level strategic recommendations
  if (context.scope === "system-wide" || context.scope === "broad") {
    recs.push("Run integration tests across all affected services before deploying.");
    recs.push("Consider a phased rollout or feature flag to limit blast radius.");
  }

  if (context.dependencies.length > 2) {
    recs.push(
      `Review downstream dependency impact: ${context.dependencies.slice(0, 3).join(", ")}.`
    );
  }

  // Per-finding recommendations
  for (const finding of findings) {
    if (finding.recommendation && finding.severity !== "low" && finding.severity !== "info") {
      const rec = finding.recommendation;
      if (!recs.includes(rec)) recs.push(rec);
    }
  }

  if (verdict === "approved") {
    recs.push("Monitor error rates and key metrics for 24h post-deployment.");
  }

  return recs.slice(0, 6);
}

// ── Build evidence items from findings ─────────────────────
export function buildEvidenceItems(
  findings: Finding[],
  safetyFindings: Finding[],
  simResults: SimulationResult[],
  context: ContextResult
): EvidenceItem[] {
  const items: EvidenceItem[] = [];

  // Context evidence
  items.push({
    id: "ctx-scope",
    label: `Change scope: ${context.scope.replace("-", " ")}`,
    detail: `Affects ${context.affectedAreas.length} area${context.affectedAreas.length !== 1 ? "s" : ""}: ${context.affectedAreas.join(", ")}`,
    category: "context",
    weight: context.scope === "narrow" ? "supporting" : "neutral",
    confidence: 85,
  });

  if (context.dependencies.length > 0) {
    items.push({
      id: "ctx-deps",
      label: `${context.dependencies.length} downstream dependenc${context.dependencies.length !== 1 ? "ies" : "y"} identified`,
      detail: context.dependencies.join(", "),
      category: "context",
      weight: context.dependencies.length > 3 ? "against" : "neutral",
      confidence: 75,
    });
  }

  // Risk evidence
  for (const finding of findings.filter((f) => f.severity === "critical" || f.severity === "high")) {
    items.push({
      id: `risk-${finding.id}`,
      label: finding.title,
      detail: finding.evidence ?? finding.description,
      category: "inferred_risk",
      weight: "against",
      confidence: finding.confidence,
    });
  }

  // Safety evidence
  for (const finding of safetyFindings) {
    items.push({
      id: `safety-${finding.id}`,
      label: finding.title,
      detail: finding.evidence ?? finding.description,
      category: "validation_available",
      weight: "supporting",
      confidence: finding.confidence,
    });
  }

  // Simulation evidence
  for (const sim of simResults) {
    items.push({
      id: `sim-${sim.label.toLowerCase().replace(/\s+/g, "-")}`,
      label: sim.label,
      detail: sim.detail,
      category: sim.type === "execution" ? "execution_evidence" : "static_analysis",
      weight: sim.outcome === "passed" ? "supporting" : sim.outcome === "failed" ? "against" : "neutral",
      confidence: sim.confidence,
    });
  }

  return items;
}
