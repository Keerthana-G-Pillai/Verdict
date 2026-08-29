// ============================================================
// VERDICT — Validation Engine
//
// Produces structured validation evidence from static/deterministic
// analysis. NEVER fabricates execution results.
//
// Evidence levels returned:
//   "static_analysis"   — pattern-based code analysis
//   "inferred_risk"     — probabilistic inference
//   "not_executable"    — decision/config change, can't execute
//
// Real execution integration point: if a sandbox is available
// in the future, replace the static analysis with actual results
// and set evidenceLevel = "execution_evidence".
// ============================================================

import type { ValidationAgentOutput, EvidenceLevel } from "./types";
import type { ChangeType } from "@/lib/analysis/types";

const EXECUTABLE_TYPES: ChangeType[] = ["code", "diff"];

export function runValidationEngine(change: {
  changeType: ChangeType;
  title: string;
  content: string;
  language?: string;
}): ValidationAgentOutput {
  // Decision and PR changes cannot be directly executed
  if (!EXECUTABLE_TYPES.includes(change.changeType)) {
    return {
      executed: false,
      result: "NOT_EXECUTABLE",
      details: `This is a ${change.changeType === "decision" ? "decision / architectural proposal" : "pull request description"} — no executable code to run. Validation is based on static analysis only.`,
      unexpectedFindings: null,
      evidenceLevel: "not_executable",
      agentId: "validation_engine",
    };
  }

  // Static analysis for code/diff
  const findings = runStaticChecks(change.content, change.language);

  return {
    executed: false,
    result: "STATIC_ANALYSIS",
    details: `Static analysis completed. ${findings.summary}`,
    unexpectedFindings: findings.warnings.length > 0 ? findings.warnings.join("; ") : null,
    evidenceLevel: "static_analysis",
    agentId: "validation_engine",
  };
}

interface StaticCheckResult {
  summary: string;
  warnings: string[];
}

function runStaticChecks(content: string, language?: string): StaticCheckResult {
  const warnings: string[] = [];
  const lower = content.toLowerCase();

  // Detect common patterns that deserve flagging
  if (/console\.(log|warn|error|debug)\s*\(/.test(content) && language === "TypeScript" || language === "JavaScript") {
    warnings.push("Console logging statements present — consider removing before production");
  }
  if (/todo|fixme|hack|xxx/i.test(content)) {
    warnings.push("TODO/FIXME/HACK markers found in change");
  }
  if (/password|secret|apikey|api_key|token|credential/i.test(content) && /['"][a-zA-Z0-9+/]{16,}['"]/.test(content)) {
    warnings.push("Possible hardcoded credential detected");
  }
  if (lower.includes("eval(") || lower.includes("exec(") || lower.includes("system(")) {
    warnings.push("Dynamic code execution detected (eval/exec/system) — review carefully");
  }
  if (/\.catch\s*\(\s*\)/.test(content) || /catch\s*\(\s*\)\s*\{\s*\}/.test(content)) {
    warnings.push("Silent catch block detected — errors may be swallowed");
  }

  // Estimate scope
  const lineCount = content.split("\n").length;
  const scopeDesc = lineCount < 20 ? "small, focused change" : lineCount < 100 ? "moderate-size change" : "large change";

  const summary = `Analyzed ${lineCount} lines. Scope: ${scopeDesc}.${
    warnings.length > 0 ? ` ${warnings.length} pattern${warnings.length > 1 ? "s" : ""} flagged for review.` : " No critical patterns flagged."
  } Note: This is static and semantic analysis only — no code was executed.`;

  return { summary, warnings };
}
