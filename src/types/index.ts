// Verdict shared types — used across all features

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ChangeType = "code" | "diff" | "pr" | "decision" | "config" | "migration" | "merge";
export type AnalysisStatus = "pending" | "analyzing" | "completed" | "failed";
export type VerdictOutcome = "approved" | "approved_with_conditions" | "requires_revision" | "rejected";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  active?: boolean;
}

export interface MetricCard {
  label: string;
  value: string | number;
  icon: string;
  trend?: {
    label: string;
    direction: "up" | "down" | "neutral";
  };
  accentColor?: "primary" | "error" | "secondary" | "tertiary";
}

export interface ActivityEvent {
  id: string;
  message: string;
  timestamp: string;
  meta?: string;
  type: "analyzing" | "mapping" | "completed" | "approved" | "failed" | "simulating";
}

export interface AnalysisRecord {
  id: string;
  name: string;
  type: ChangeType;
  riskLevel: RiskLevel;
  status: AnalysisStatus;
  verdict?: VerdictOutcome;
  timestamp: string;
  timeAgo: string;
}

export interface PipelineStage {
  id: string;
  label: string;
  icon: string;
  color?: "primary" | "secondary" | "tertiary" | "default";
  status?: "pending" | "active" | "completed";
}
