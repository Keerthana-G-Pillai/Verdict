// ============================================================
// VERDICT — Semantic Conflict Engine
//
// Deterministic, content-aware conflict detection.
// Reads actual submitted content and compares domain assumptions.
// Never randomly generates conflicts.
// ============================================================

import { nanoid } from "@/lib/analysis/nanoid";
import type { DetectedDomain } from "./domain-detector";
import type {
  SimConflict,
  DomainOverlap,
  IntegrationCheck,
} from "./types";

// ── Domain overlap detection ──────────────────────────────────

export function detectDomainOverlaps(
  domainsA: DetectedDomain[],
  domainsB: DetectedDomain[]
): DomainOverlap[] {
  const overlaps: DomainOverlap[] = [];

  for (const dA of domainsA) {
    for (const dB of domainsB) {
      if (dA.domain !== dB.domain) continue;

      const sharedKeywords = dA.keywords.filter((k) => dB.keywords.includes(k));
      const sharedAreas = dA.affectedAreas.filter((a) => dB.affectedAreas.includes(a));
      const overlapScore = (dA.score + dB.score) / 2;

      if (sharedKeywords.length > 0 || sharedAreas.length > 0) {
        overlaps.push({
          domain: dA.domain,
          sharedKeywords,
          sharedAreas,
          overlapScore,
        });
      }
    }
  }

  return overlaps;
}

// ── Conflict template bank ────────────────────────────────────

type ConflictTemplate = {
  type: SimConflict["type"];
  severity: SimConflict["severity"];
  title: string;
  description: string;
  changeAAssumption: string;
  changeBAssumption: string;
  collisionReason: string;
  consequence: string;
  resolution: string;
  affectedArea: string;
  confidence: number;
  // Only triggers if both sides have these keywords
  triggerKeywordsA: string[];
  triggerKeywordsB: string[];
  // At least one side must have this domain
  requiresDomain: string;
};

const CONFLICT_TEMPLATES: ConflictTemplate[] = [
  // ── Authentication conflicts ──────────────────────────────
  {
    type: "semantic",
    severity: "critical",
    title: "Authentication Mechanism Incompatibility",
    description: "Change A migrates the authentication system while Change B extends the current authentication mechanism. These changes cannot coexist without a migration bridge.",
    changeAAssumption: "Authentication uses server-side sessions. JWT tokens are being retired.",
    changeBAssumption: "JWT tokens are the active authentication state. Token refresh and expiry extend JWT lifecycle.",
    collisionReason: "Change B builds on the JWT lifecycle that Change A is removing. The refresh/extension logic will have no tokens to operate on after the migration.",
    consequence: "Post-migration, authentication renewal fails. Users experience unexpected logouts and cannot re-authenticate using the refresh flow.",
    resolution: "Refactor Change B to work with session renewal instead of JWT refresh. Implement the session equivalent of any JWT lifecycle extension before applying Change A.",
    affectedArea: "AuthService / TokenValidator",
    confidence: 94,
    triggerKeywordsA: ["session", "migrate", "jwt"],
    triggerKeywordsB: ["jwt", "refresh", "token", "expir"],
    requiresDomain: "authentication",
  },
  {
    type: "semantic",
    severity: "high",
    title: "Token Format Contract Break",
    description: "Change A alters the structure of authentication tokens or session identifiers. Change B reads fields from the previous token format.",
    changeAAssumption: "Session token or JWT payload uses a new structure.",
    changeBAssumption: "Token consumers read fields from the original token/session format.",
    collisionReason: "Field names or claim structures in the authentication token differ between what Change A produces and what Change B consumes.",
    consequence: "Authentication parsing failures cause authorization errors for users even after successful login.",
    resolution: "Coordinate token format changes with all consumers. Add a compatibility shim during the transition period.",
    affectedArea: "TokenValidator / API Consumers",
    confidence: 86,
    triggerKeywordsA: ["session", "token", "payload", "claim"],
    triggerKeywordsB: ["token", "claim", "bearer", "header"],
    requiresDomain: "authentication",
  },

  // ── Payment conflicts ─────────────────────────────────────
  {
    type: "semantic",
    severity: "critical",
    title: "Duplicate Transaction Risk from Combined Changes",
    description: "Change A increases retry attempts. Change B modifies transaction processing logic without adding idempotency protection. Together they create a high-probability duplicate charge scenario.",
    changeAAssumption: "More retries are safe because each retry is treated as a new independent attempt.",
    changeBAssumption: "Transaction processing modifications do not require idempotency since the existing retry count is low.",
    collisionReason: "Change A's increased retries multiply the probability of duplicate execution on every transient network failure. Change B's missing idempotency protection means each retry can execute the transaction multiple times.",
    consequence: "Customers are charged multiple times on payment failures followed by retries. Financial reconciliation fails. Potential regulatory consequences.",
    resolution: "Change B must implement idempotency keys on all transaction-modifying operations before Change A increases retry counts.",
    affectedArea: "PaymentService / TransactionProcessor",
    confidence: 95,
    triggerKeywordsA: ["retry", "attempt", "increase"],
    triggerKeywordsB: ["transaction", "payment", "charge", "process"],
    requiresDomain: "payment-processing",
  },
  {
    type: "semantic",
    severity: "high",
    title: "Webhook Processing Race Condition",
    description: "Combined changes to payment retry logic and webhook handling create a race condition where retry completion and webhook arrival can both trigger state transitions.",
    changeAAssumption: "Retry completion is the authoritative signal for payment state transitions.",
    changeBAssumption: "Webhook arrival triggers the same state transitions independently.",
    collisionReason: "Both changes can trigger the same payment state machine transition. Without distributed locking, the state machine can be driven to an invalid state.",
    consequence: "Payment status is inconsistent between the application and the payment provider. Orders stuck in pending state or incorrectly marked as failed.",
    resolution: "Implement a distributed lock or idempotent state machine before deploying both changes together.",
    affectedArea: "PaymentService / WebhookHandler",
    confidence: 82,
    triggerKeywordsA: ["retry", "webhook"],
    triggerKeywordsB: ["webhook", "event", "status", "payment"],
    requiresDomain: "payment-processing",
  },

  // ── Database conflicts ────────────────────────────────────
  {
    type: "contract",
    severity: "critical",
    title: "Column Rename / Data Model Contract Break",
    description: "Change A renames or restructures a database column. Change B writes to or reads from the original column name.",
    changeAAssumption: "Column has been renamed. All application code has been updated to use the new column name.",
    changeBAssumption: "Original column name is valid and available for writes/reads.",
    collisionReason: "Change B's data access code references a column that Change A has renamed or dropped. The schema and the application code are out of sync.",
    consequence: "Database operations in Change B fail at runtime with column-not-found errors. Data corruption or loss if partial writes succeed before the error.",
    resolution: "Apply Change B's column references update before or simultaneously with Change A's rename migration. Use a phased rename: add new column, copy data, migrate readers, drop old column.",
    affectedArea: "Database Schema / DataLayer",
    confidence: 92,
    triggerKeywordsA: ["rename", "alter", "column", "schema", "migration"],
    triggerKeywordsB: ["column", "table", "insert", "update", "select", "write", "read"],
    requiresDomain: "database",
  },
  {
    type: "semantic",
    severity: "high",
    title: "Concurrent Migration Safety",
    description: "Both changes include schema modifications that could conflict when applied concurrently or in rapid succession.",
    changeAAssumption: "Schema migration applies atomically to an unmodified schema.",
    changeBAssumption: "Schema is in its pre-Change-A state when this migration applies.",
    collisionReason: "If both migrations run against the same schema baseline, constraint violations or duplicate operations may occur.",
    consequence: "Migration failure, potentially leaving the database in a partially migrated state.",
    resolution: "Sequence the migrations explicitly. Apply Change A first, then Change B, in a controlled deployment window.",
    affectedArea: "Database / Migration Scripts",
    confidence: 78,
    triggerKeywordsA: ["migration", "schema", "alter", "table"],
    triggerKeywordsB: ["migration", "schema", "alter", "table"],
    requiresDomain: "database",
  },

  // ── API contract conflicts ────────────────────────────────
  {
    type: "contract",
    severity: "critical",
    title: "API Response Field Renamed",
    description: "Change A renames a response field in an API contract. Change B is a consumer that reads the original field name.",
    changeAAssumption: "API consumers have been updated to use the new field name.",
    changeBAssumption: "The API response contains the original field name.",
    collisionReason: "Change A produces a response with the new field name. Change B reads the original field name and receives undefined, causing null reference errors or silent data loss.",
    consequence: "Features depending on this API field silently break. Depending on null-safety handling, this may cause crashes or incorrect behaviour.",
    resolution: "Version the API endpoint. Keep the old field name as a deprecated alias during a migration window. Update Change B to read the new field before removing the alias.",
    affectedArea: "API Contract / Consumer",
    confidence: 92,
    triggerKeywordsA: ["field", "rename", "response", "api", "contract", "token", "accesstoken"],
    triggerKeywordsB: ["field", "response", "api", "token", "consume", "read", "parse"],
    requiresDomain: "api",
  },
  {
    type: "contract",
    severity: "high",
    title: "API Endpoint Path or Method Change",
    description: "Change A modifies an API endpoint path or HTTP method. Change B makes requests to the original path.",
    changeAAssumption: "All consumers have been updated to the new API path.",
    changeBAssumption: "Requests to the original endpoint path are valid.",
    collisionReason: "Change B's HTTP client is hardcoded to the original endpoint path. Change A's routing update returns 404 for those requests.",
    consequence: "Features that depend on this API call fail silently or with 404 errors.",
    resolution: "Maintain the original endpoint as a redirect during the migration window. Update Change B before retiring the old path.",
    affectedArea: "API Router / HTTP Client",
    confidence: 85,
    triggerKeywordsA: ["route", "path", "endpoint", "url", "method"],
    triggerKeywordsB: ["fetch", "request", "http", "call", "endpoint", "url"],
    requiresDomain: "api",
  },

  // ── Async/ordering conflicts ──────────────────────────────
  {
    type: "ordering",
    severity: "high",
    title: "Synchronous → Asynchronous Processing Assumption Conflict",
    description: "Change A makes an operation asynchronous. Change B has code that assumes the same operation completes synchronously before proceeding.",
    changeAAssumption: "The operation is enqueued and processed asynchronously. Callers should not block waiting for completion.",
    changeBAssumption: "The operation completes before the next line of code runs. The result is available immediately.",
    collisionReason: "Change B's sequential control flow depends on immediate completion of an operation that Change A has made asynchronous.",
    consequence: "Race conditions where Change B reads state before the async operation has completed. Unpredictable behavior depending on system load.",
    resolution: "Update Change B to handle asynchronous results (callbacks, promises, events). Alternatively, keep a synchronous overload for existing callers.",
    affectedArea: "Processing Layer / Consumer Code",
    confidence: 84,
    triggerKeywordsA: ["async", "queue", "background", "event", "enqueue"],
    triggerKeywordsB: ["await", "sync", "complete", "result", "return"],
    requiresDomain: "async-processing",
  },

  // ── Configuration conflicts ───────────────────────────────
  {
    type: "configuration",
    severity: "high",
    title: "Timeout Conflict: Reduction vs Longer Dependency",
    description: "Change A reduces a timeout value. Change B introduces or depends on a slower operation that may exceed the reduced timeout.",
    changeAAssumption: "Operations complete within the reduced timeout. The tighter threshold is acceptable.",
    changeBAssumption: "Operations have sufficient time to complete. The timeout is not a constraint.",
    collisionReason: "Change B's slower operation exceeds the new timeout set by Change A, causing premature failures.",
    consequence: "Operations that previously succeeded now time out unexpectedly. Intermittent errors under normal load.",
    resolution: "Profile the slowest operation under Change B before applying Change A's timeout reduction. Adjust either the timeout or the operation's performance.",
    affectedArea: "ConfigService / Request Pipeline",
    confidence: 80,
    triggerKeywordsA: ["timeout", "reduce", "limit", "threshold"],
    triggerKeywordsB: ["slow", "external", "dependency", "delay", "latency"],
    requiresDomain: "configuration",
  },

  // ── Caching conflicts ─────────────────────────────────────
  {
    type: "state",
    severity: "medium",
    title: "Cache Key Namespace Collision",
    description: "Both changes modify cache key generation or cache namespace logic for shared data. Cache reads and writes may use incompatible key formats.",
    changeAAssumption: "Cache keys follow the new naming convention.",
    changeBAssumption: "Cache keys follow the original naming convention.",
    collisionReason: "After Change A, new data is written with new key formats. Change B reads with old key formats and misses, falling back to database on every request.",
    consequence: "Cache becomes ineffective. Database query load spikes as fallback queries bypass cache on every request.",
    resolution: "Coordinate cache key format change. Warm the new key namespace before retiring the old one.",
    affectedArea: "CacheLayer / CacheKeys",
    confidence: 78,
    triggerKeywordsA: ["cache", "key", "namespace", "redis"],
    triggerKeywordsB: ["cache", "key", "read", "get", "lookup"],
    requiresDomain: "caching",
  },
];

// ── Main conflict detection function ─────────────────────────

export function detectConflicts(
  textA: string,
  textB: string,
  domainsA: DetectedDomain[],
  domainsB: DetectedDomain[]
): { direct: SimConflict[]; semantic: SimConflict[] } {
  const normA = textA.toLowerCase();
  const normB = textB.toLowerCase();

  const domainIdsA = new Set(domainsA.map((d) => d.domain));
  const domainIdsB = new Set(domainsB.map((d) => d.domain));

  const direct: SimConflict[] = [];
  const semantic: SimConflict[] = [];

  for (const template of CONFLICT_TEMPLATES) {
    // At least one side must have the required domain
    if (
      !domainIdsA.has(template.requiresDomain as DetectedDomain["domain"]) &&
      !domainIdsB.has(template.requiresDomain as DetectedDomain["domain"])
    ) {
      continue;
    }

    // Check trigger keywords: A-side keywords in A, B-side keywords in B
    const aMatches = template.triggerKeywordsA.filter((k) => normA.includes(k)).length;
    const bMatches = template.triggerKeywordsB.filter((k) => normB.includes(k)).length;

    // Also check A-keywords in B and B-keywords in A (bi-directional)
    const aInB = template.triggerKeywordsA.filter((k) => normB.includes(k)).length;
    const bInA = template.triggerKeywordsB.filter((k) => normA.includes(k)).length;

    const crossScore = Math.max(
      (aMatches > 0 && bMatches > 0) ? aMatches + bMatches : 0,
      (aInB > 0 && bInA > 0) ? aInB + bInA : 0,
    );

    if (crossScore === 0) continue;

    const conflict: SimConflict = {
      id: nanoid(),
      type: template.type,
      severity: template.severity,
      title: template.title,
      description: template.description,
      changeAAssumption: template.changeAAssumption,
      changeBAssumption: template.changeBAssumption,
      collisionReason: template.collisionReason,
      consequence: template.consequence,
      resolution: template.resolution,
      affectedArea: template.affectedArea,
      confidence: Math.min(98, template.confidence + Math.floor(crossScore * 2)),
    };

    if (template.type === "direct" || template.type === "contract") {
      direct.push(conflict);
    } else {
      semantic.push(conflict);
    }
  }

  return { direct, semantic };
}

// ── Integration checks ────────────────────────────────────────

export function buildIntegrationChecks(
  conflicts: SimConflict[],
  domainsA: DetectedDomain[],
  domainsB: DetectedDomain[],
): IntegrationCheck[] {
  const domainIdsA = new Set(domainsA.map((d) => d.domain));
  const domainIdsB = new Set(domainsB.map((d) => d.domain));
  const hasOverlap = domainsA.some((d) => domainIdsB.has(d.domain));

  const checks: IntegrationCheck[] = [];

  // Build compatibility
  checks.push({
    label: "Build Compatibility",
    category: "build",
    outcome: conflicts.some((c) => c.severity === "critical") ? "warning" : "compatible",
    detail: conflicts.some((c) => c.severity === "critical")
      ? "Critical semantic conflicts detected. Integration may cause runtime failures."
      : "No direct build incompatibilities detected from static analysis.",
    analysisType: "static_analysis",
    confidence: 75,
  });

  // API contracts
  const apiConflicts = conflicts.filter((c) => c.type === "contract");
  if (domainIdsA.has("api") || domainIdsB.has("api")) {
    checks.push({
      label: "API Contracts",
      category: "api_contracts",
      outcome: apiConflicts.length > 0 ? "conflict" : "compatible",
      detail: apiConflicts.length > 0
        ? `${apiConflicts.length} API contract conflict(s) detected. Field names or endpoint paths are incompatible.`
        : "No API contract violations detected between the two changes.",
      analysisType: "static_analysis",
      confidence: 82,
    });
  }

  // Shared state
  const stateConflicts = conflicts.filter((c) => c.type === "state" || c.type === "semantic");
  if (hasOverlap) {
    checks.push({
      label: "Shared State Assumptions",
      category: "shared_state",
      outcome: stateConflicts.length > 0 ? "conflict" : "compatible",
      detail: stateConflicts.length > 0
        ? `${stateConflicts.length} shared state conflict(s). The changes make incompatible assumptions about shared system state.`
        : "No shared state conflicts detected. Changes appear to operate on independent state.",
      analysisType: "inferred",
      confidence: 70,
    });
  }

  // Behavioral
  const behavioralConflicts = conflicts.filter((c) => c.type === "ordering" || c.type === "configuration");
  checks.push({
    label: "Behavioral Assumptions",
    category: "behavioral",
    outcome: behavioralConflicts.length > 0 ? "warning" : "compatible",
    detail: behavioralConflicts.length > 0
      ? `${behavioralConflicts.length} behavioral assumption conflict(s). Timing, ordering, or configuration assumptions differ.`
      : "Behavioral assumptions appear compatible based on static analysis.",
    analysisType: "inferred",
    confidence: 68,
  });

  // Static analysis coverage note
  checks.push({
    label: "Analysis Coverage",
    category: "execution",
    outcome: "not_connected",
    detail: "All checks are static and semantic analysis only. No code is executed — findings are based on pattern recognition and behavioral inference.",
    analysisType: "execution_evidence",
    confidence: 0,
  });

  return checks;
}

// ── Compute integration risk score ────────────────────────────

export function computeIntegrationRisk(
  conflicts: SimConflict[],
  overlaps: DomainOverlap[]
): number {
  if (conflicts.length === 0 && overlaps.length === 0) return 8;

  let score = 0;
  for (const c of conflicts) {
    score += c.severity === "critical" ? 40 : c.severity === "high" ? 22 : c.severity === "medium" ? 10 : 4;
  }
  score += overlaps.length * 5;

  return Math.min(100, score);
}

// ── Compute confidence ────────────────────────────────────────

export function computeSimConfidence(
  conflicts: SimConflict[],
  textALength: number,
  textBLength: number
): number {
  let conf = 55;
  const avgLen = (textALength + textBLength) / 2;
  if (avgLen > 100) conf += 10;
  if (avgLen > 300) conf += 8;
  if (conflicts.length > 0) conf += Math.min(20, conflicts.length * 7);
  return Math.min(96, conf);
}

// ── Integration verdict ───────────────────────────────────────

export function deriveIntegrationVerdict(
  riskScore: number,
  conflicts: SimConflict[]
): { verdict: SimulationResult["verdict"]; rationale: string } {
  const criticals = conflicts.filter((c) => c.severity === "critical").length;
  const highs = conflicts.filter((c) => c.severity === "high").length;

  if (criticals > 0) {
    return {
      verdict: "conflict_detected",
      rationale: `${criticals} critical semantic conflict${criticals > 1 ? "s" : ""} detected. Git may report no merge conflict, but VERDICT identified ${criticals > 1 ? "incompatible behavioral assumptions" : "an incompatible behavioral assumption"} that will cause system failures when these changes coexist.`,
    };
  }
  if (riskScore >= 60 || highs > 0) {
    return {
      verdict: "requires_revision",
      rationale: `${highs} high-severity conflict${highs !== 1 ? "s" : ""} found. The integration is unsafe without remediation. Address all flagged conflicts before merging.`,
    };
  }
  if (riskScore >= 25) {
    return {
      verdict: "approved_with_conditions",
      rationale: `Medium-level integration risk identified. These changes can coexist after satisfying the integration conditions below. No critical behavioral conflicts detected.`,
    };
  }
  return {
    verdict: "safe_to_integrate",
    rationale: `No semantic conflicts detected between these changes. They operate on independent domains and do not make incompatible behavioral assumptions. Standard integration testing applies.`,
  };
}

import type { SimulationResult } from "./types";
