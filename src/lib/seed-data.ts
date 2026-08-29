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

export const ACTIVITY_EVENTS: ActivityEvent[] = [
  {
    id: "1",
    message: "Analyzing authentication migration",
    timestamp: "Just now",
    meta: "Service: Auth",
    type: "analyzing",
  },
  {
    id: "2",
    message: "Mapping affected services",
    timestamp: "2m ago",
    meta: "Graph Analysis",
    type: "mapping",
  },
  {
    id: "3",
    message: "Merge simulation completed",
    timestamp: "5m ago",
    meta: "PR-4992",
    type: "completed",
  },
  {
    id: "4",
    message: "Change approved with conditions",
    timestamp: "12m ago",
    meta: "Policy Engine",
    type: "approved",
  },
  {
    id: "5",
    message: "Risk Intelligence flagged: auth token rotation",
    timestamp: "18m ago",
    meta: "Security",
    type: "analyzing",
  },
  {
    id: "6",
    message: "Simulation environment spun up",
    timestamp: "25m ago",
    meta: "Sandbox",
    type: "simulating",
  },
];

export const RECENT_ANALYSES: AnalysisRecord[] = [
  {
    id: "a1",
    name: "Update Redis Cache Strategy",
    type: "code",
    riskLevel: "low",
    status: "completed",
    timestamp: "2024-01-15T10:00:00Z",
    timeAgo: "10m ago",
  },
  {
    id: "a2",
    name: "Migrate User DB to PostgreSQL 15",
    type: "decision",
    riskLevel: "high",
    status: "analyzing",
    timestamp: "2024-01-15T09:00:00Z",
    timeAgo: "1h ago",
  },
  {
    id: "a3",
    name: "feat: Payment Gateway Webhooks",
    type: "pr",
    riskLevel: "medium",
    status: "completed",
    timestamp: "2024-01-15T07:00:00Z",
    timeAgo: "3h ago",
  },
  {
    id: "a4",
    name: "fix: Memory leak in worker nodes",
    type: "code",
    riskLevel: "high",
    status: "failed",
    timestamp: "2024-01-15T05:00:00Z",
    timeAgo: "5h ago",
  },
  {
    id: "a5",
    name: "refactor: Split monolith auth service",
    type: "decision",
    riskLevel: "critical",
    status: "analyzing",
    timestamp: "2024-01-15T04:00:00Z",
    timeAgo: "6h ago",
  },
  {
    id: "a6",
    name: "feat: Add rate limiting middleware",
    type: "code",
    riskLevel: "low",
    status: "completed",
    timestamp: "2024-01-15T03:00:00Z",
    timeAgo: "7h ago",
  },
];
