// ============================================================
// Demo Scenario — Engineering Decision: Redis Caching
// Realistic architecture decision with constraints and trade-offs.
// ============================================================

import type { DemoScenario } from "./types";

export const redisCachingScenario: DemoScenario = {
  id: "redis-caching",
  changeType: "decision",
  title: "Introduce Redis Caching for Product Catalog",
  description: "Architecture decision to add Redis caching for frequently requested product catalog data under read-heavy load.",
  previewBullets: [
    "Cache invalidation strategy and stale data risk",
    "Cache stampede / thundering herd under cold starts",
    "Operational complexity and failure modes",
    "Consistency guarantees vs. performance trade-offs",
    "Sizing and eviction policy appropriateness",
  ],
  inputTitle: "Should we introduce Redis caching for product catalog reads?",
  additionalContext:
    "This decision needs to be made before the Q3 infrastructure planning deadline. The catalog service team has proposed this as the primary scaling solution before the seasonal traffic peak.",
  content: `## Engineering Decision: Redis Caching for Product Catalog

### Context

The product catalog service handles reads for approximately 2.4 million SKUs. Over the past 90 days, catalog read traffic has grown 340% following international expansion. Current architecture routes all catalog reads directly to a PostgreSQL primary with one read replica.

**Current metrics:**
- Catalog read P50: 18ms, P99: 340ms
- Database CPU at peak: 78% on the read replica
- Cache hit potential (estimated from query patterns): ~85% of reads are for the same top 12,000 SKUs
- Catalog update frequency: most SKUs updated < once per hour; flash-sale pricing updated every 5 minutes

**The problem:**
At current growth trajectory, the read replica will saturate within 6 weeks. Vertical scaling is possible but expensive. A second read replica adds operational complexity without addressing query inefficiency (many requests hit the same rows repeatedly).

### Proposed approach

Introduce Redis 7.x as a read-through cache in front of the PostgreSQL read replica.

**Proposed architecture:**
- Cache layer: Redis Cluster, 3 nodes, 16GB each
- Key structure: \`catalog:sku:{sku_id}:v{schema_version}\`
- TTL: 300 seconds (5 minutes) for pricing fields; 3600 seconds for non-pricing fields
- Invalidation: event-driven via internal catalog-update Kafka topic
- Write-through: on catalog updates, write to PostgreSQL then delete (not set) the cache key
- Cache miss path: read replica → populate cache → return

**Services affected:**
- catalog-service (owner of this change)
- search-service (reads catalog data directly via internal RPC — would need to route through catalog-service)
- recommendations-service (batch catalog reads — likely bypass cache for bulk operations)
- storefront-api (primary consumer — expects consistent pricing data)

### Constraints

- SLA: storefront pricing must not serve data older than 10 minutes during normal operation
- Zero-downtime: cache introduction must not require a maintenance window
- Budget: approved for Redis cluster compute; no budget for a managed service upgrade this quarter
- Team: catalog team has limited Redis operational experience; no existing Redis runbooks

### Trade-offs being considered

**For:**
- Eliminates 85% of database reads immediately at current traffic levels
- P99 latency improvement estimated at 18-340ms → 2-8ms for cache hits
- Provides headroom for traffic spikes without immediate infrastructure changes

**Against:**
- Cache invalidation on flash-sale pricing (5-minute cadence) requires correct ordering of DB write + cache delete; failure to invalidate could serve stale prices
- Cold start after Redis failover exposes full traffic to the database until the cache warms (potentially 10-15 minutes of degraded DB performance)
- search-service coupling: forcing search to route through catalog-service for caching benefits introduces a new synchronous dependency
- The team has no Redis operational runbooks; incident response for a cache failure is untested
- TTL mismatch between pricing (5min) and non-pricing fields (1hr) requires either composite keys or separate cache namespaces — complexity that could be misimplemented

### Question for VERDICT

Given the operational constraints, team experience level, and SLA requirements, is introducing Redis caching at this layer the right decision now? Are there architectural risks in the proposed design that should be resolved before implementation, or should an alternative scaling approach be considered first?
`,
};
