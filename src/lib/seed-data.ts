import type { ActivityEvent, AnalysisRecord, MetricCard } from "@/types";

export const DASHBOARD_METRICS: MetricCard[] = [
  {
    label: "Active Analyses",
    value: "12",
    icon: "donut_large",
    accentColor: "primary",
    trend: {
      label: "3 since yesterday",
      direction: "up",
    },
  },
  {
    label: "Requires Attention",
    value: "4",
    icon: "warning",
    accentColor: "error",
    trend: {
      label: "Critical architectural risks detected",
      direction: "neutral",
    },
  },
  {
    label: "Validation Success Rate",
    value: "94.2%",
    icon: "verified",
    accentColor: "secondary",
  },
];

// PRESENTATION MODE ONLY — never shown in normal product flow
export const PRESENTATION_ACTIVITY_EVENTS: ActivityEvent[] = [
  {
    id: "p1",
    message: "JWT → session token migration analyzed",
    timestamp: "Just now",
    meta: "Security",
    type: "analyzing",
  },
  {
    id: "p2",
    message: "Payment retry idempotency validated",
    timestamp: "4m ago",
    meta: "Payments",
    type: "approved",
  },
  {
    id: "p3",
    message: "Semantic merge conflict detected",
    timestamp: "9m ago",
    meta: "Merge Sim",
    type: "simulating",
  },
  {
    id: "p4",
    message: "Risk Intelligence: session fixation risk flagged",
    timestamp: "15m ago",
    meta: "Auth",
    type: "analyzing",
  },
  {
    id: "p5",
    message: "Safety Validation: idempotency key confirmed",
    timestamp: "21m ago",
    meta: "Payments",
    type: "approved",
  },
  {
    id: "p6",
    message: "Semantic conflict: retry logic race condition",
    timestamp: "28m ago",
    meta: "Concurrency",
    type: "simulating",
  },
];

// PRESENTATION MODE ONLY — never shown in normal product flow
export const PRESENTATION_RECENT_ANALYSES: AnalysisRecord[] = [
  {
    id: "p-a1",
    name: "JWT → Session Token Migration",
    type: "code",
    riskLevel: "high",
    status: "analyzing",
    timestamp: "2024-01-15T10:00:00Z",
    timeAgo: "Just now",
  },
  {
    id: "p-a2",
    name: "Payment Retry Idempotency",
    type: "code",
    riskLevel: "medium",
    status: "completed",
    timestamp: "2024-01-15T09:00:00Z",
    timeAgo: "4m ago",
  },
  {
    id: "p-a3",
    name: "Rate Limit ↔ Retry Logic Merge",
    type: "diff",
    riskLevel: "critical",
    status: "failed",
    timestamp: "2024-01-15T07:00:00Z",
    timeAgo: "9m ago",
  },
];
