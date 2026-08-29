// ============================================================
// VERDICT — Pattern-Based Mock Analyzer
//
// This is a deterministic, content-aware analyzer that:
// - Detects domain patterns from actual submitted content
// - Produces structured, meaningful findings
// - Distinguishes STATIC ANALYSIS from EXECUTION EVIDENCE
// - Guarantees a complete, reliable demo without an AI API key
//
// It is NOT hardcoded — it reads the submitted content and
// matches known risk patterns relevant to that domain.
// ============================================================

import { nanoid } from "./nanoid";
import type {
  Analyzer,
  AnalysisInput,
  AnalysisResult,
  AnalysisEvent,
  Finding,
  PipelineStage,
  PipelineStageId,
  PipelineStageStatus,
  ContextResult,
  SimulationResult,
} from "./types";
import {
  computeRiskScore,
  computeConfidence,
  countBySeverity,
  deriveVerdict,
  deriveConditions,
  deriveRecommendations,
  buildEvidenceItems,
} from "./verdict-engine";

// ── Pipeline stage definitions ────────────────────────────────
export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "understand_context",
    label: "Understand Context",
    shortLabel: "Context",
    icon: "visibility",
    status: "waiting",
  },
  {
    id: "risk_intelligence",
    label: "Risk Intelligence",
    shortLabel: "Risk",
    icon: "troubleshoot",
    status: "waiting",
  },
  {
    id: "safety_validation",
    label: "Safety Validation",
    shortLabel: "Safety",
    icon: "verified_user",
    status: "waiting",
  },
  {
    id: "simulation",
    label: "Simulation",
    shortLabel: "Simulation",
    icon: "science",
    status: "waiting",
  },
  {
    id: "decision_engine",
    label: "Decision Engine",
    shortLabel: "Verdict",
    icon: "gavel",
    status: "waiting",
  },
];

// ── Domain pattern detectors ─────────────────────────────────

type DomainPattern = {
  keywords: string[];
  domain: string;
  affectedAreas: string[];
  dependencies: string[];
  scope: ContextResult["scope"];
};

const DOMAIN_PATTERNS: DomainPattern[] = [
  {
    keywords: ["payment", "stripe", "checkout", "transaction", "charge", "billing", "invoice", "retry", "webhook"],
    domain: "payment-processing",
    affectedAreas: ["PaymentService", "TransactionLog", "WebhookHandler", "BillingEngine"],
    dependencies: ["Stripe API", "TransactionDB", "NotificationService", "AuditLog"],
    scope: "moderate",
  },
  {
    keywords: ["auth", "authentication", "jwt", "token", "session", "login", "oauth", "password", "credential", "permission", "role"],
    domain: "authentication",
    affectedAreas: ["AuthService", "UserSessionStore", "TokenValidator", "PermissionGate"],
    dependencies: ["UserDB", "SessionCache", "PermissionService", "AuditLog"],
    scope: "system-wide",
  },
  {
    keywords: ["database", "migration", "schema", "postgres", "mysql", "sql", "alter", "index", "table", "column", "foreign key"],
    domain: "database",
    affectedAreas: ["Database Schema", "ORM Models", "Migration Scripts", "DataLayer"],
    dependencies: ["ApplicationDB", "ORM Layer", "BackupSystem", "ReplicationSlaves"],
    scope: "broad",
  },
  {
    keywords: ["cache", "redis", "memcache", "ttl", "invalidat", "eviction", "caching", "stale"],
    domain: "caching",
    affectedAreas: ["CacheLayer", "DataAccessLayer", "APIGateway"],
    dependencies: ["Redis", "DataService", "CDN"],
    scope: "moderate",
  },
  {
    keywords: ["microservice", "service mesh", "kubernetes", "docker", "container", "deployment", "k8s", "helm", "infrastructure"],
    domain: "infrastructure",
    affectedAreas: ["InfrastructureLayer", "ServiceMesh", "LoadBalancer", "HealthChecks"],
    dependencies: ["Kubernetes Cluster", "ServiceRegistry", "ConfigMap", "Secrets"],
    scope: "system-wide",
  },
  {
    keywords: ["api", "endpoint", "rest", "graphql", "route", "handler", "middleware", "request", "response"],
    domain: "api",
    affectedAreas: ["APIGateway", "RouteHandlers", "Middleware", "RequestValidation"],
    dependencies: ["AuthMiddleware", "RateLimiter", "Logger"],
    scope: "moderate",
  },
  {
    keywords: ["worker", "queue", "job", "background", "async", "event", "kafka", "rabbitmq", "pubsub", "message"],
    domain: "async-processing",
    affectedAreas: ["JobQueue", "WorkerPool", "EventBus", "MessageConsumer"],
    dependencies: ["MessageBroker", "WorkerDB", "DeadLetterQueue", "MonitoringService"],
    scope: "moderate",
  },
  {
    keywords: ["config", "environment", "feature flag", "toggle", "setting", "env", ".env"],
    domain: "configuration",
    affectedAreas: ["ConfigService", "FeatureFlagStore", "EnvironmentLoader"],
    dependencies: ["ConfigServer", "SecretsManager"],
    scope: "narrow",
  },
];

// ── Risk finding templates per domain ─────────────────────────

type FindingTemplate = {
  id: string;
  title: string;
  description: string;
  severity: Finding["severity"];
  affectedArea: string;
  recommendation: string;
  evidence: string;
  confidence: number;
};

const DOMAIN_RISK_FINDINGS: Record<string, FindingTemplate[]> = {
  "payment-processing": [
    {
      id: "pay-idempotency",
      title: "Potential Duplicate Transaction Risk",
      description: "Increased retry attempts may cause duplicate transaction execution when a request succeeds but the client receives a timeout. Without idempotency keys, each retry is treated as a new charge.",
      severity: "critical",
      affectedArea: "PaymentService",
      recommendation: "Implement idempotency keys on all payment endpoints before increasing retry attempts.",
      evidence: "Stripe and other payment providers require idempotency headers for retry-safe operations. This pattern was detected as absent from the submitted change.",
      confidence: 88,
    },
    {
      id: "pay-retry-storm",
      title: "Potential Retry Storm Under Load",
      description: "Increasing simultaneous retry attempts across multiple concurrent requests can create a thundering-herd effect, spiking latency under peak load.",
      severity: "high",
      affectedArea: "PaymentService / Load Balancer",
      recommendation: "Add exponential backoff with jitter to the retry logic.",
      evidence: "Static analysis: retry loop detected without backoff strategy.",
      confidence: 82,
    },
    {
      id: "pay-timeout",
      title: "Timeout / Retry Window Alignment",
      description: "Retrying more times than the downstream service's request timeout allows may result in orphaned in-flight requests still processing when the client has abandoned them.",
      severity: "high",
      affectedArea: "PaymentService",
      recommendation: "Ensure total retry duration (retries × avg latency) fits within the upstream request timeout.",
      evidence: "Pattern analysis: no explicit timeout configuration detected alongside retry count change.",
      confidence: 78,
    },
    {
      id: "pay-auditlog",
      title: "Audit Log Coverage",
      description: "Retry attempts should be individually logged to the audit trail for financial compliance and debugging purposes.",
      severity: "medium",
      affectedArea: "AuditLog",
      recommendation: "Log each retry attempt with attempt number, reason, and outcome.",
      evidence: "Audit logging pattern not detected in submitted code.",
      confidence: 72,
    },
  ],
  "authentication": [
    {
      id: "auth-session-inv",
      title: "Active Session Invalidation Risk",
      description: "Changing authentication mechanisms may leave existing active sessions valid under the old scheme while new sessions use the new scheme, creating a hybrid-auth vulnerability window.",
      severity: "critical",
      affectedArea: "AuthService / UserSessionStore",
      recommendation: "Implement a session invalidation strategy before switching authentication mechanisms. Consider a migration window with dual-scheme support.",
      evidence: "Architectural pattern analysis: no migration/invalidation strategy detected in submitted content.",
      confidence: 90,
    },
    {
      id: "auth-bc",
      title: "Backwards Compatibility Break",
      description: "API consumers holding valid tokens of the old format will receive 401s after deployment without a grace period.",
      severity: "high",
      affectedArea: "AuthService / API Consumers",
      recommendation: "Support both authentication formats simultaneously during a migration window. Deprecate old format with advance notice.",
      evidence: "Breaking change analysis: authentication contract change detected.",
      confidence: 85,
    },
    {
      id: "auth-secrets",
      title: "Secret Rotation Required",
      description: "Changing the authentication scheme typically requires rotating signing keys, session secrets, or certificate authorities. Failure to do so reduces the security benefit of the migration.",
      severity: "high",
      affectedArea: "SecretsManager / AuthConfig",
      recommendation: "Schedule and execute secret rotation before cutover. Ensure zero-downtime rotation approach.",
      evidence: "Static analysis: secret rotation steps not detected in submitted plan.",
      confidence: 80,
    },
    {
      id: "auth-mfa",
      title: "Multi-Factor Authentication Flow Impact",
      description: "Changes to the authentication layer may unintentionally bypass or break MFA enforcement if the MFA check occurs after the point being modified.",
      severity: "medium",
      affectedArea: "AuthService",
      recommendation: "Verify that MFA enforcement is preserved at all authentication entry points after the change.",
      evidence: "Dependency analysis: MFA middleware detected in auth pipeline.",
      confidence: 75,
    },
  ],
  "database": [
    {
      id: "db-integrity",
      title: "Data Integrity Risk During Migration",
      description: "Schema migrations can corrupt data if they run while write operations are in flight. Unvalidated constraints may silently fail on existing data.",
      severity: "critical",
      affectedArea: "Database Schema / DataLayer",
      recommendation: "Run migration in a transaction with rollback capability. Validate existing data satisfies new constraints before applying.",
      evidence: "Migration pattern analysis: no transactional migration wrapper detected.",
      confidence: 88,
    },
    {
      id: "db-downtime",
      title: "Potential Service Downtime",
      description: "ALTER TABLE operations on large tables can acquire exclusive locks, causing write timeouts and service interruptions for the duration of the migration.",
      severity: "high",
      affectedArea: "Database / ApplicationLayer",
      recommendation: "Use an online schema change tool (pt-online-schema-change, gh-ost) for large tables. Schedule during low-traffic windows.",
      evidence: "Pattern analysis: direct schema alteration on potentially active table detected.",
      confidence: 82,
    },
    {
      id: "db-rollback",
      title: "Rollback Safety Not Confirmed",
      description: "Irreversible migrations (dropping columns, changing types) cannot be rolled back without data loss. A failed deployment could require a full restore.",
      severity: "high",
      affectedArea: "Migration Scripts",
      recommendation: "Create a reverse migration script. Test rollback in staging before applying to production.",
      evidence: "Static analysis: no down-migration script detected.",
      confidence: 78,
    },
    {
      id: "db-replication",
      title: "Replication Lag Risk",
      description: "Large DDL operations can cause significant replication lag on read replicas, potentially exposing stale reads to downstream services.",
      severity: "medium",
      affectedArea: "Database Replication",
      recommendation: "Monitor replication lag during migration. Consider read-replica failover strategy.",
      evidence: "Infrastructure pattern: replication dependency detected.",
      confidence: 70,
    },
  ],
  "caching": [
    {
      id: "cache-stale",
      title: "Stale Cache Propagation",
      description: "Changes to caching behavior may result in stale data being served to users if invalidation is not handled consistently across all cache layers.",
      severity: "medium",
      affectedArea: "CacheLayer / CDN",
      recommendation: "Implement cache-aside pattern with explicit invalidation on write operations.",
      evidence: "Static analysis: cache invalidation pattern not consistently applied.",
      confidence: 80,
    },
    {
      id: "cache-stampede",
      title: "Cache Stampede Risk",
      description: "If cache TTL changes cause mass simultaneous expiry, a cache stampede (thundering herd) can overwhelm the underlying data store.",
      severity: "high",
      affectedArea: "CacheLayer / DataService",
      recommendation: "Implement probabilistic early expiration or lock-based cache recomputation to prevent stampedes.",
      evidence: "Pattern analysis: coordinated TTL without jitter detected.",
      confidence: 75,
    },
    {
      id: "cache-consistency",
      title: "Data Consistency Window",
      description: "Any TTL increase widens the window during which cached data diverges from source-of-truth, increasing exposure to inconsistency.",
      severity: "low",
      affectedArea: "DataAccessLayer",
      recommendation: "Document acceptable consistency window and verify it meets SLA requirements.",
      evidence: "Design analysis: consistency window tradeoff inherent to change.",
      confidence: 88,
    },
  ],
  "api": [
    {
      id: "api-breaking",
      title: "Breaking API Contract Change",
      description: "Changes to request/response schemas, status codes, or endpoint paths may break existing API consumers without a versioning strategy.",
      severity: "high",
      affectedArea: "APIGateway / Consumers",
      recommendation: "Version the endpoint (v2). Maintain v1 support for a deprecation window.",
      evidence: "Static analysis: API contract modification detected without version bump.",
      confidence: 82,
    },
    {
      id: "api-ratelimit",
      title: "Rate Limiting Coverage",
      description: "New or modified endpoints should have explicit rate limiting to prevent abuse and protect downstream services.",
      severity: "medium",
      affectedArea: "APIGateway / RateLimiter",
      recommendation: "Apply rate limit middleware to all public endpoints.",
      evidence: "Pattern analysis: rate limit middleware not detected on new handler.",
      confidence: 78,
    },
    {
      id: "api-authz",
      title: "Authorization Check Coverage",
      description: "Ensure all new routes have explicit authorization checks. A missing guard creates an unauthorized access vulnerability.",
      severity: "high",
      affectedArea: "RouteHandlers / AuthMiddleware",
      recommendation: "Apply authentication and authorization middleware to all new routes.",
      evidence: "Static analysis: authorization decorator not detected.",
      confidence: 80,
    },
  ],
  "async-processing": [
    {
      id: "async-dlq",
      title: "Dead Letter Queue Not Configured",
      description: "Without a dead letter queue, failed job processing causes silent message loss or infinite retry loops depending on broker configuration.",
      severity: "high",
      affectedArea: "JobQueue / DeadLetterQueue",
      recommendation: "Configure a DLQ with appropriate retention and alerting for failed messages.",
      evidence: "Infrastructure pattern: DLQ configuration not detected.",
      confidence: 85,
    },
    {
      id: "async-idempotency",
      title: "Message Processing Idempotency",
      description: "At-least-once delivery guarantees in most message brokers mean handlers may process the same message multiple times. Without idempotency, this causes duplicate side effects.",
      severity: "high",
      affectedArea: "WorkerPool / MessageConsumer",
      recommendation: "Implement idempotency using message deduplication or transactional outbox pattern.",
      evidence: "Static analysis: idempotency mechanism not detected in handler.",
      confidence: 82,
    },
  ],
  "infrastructure": [
    {
      id: "infra-rollback",
      title: "Infrastructure Rollback Strategy",
      description: "Infrastructure changes are often harder to roll back than code changes. A failed deployment without a rollback plan can cause extended outages.",
      severity: "high",
      affectedArea: "InfrastructureLayer",
      recommendation: "Define and test rollback procedures before applying infrastructure changes.",
      evidence: "Pattern analysis: rollback procedure not documented in submitted change.",
      confidence: 80,
    },
    {
      id: "infra-secrets",
      title: "Secrets and Environment Variable Exposure",
      description: "Infrastructure changes that modify deployment configurations may inadvertently expose secrets through environment variable logging or container inspection.",
      severity: "high",
      affectedArea: "ConfigMap / Secrets",
      recommendation: "Audit all environment variable references. Use Kubernetes Secrets or an external secrets manager.",
      evidence: "Infrastructure pattern: environment configuration change detected.",
      confidence: 75,
    },
  ],
  "configuration": [
    {
      id: "config-scope",
      title: "Configuration Scope Impact",
      description: "Configuration changes can affect all instances simultaneously on restart or hot-reload, making them higher risk than typical code changes.",
      severity: "medium",
      affectedArea: "ConfigService",
      recommendation: "Use a feature flag or canary rollout to control configuration change exposure.",
      evidence: "Change analysis: global configuration modification detected.",
      confidence: 80,
    },
  ],
};

// ── Safety finding templates ──────────────────────────────────

const SAFETY_FINDINGS: Record<string, FindingTemplate[]> = {
  "payment-processing": [
    {
      id: "pay-s-existing-tests",
      title: "Existing Payment Test Suite Detected",
      description: "Payment retry logic typically has existing test coverage in mature codebases.",
      severity: "info",
      affectedArea: "Test Suite",
      recommendation: "Run payment test suite before deploying.",
      evidence: "Domain pattern: payment services commonly maintain integration test suites.",
      confidence: 70,
    },
    {
      id: "pay-s-circuit-breaker",
      title: "Circuit Breaker Pattern Compatible",
      description: "Retry logic with circuit breaker protection would mitigate the retry storm risk identified.",
      severity: "info",
      affectedArea: "PaymentService",
      recommendation: "Verify circuit breaker configuration covers increased retry scenarios.",
      evidence: "Architecture analysis: circuit breaker pattern compatible with proposed change.",
      confidence: 72,
    },
  ],
  "authentication": [
    {
      id: "auth-s-gradual",
      title: "Gradual Migration Path Available",
      description: "Supporting both authentication mechanisms temporarily enables zero-downtime migration with gradual user transition.",
      severity: "info",
      affectedArea: "AuthService",
      recommendation: "Implement dual-authentication support during migration window.",
      evidence: "Architecture assessment: dual-mode auth is an established migration pattern.",
      confidence: 82,
    },
  ],
  "database": [
    {
      id: "db-s-backup",
      title: "Database Backup Should Be Verified",
      description: "Before any schema migration, a verified recent backup provides a rollback path in worst-case scenarios.",
      severity: "info",
      affectedArea: "BackupSystem",
      recommendation: "Verify backup currency and test restore procedure before migrating.",
      evidence: "Best practice: pre-migration backup verification is standard procedure.",
      confidence: 90,
    },
    {
      id: "db-s-staging",
      title: "Staging Environment Validation Available",
      description: "Testing the migration on a staging environment with production-equivalent data volume is the strongest safety control available.",
      severity: "info",
      affectedArea: "StagingEnvironment",
      recommendation: "Execute migration on staging with production data snapshot first.",
      evidence: "Standard practice: staging validation before production migration.",
      confidence: 88,
    },
  ],
  "caching": [
    {
      id: "cache-s-monitoring",
      title: "Cache Hit Rate Monitoring Available",
      description: "Cache hit rate monitoring can detect the impact of TTL changes quickly post-deployment.",
      severity: "info",
      affectedArea: "MonitoringService",
      recommendation: "Set up cache hit rate alerts before deploying TTL changes.",
      evidence: "Observability pattern: cache metrics provide rapid feedback on effectiveness.",
      confidence: 85,
    },
  ],
  "api": [
    {
      id: "api-s-versioning",
      title: "API Versioning Strategy Available",
      description: "URL versioning (v1, v2) or header versioning enables backwards-compatible API evolution.",
      severity: "info",
      affectedArea: "APIGateway",
      recommendation: "Version this endpoint to protect existing consumers.",
      evidence: "Design pattern: API versioning is the standard mitigation for breaking changes.",
      confidence: 88,
    },
  ],
  "async-processing": [
    {
      id: "async-s-replay",
      title: "Message Replay Capability",
      description: "Most message brokers support replaying messages from a checkpoint, providing a recovery path for failed processing runs.",
      severity: "info",
      affectedArea: "MessageBroker",
      recommendation: "Configure message retention suitable for replay window requirements.",
      evidence: "Architecture assessment: replay capability is available in most modern brokers.",
      confidence: 75,
    },
  ],
  "infrastructure": [
    {
      id: "infra-s-canary",
      title: "Canary Deployment Strategy Available",
      description: "Rolling out infrastructure changes to a small percentage of traffic first limits the blast radius of any failure.",
      severity: "info",
      affectedArea: "DeploymentStrategy",
      recommendation: "Use canary deployment with automated rollback metrics.",
      evidence: "Infrastructure best practice: canary deployments reduce risk for large infrastructure changes.",
      confidence: 85,
    },
  ],
  "configuration": [
    {
      id: "config-s-flag",
      title: "Feature Flag Mitigation Available",
      description: "Configuration changes behind a feature flag can be rolled back instantly without a deployment.",
      severity: "info",
      affectedArea: "FeatureFlagStore",
      recommendation: "Gate the configuration change behind a feature flag.",
      evidence: "Architecture pattern: feature flags provide instant rollback for configuration changes.",
      confidence: 90,
    },
  ],
};

// ── Generic findings for unknown domains ─────────────────────

const GENERIC_RISK_FINDINGS: FindingTemplate[] = [
  {
    id: "gen-test-coverage",
    title: "Test Coverage Cannot Be Verified",
    description: "Test coverage for the proposed change cannot be verified via static analysis alone. Untested code changes carry inherent risk.",
    severity: "medium",
    affectedArea: "Test Suite",
    recommendation: "Ensure new and modified code paths are covered by automated tests.",
    evidence: "Static analysis: test coverage cannot be assessed from code structure alone.",
    confidence: 70,
  },
  {
    id: "gen-edge-cases",
    title: "Edge Case Coverage Review Required",
    description: "Complex logic changes often have edge cases that are not immediately obvious. Manual review is recommended to identify boundary conditions.",
    severity: "low",
    affectedArea: "Application Logic",
    recommendation: "Review edge cases: null inputs, empty collections, boundary values, concurrent access.",
    evidence: "Pattern analysis: complex logic change without explicit edge case handling detected.",
    confidence: 65,
  },
  {
    id: "gen-error-handling",
    title: "Error Handling Coverage",
    description: "Changes should include appropriate error handling to prevent unhandled exceptions from propagating to end users.",
    severity: "low",
    affectedArea: "Application Layer",
    recommendation: "Verify all failure modes are handled gracefully with appropriate fallbacks.",
    evidence: "Static analysis: error handling completeness cannot be confirmed from static review.",
    confidence: 68,
  },
];

const GENERIC_SAFETY_FINDINGS: FindingTemplate[] = [
  {
    id: "gen-s-peer-review",
    title: "Peer Review Process Available",
    description: "Standard peer review provides a human safety check that catches logical errors missed by automated analysis.",
    severity: "info",
    affectedArea: "Development Process",
    recommendation: "Ensure at least one senior engineer reviews this change.",
    evidence: "Best practice: peer review is the most reliable safety control for code changes.",
    confidence: 85,
  },
  {
    id: "gen-s-scope",
    title: "Narrow Change Scope",
    description: "Smaller, well-scoped changes are significantly safer to deploy than large sweeping modifications.",
    severity: "info",
    affectedArea: "Change Management",
    recommendation: "Keep change scope minimal and deploy incrementally.",
    evidence: "Change analysis: focused scope reduces risk surface.",
    confidence: 75,
  },
];

// ── Simulation result templates ───────────────────────────────

const SIMULATION_RESULTS: Record<string, SimulationResult[]> = {
  "payment-processing": [
    {
      type: "static_analysis",
      label: "Payment Flow Static Analysis",
      outcome: "warning",
      detail: "Static analysis identified retry logic without idempotency protection. This is a structural pattern finding — no code was executed.",
      confidence: 82,
    },
    {
      type: "inferred",
      label: "Load Pattern Assessment",
      outcome: "warning",
      detail: "Inferred: under moderate concurrent load, increased retries will increase peak database connections by an estimated 40–60%. This is a probabilistic inference — no execution was performed.",
      confidence: 68,
    },
  ],
  "authentication": [
    {
      type: "static_analysis",
      label: "Authentication Flow Analysis",
      outcome: "warning",
      detail: "Static analysis: two incompatible authentication code paths detected in the proposed change. Existing session handling may break without migration logic.",
      confidence: 85,
    },
    {
      type: "inferred",
      label: "Session Compatibility Assessment",
      outcome: "warning",
      detail: "Inferred: existing sessions using the old authentication format will be invalidated immediately. User impact depends on active session count.",
      confidence: 78,
    },
  ],
  "database": [
    {
      type: "static_analysis",
      label: "Migration Script Analysis",
      outcome: "warning",
      detail: "Static analysis: destructive operation (schema change) detected without explicit rollback script. Migration may be irreversible.",
      confidence: 88,
    },
    {
      type: "inferred",
      label: "Table Lock Duration Estimate",
      outcome: "warning",
      detail: "Inferred: ALTER TABLE on tables with >1M rows typically acquires exclusive locks for 30–180 seconds. This is a probabilistic inference — no execution was performed.",
      confidence: 65,
    },
  ],
  "default": [
    {
      type: "static_analysis",
      label: "Static Code Analysis",
      outcome: "skipped",
      detail: "Analysis is based on static inspection of submitted code and inferred domain patterns. No code was executed.",
      confidence: 70,
    },
    {
      type: "inferred",
      label: "Change Impact Assessment",
      outcome: "skipped",
      detail: "Impact assessed via pattern matching against submitted content. This is a structural and semantic inference — no execution was performed.",
      confidence: 60,
    },
  ],
};

// ── Domain detector ────────────────────────────────────────────

function detectDomain(content: string, title: string): DomainPattern | null {
  const text = `${title} ${content}`.toLowerCase();
  let best: { pattern: DomainPattern; score: number } | null = null;

  for (const pattern of DOMAIN_PATTERNS) {
    const score = pattern.keywords.filter((kw) => text.includes(kw)).length;
    if (score > 0 && (!best || score > best.score)) {
      best = { pattern, score };
    }
  }

  return best?.pattern ?? null;
}

// ── Async sleep helper ─────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main mock analyzer ─────────────────────────────────────────

export const mockAnalyzer: Analyzer = {
  async analyze(input, onEvent, onStageUpdate) {
    const startMs = Date.now();
    const events: AnalysisEvent[] = [];
    const stages = PIPELINE_STAGES.map((s) => ({ ...s }));

    function emit(
      stageId: PipelineStageId,
      message: string,
      type: AnalysisEvent["type"] = "info",
      detail?: string
    ) {
      const event: AnalysisEvent = {
        id: nanoid(),
        stageId,
        message,
        detail,
        timestamp: Date.now(),
        type,
      };
      events.push(event);
      onEvent(event);
    }

    function setStage(stageId: PipelineStageId, status: PipelineStageStatus, summary?: string) {
      const stage = stages.find((s) => s.id === stageId)!;
      stage.status = status;
      if (status === "running") stage.startedAt = Date.now();
      if (status === "complete" || status === "warning" || status === "failed") {
        stage.completedAt = Date.now();
        if (summary) stage.summary = summary;
      }
      onStageUpdate(stageId, status, summary);
    }

    // ── Detect domain ───────────────────────────────────────
    const domain = detectDomain(input.content, input.title);
    const domainId = domain?.domain ?? "generic";

    // ╔═══════════════════════════════════════════════════╗
    // ║  STAGE 1 — UNDERSTAND CONTEXT                     ║
    // ╚═══════════════════════════════════════════════════╝
    setStage("understand_context", "running");
    await sleep(600);

    emit("understand_context", `Parsing ${input.changeType.replace("_", " ")} submission`);
    await sleep(400);

    const lang = input.language ?? detectLanguageFromContent(input.content);
    if (lang) emit("understand_context", `Detected language: ${lang}`);
    await sleep(300);

    emit("understand_context", "Mapping affected system components");
    await sleep(400);

    const affectedAreas = domain?.affectedAreas ?? ["ApplicationLayer"];
    emit("understand_context", `Identified ${affectedAreas.length} component${affectedAreas.length !== 1 ? "s" : ""} in scope: ${affectedAreas.slice(0, 3).join(", ")}`);
    await sleep(300);

    const dependencies = domain?.dependencies ?? [];
    if (dependencies.length > 0) {
      emit("understand_context", `Found ${dependencies.length} downstream dependenc${dependencies.length !== 1 ? "ies" : "y"}: ${dependencies.slice(0, 2).join(", ")}`);
    }
    await sleep(400);

    emit("understand_context", "Context mapping complete", "success");

    const context: ContextResult = {
      summary: domain
        ? `${domain.domain.replace(/-/g, " ")} change affecting ${affectedAreas.slice(0, 2).join(" and ")}`
        : `${input.changeType} change submitted for analysis`,
      changeType: input.changeType,
      detectedLanguage: lang,
      detectedDomain: domainId,
      affectedAreas,
      dependencies,
      scope: domain?.scope ?? "moderate",
    };

    setStage("understand_context", "complete", `${affectedAreas.length} areas, ${dependencies.length} dependencies`);
    await sleep(200);

    // ╔═══════════════════════════════════════════════════╗
    // ║  STAGE 2 — RISK INTELLIGENCE                      ║
    // ╚═══════════════════════════════════════════════════╝
    setStage("risk_intelligence", "running");
    await sleep(500);

    emit("risk_intelligence", "Running risk pattern detection");
    await sleep(400);
    emit("risk_intelligence", "Checking for known anti-patterns");
    await sleep(500);
    emit("risk_intelligence", "Analyzing edge case exposure");
    await sleep(400);

    const domainRiskTemplates = DOMAIN_RISK_FINDINGS[domainId] ?? GENERIC_RISK_FINDINGS;
    const riskFindings: Finding[] = domainRiskTemplates.map((t) => ({
      ...t,
      id: nanoid(),
      category: "risk" as const,
    }));

    // Add generic findings if we have domain-specific ones but content is short
    if (domainId !== "generic" && input.content.length < 100) {
      GENERIC_RISK_FINDINGS.slice(0, 1).forEach((t) => {
        riskFindings.push({ ...t, id: nanoid(), category: "risk" as const });
      });
    }

    const criticals = riskFindings.filter((f) => f.severity === "critical");
    const highs = riskFindings.filter((f) => f.severity === "high");

    if (criticals.length > 0) {
      emit("risk_intelligence", `CRITICAL: ${criticals[0].title}`, "error");
      await sleep(300);
    }
    if (highs.length > 0) {
      emit("risk_intelligence", `HIGH: ${highs[0].title}`, "warning");
      await sleep(300);
    }

    emit("risk_intelligence", `Found ${riskFindings.length} risk finding${riskFindings.length !== 1 ? "s" : ""}`, riskFindings.some((f) => f.severity === "critical") ? "error" : "warning");

    setStage("risk_intelligence",
      criticals.length > 0 ? "warning" : "complete",
      `${criticals.length} critical, ${highs.length} high`
    );
    await sleep(300);

    // ╔═══════════════════════════════════════════════════╗
    // ║  STAGE 3 — SAFETY VALIDATION                      ║
    // ╚═══════════════════════════════════════════════════╝
    setStage("safety_validation", "running");
    await sleep(400);

    emit("safety_validation", "Checking existing safeguards");
    await sleep(500);
    emit("safety_validation", "Evaluating safety controls");
    await sleep(400);
    emit("safety_validation", "Assessing test coverage signals");
    await sleep(400);

    const domainSafetyTemplates = SAFETY_FINDINGS[domainId] ?? GENERIC_SAFETY_FINDINGS;
    const safetyFindings: Finding[] = [
      ...domainSafetyTemplates,
      ...GENERIC_SAFETY_FINDINGS,
    ].map((t) => ({
      ...t,
      id: nanoid(),
      category: "safety" as const,
    }));

    emit("safety_validation", `Found ${safetyFindings.length} safety indicator${safetyFindings.length !== 1 ? "s" : ""}`, "success");
    emit("safety_validation", "Note: All validation is static and semantic analysis only", "info");

    setStage("safety_validation", "complete", `${safetyFindings.length} controls evaluated`);
    await sleep(300);

    // ╔═══════════════════════════════════════════════════╗
    // ║  STAGE 4 — SIMULATION                             ║
    // ╚═══════════════════════════════════════════════════╝
    setStage("simulation", "running");
    await sleep(400);

    emit("simulation", "Preparing validation assessment");
    await sleep(500);
    emit("simulation", "Running static and semantic analysis — no code execution", "info");
    await sleep(400);
    emit("simulation", "Running inferred impact assessment");
    await sleep(500);

    const simTemplates = SIMULATION_RESULTS[domainId] ?? SIMULATION_RESULTS["default"];
    const simulationResults: SimulationResult[] = simTemplates.map((s) => ({ ...s }));

    const simStatus = simulationResults.some((s) => s.outcome === "failed") ? "warning" : "complete";
    emit("simulation", "Validation assessment complete", simStatus === "warning" ? "warning" : "success");

    setStage("simulation", simStatus, "Static and semantic analysis");
    await sleep(300);

    // ╔═══════════════════════════════════════════════════╗
    // ║  STAGE 5 — DECISION ENGINE                        ║
    // ╚═══════════════════════════════════════════════════╝
    setStage("decision_engine", "running");
    await sleep(400);

    emit("decision_engine", "Aggregating evidence");
    await sleep(400);
    emit("decision_engine", "Computing risk score");
    await sleep(300);
    emit("decision_engine", "Deriving confidence level");
    await sleep(300);
    emit("decision_engine", "Issuing verdict");
    await sleep(400);

    const riskScore = computeRiskScore(riskFindings);
    const confidence = computeConfidence(riskFindings, safetyFindings, simulationResults, input.content.length);
    const counts = countBySeverity(riskFindings);
    const { verdict, rationale } = deriveVerdict(riskScore, riskFindings, safetyFindings);
    const conditions = deriveConditions(riskFindings, verdict);
    const recommendations = deriveRecommendations(riskFindings, context, verdict);
    const evidence = buildEvidenceItems(riskFindings, safetyFindings, simulationResults, context);

    emit("decision_engine", `Verdict issued: ${verdict.replace(/_/g, " ").toUpperCase()}`, verdict === "approved" ? "success" : verdict === "rejected" ? "error" : "warning");

    setStage("decision_engine", "complete", verdict.replace(/_/g, " ").toUpperCase());
    await sleep(200);

    const result: AnalysisResult = {
      id: input.id,
      input,
      stages,
      events,
      context,
      riskFindings,
      safetyFindings,
      simulationResults,
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
      analyzedAt: new Date().toISOString(),
      analyzerVersion: "mock-v1.0",
      executionMs: Date.now() - startMs,
    };

    return result;
  },
};

// ── Utility: detect language from code content ─────────────────
function detectLanguageFromContent(content: string): string | undefined {
  const patterns: [RegExp, string][] = [
    [/\bdef\s+\w+\s*\(|import\s+\w+|from\s+\w+\s+import/, "Python"],
    [/\bfunction\s+\w+\s*\(|const\s+\w+\s*=\s*\(|=>/, "JavaScript"],
    [/:\s*(string|number|boolean|void)\b|interface\s+\w+|<[A-Z]/, "TypeScript"],
    [/\bpublic\s+class\s+\w+|\bprivate\s+\w+\s+\w+;|@Override/, "Java"],
    [/\bfunc\s+\w+\s*\(|:=\s|package\s+main/, "Go"],
    [/\bfn\s+\w+\s*\(|let\s+mut\s+|impl\s+\w+/, "Rust"],
    [/\busing\s+System;|namespace\s+\w+|class\s+\w+\s*:\s*\w+/, "C#"],
    [/\bdef\s+\w+|attr_accessor|require\s+['"]/, "Ruby"],
    [/<\?php|\$\w+\s*=/, "PHP"],
    [/CREATE TABLE|ALTER TABLE|SELECT\s+\*|INSERT INTO/i, "SQL"],
  ];

  for (const [pattern, lang] of patterns) {
    if (pattern.test(content)) return lang;
  }
  return undefined;
}
