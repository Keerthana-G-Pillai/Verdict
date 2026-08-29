// ============================================================
// VERDICT — Domain Detector (shared between analysis + simulation)
// Extracted from mock-analyzer.ts for reuse in the simulation engine.
// ============================================================

export type DomainId =
  | "payment-processing"
  | "authentication"
  | "database"
  | "caching"
  | "infrastructure"
  | "api"
  | "async-processing"
  | "configuration"
  | "frontend"
  | "logging"
  | "generic";

export interface DetectedDomain {
  domain: DomainId;
  keywords: string[];
  score: number;
  affectedAreas: string[];
  dependencies: string[];
  sharedResources: string[];
}

const DOMAIN_REGISTRY: {
  id: DomainId;
  keywords: string[];
  affectedAreas: string[];
  dependencies: string[];
  sharedResources: string[];
}[] = [
  {
    id: "payment-processing",
    keywords: ["payment", "stripe", "checkout", "transaction", "charge", "billing", "invoice", "retry", "webhook", "refund", "idempotency"],
    affectedAreas: ["PaymentService", "TransactionLog", "WebhookHandler", "BillingEngine"],
    dependencies: ["Stripe API", "TransactionDB", "NotificationService", "AuditLog"],
    sharedResources: ["TransactionDB", "PaymentQueue", "BillingCache"],
  },
  {
    id: "authentication",
    keywords: ["auth", "authentication", "jwt", "token", "session", "login", "oauth", "password", "credential", "permission", "role", "bearer", "refresh", "expir", "logout"],
    affectedAreas: ["AuthService", "UserSessionStore", "TokenValidator", "PermissionGate"],
    dependencies: ["UserDB", "SessionCache", "PermissionService", "AuditLog"],
    sharedResources: ["SessionStore", "TokenSecret", "AuthDB", "UserDB"],
  },
  {
    id: "database",
    keywords: ["database", "migration", "schema", "postgres", "mysql", "sql", "alter", "index", "table", "column", "foreign key", "rename", "drop", "constraint"],
    affectedAreas: ["Database Schema", "ORM Models", "Migration Scripts", "DataLayer"],
    dependencies: ["ApplicationDB", "ORM Layer", "BackupSystem", "ReplicationSlaves"],
    sharedResources: ["ApplicationDB", "Schema", "Migrations"],
  },
  {
    id: "caching",
    keywords: ["cache", "redis", "memcache", "ttl", "invalidat", "eviction", "caching", "stale", "cached", "warm"],
    affectedAreas: ["CacheLayer", "DataAccessLayer", "APIGateway"],
    dependencies: ["Redis", "DataService", "CDN"],
    sharedResources: ["Redis", "CacheKeys", "CacheNamespace"],
  },
  {
    id: "infrastructure",
    keywords: ["microservice", "kubernetes", "docker", "container", "deployment", "k8s", "helm", "infrastructure", "service mesh", "ingress", "nginx"],
    affectedAreas: ["InfrastructureLayer", "ServiceMesh", "LoadBalancer", "HealthChecks"],
    dependencies: ["Kubernetes Cluster", "ServiceRegistry", "ConfigMap", "Secrets"],
    sharedResources: ["Kubernetes Cluster", "ConfigMap", "Secrets", "Ingress"],
  },
  {
    id: "api",
    keywords: ["api", "endpoint", "rest", "graphql", "route", "handler", "middleware", "request", "response", "field", "contract", "openapi", "swagger", "payload", "schema"],
    affectedAreas: ["APIGateway", "RouteHandlers", "Middleware", "RequestValidation"],
    dependencies: ["AuthMiddleware", "RateLimiter", "Logger"],
    sharedResources: ["API Schema", "RouteRegistry", "ResponseFormat"],
  },
  {
    id: "async-processing",
    keywords: ["worker", "queue", "job", "background", "async", "event", "kafka", "rabbitmq", "pubsub", "message", "consumer", "producer"],
    affectedAreas: ["JobQueue", "WorkerPool", "EventBus", "MessageConsumer"],
    dependencies: ["MessageBroker", "WorkerDB", "DeadLetterQueue", "MonitoringService"],
    sharedResources: ["MessageBroker", "JobQueue", "EventBus"],
  },
  {
    id: "configuration",
    keywords: ["config", "environment", "feature flag", "toggle", "setting", "env", ".env", "timeout", "limit", "threshold"],
    affectedAreas: ["ConfigService", "FeatureFlagStore", "EnvironmentLoader"],
    dependencies: ["ConfigServer", "SecretsManager"],
    sharedResources: ["ConfigStore", "EnvironmentVariables", "FeatureFlags"],
  },
  {
    id: "frontend",
    keywords: ["react", "component", "css", "style", "ui", "html", "tailwind", "class", "button", "modal", "page", "layout", "render", "view", "frontend", "client"],
    affectedAreas: ["UIComponents", "Styles", "Pages"],
    dependencies: ["React", "CSS Framework", "BundleSystem"],
    sharedResources: ["ComponentLibrary", "StyleSystem", "RoutingConfig"],
  },
  {
    id: "logging",
    keywords: ["log", "logging", "logger", "trace", "metric", "monitoring", "alert", "observability", "datadog", "sentry", "console"],
    affectedAreas: ["LoggingService", "MetricsCollector", "AlertingSystem"],
    dependencies: ["LogAggregator", "MetricsDB"],
    sharedResources: ["LogFormat", "LogLevel", "MetricsNamespace"],
  },
];

// ── Detect all matching domains from text ────────────────────

export function detectDomains(text: string): DetectedDomain[] {
  const normalized = text.toLowerCase();
  const results: DetectedDomain[] = [];

  for (const domain of DOMAIN_REGISTRY) {
    const matchedKeywords = domain.keywords.filter((kw) => normalized.includes(kw));
    if (matchedKeywords.length > 0) {
      results.push({
        domain: domain.id,
        keywords: matchedKeywords,
        score: matchedKeywords.length / domain.keywords.length,
        affectedAreas: domain.affectedAreas,
        dependencies: domain.dependencies,
        sharedResources: domain.sharedResources,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

// ── Detect the primary/strongest domain ──────────────────────

export function detectPrimaryDomain(text: string): DetectedDomain | null {
  const results = detectDomains(text);
  return results[0] ?? null;
}

// ── Detect language from code content ────────────────────────

export function detectLanguage(content: string): string | undefined {
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
