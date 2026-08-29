// ============================================================
// VERDICT — Integration Strategy Generator
// Produces ordered, actionable steps to safely integrate two changes.
// ============================================================

import type { SimConflict, IntegrationStep, IntegrationVerdictOutcome } from "./types";
import type { DetectedDomain } from "./domain-detector";

type StrategyTemplate = {
  requiresDomain?: string;
  requiresConflictType?: SimConflict["type"];
  steps: Omit<IntegrationStep, "order">[];
};

const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    requiresDomain: "authentication",
    steps: [
      { action: "Implement dual-authentication support", rationale: "Run old and new auth mechanisms in parallel during the migration window.", priority: "required" },
      { action: "Migrate token consumers to the new format", rationale: "Update all token/session readers before cutting over.", priority: "required" },
      { action: "Apply authentication mechanism change (Change A)", rationale: "Once consumers are updated, apply the authentication migration.", priority: "required" },
      { action: "Run authentication regression test suite", rationale: "Verify all auth flows, including edge cases like token refresh and session renewal.", priority: "required" },
      { action: "Deploy behind a feature flag", rationale: "Enable gradual rollout with instant disable capability.", priority: "recommended" },
    ],
  },
  {
    requiresDomain: "payment-processing",
    steps: [
      { action: "Add idempotency keys to all payment operations", rationale: "Idempotency protection must be in place before retry counts are increased.", priority: "required" },
      { action: "Implement deduplication logic at the transaction layer", rationale: "Ensures that duplicate requests produce the same outcome rather than duplicate charges.", priority: "required" },
      { action: "Apply retry count increase (Change A)", rationale: "Safe to increase retries once idempotency is enforced.", priority: "required" },
      { action: "Run payment integration test suite", rationale: "Validate retry behavior, idempotency, and webhook handling.", priority: "required" },
      { action: "Monitor duplicate transaction rate for 24h post-deployment", rationale: "Detect any edge case duplication that slipped through.", priority: "recommended" },
    ],
  },
  {
    requiresDomain: "database",
    steps: [
      { action: "Verify and snapshot production database backup", rationale: "Ensure a rollback path exists before any schema changes.", priority: "required" },
      { action: "Apply migration on staging with production data snapshot", rationale: "Validate the migration runs cleanly before touching production.", priority: "required" },
      { action: "Update all application references to use new schema (Change B)", rationale: "Synchronize application code with the new schema before migration runs.", priority: "required" },
      { action: "Apply schema migration (Change A)", rationale: "Run the schema change after application code is updated.", priority: "required" },
      { action: "Run database integrity checks post-migration", rationale: "Confirm data consistency after schema change.", priority: "required" },
    ],
  },
  {
    requiresDomain: "api",
    steps: [
      { action: "Version the API endpoint (e.g. /v2/...)", rationale: "Prevent breaking existing consumers by versioning the changed contract.", priority: "required" },
      { action: "Update Change B to use the new API field/path", rationale: "Migrate the consumer before retiring the old field.", priority: "required" },
      { action: "Deploy Change A with backwards-compatibility alias", rationale: "Serve old field name as deprecated alias during migration window.", priority: "required" },
      { action: "Remove deprecated field/path after consumer migration is confirmed", rationale: "Clean up only after all consumers are verified to use the new contract.", priority: "recommended" },
    ],
  },
  {
    requiresDomain: "async-processing",
    steps: [
      { action: "Update Change B to handle asynchronous responses", rationale: "Convert synchronous assumptions to event/callback/promise patterns.", priority: "required" },
      { action: "Configure dead-letter queue for failure handling", rationale: "Ensure failures in the async flow are recoverable.", priority: "required" },
      { action: "Apply asynchronous change (Change A)", rationale: "Safe to make the operation async once consumers handle it correctly.", priority: "required" },
      { action: "Test all async/sync boundary interactions", rationale: "Validate end-to-end flow including error paths.", priority: "required" },
    ],
  },
];

const GENERIC_STRATEGY_STEPS: Omit<IntegrationStep, "order">[] = [
  { action: "Run static analysis on both changes together", rationale: "Catch any remaining contract mismatches before merging.", priority: "required" },
  { action: "Apply changes to a staging environment", rationale: "Validate integration with production-equivalent load.", priority: "required" },
  { action: "Execute all relevant integration tests", rationale: "Confirm system behavior under the combined changes.", priority: "required" },
  { action: "Deploy behind a feature flag", rationale: "Limit blast radius of any unforeseen integration issues.", priority: "recommended" },
  { action: "Monitor error rates and key metrics for 24h post-deployment", rationale: "Detect integration issues that only appear under production load.", priority: "recommended" },
];

export function generateIntegrationStrategy(
  conflicts: SimConflict[],
  domainsA: DetectedDomain[],
  domainsB: DetectedDomain[],
  verdict: IntegrationVerdictOutcome
): IntegrationStep[] {
  if (verdict === "safe_to_integrate") {
    return [
      { order: 1, action: "Run integration tests for both changes", rationale: "Standard validation before merging any two changes.", priority: "recommended" },
      { order: 2, action: "Merge and deploy to staging", rationale: "Confirm integration in a production-equivalent environment.", priority: "recommended" },
      { order: 3, action: "Monitor for 24h post-deployment", rationale: "Confirm the combined changes perform as expected under load.", priority: "optional" },
    ];
  }

  const allDomains = new Set([
    ...domainsA.map((d) => d.domain),
    ...domainsB.map((d) => d.domain),
  ]);
  const allSteps: Omit<IntegrationStep, "order">[] = [];
  const seen = new Set<string>();

  // Add domain-specific steps
  for (const template of STRATEGY_TEMPLATES) {
    if (template.requiresDomain && !allDomains.has(template.requiresDomain as import("./domain-detector").DomainId)) continue;
    for (const step of template.steps) {
      if (!seen.has(step.action)) {
        seen.add(step.action);
        allSteps.push(step);
      }
    }
  }

  // Add generic steps that aren't already covered
  for (const step of GENERIC_STRATEGY_STEPS) {
    if (!seen.has(step.action)) {
      seen.add(step.action);
      allSteps.push(step);
    }
  }

  // Sort: required first, then recommended
  const sorted = allSteps.sort((a, b) => {
    const priority = { required: 0, recommended: 1, optional: 2 };
    return priority[a.priority] - priority[b.priority];
  });

  return sorted.slice(0, 6).map((s, i) => ({ ...s, order: i + 1 }));
}
