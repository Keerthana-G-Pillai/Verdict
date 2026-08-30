// ============================================================
// VERDICT Demo Mode — Scenario Type Definitions
// Scenarios supply INPUTS ONLY. Results are always generated
// live by the real VERDICT pipeline.
// ============================================================

import type { ChangeType } from "@/lib/analysis/types";

export interface DemoScenario {
  id: string;
  changeType: ChangeType;
  title: string;
  description: string;          // One-line description shown in selector
  previewBullets: string[];     // What VERDICT will investigate (not verdict)
  // Form fields that get prefilled:
  inputTitle: string;
  content: string;
  language?: string;
  projectContext?: string;
  fileContext?: string;
  additionalContext?: string;
}

export interface DemoSimulationScenario {
  id: string;
  title: string;
  description: string;
  changeA: { title: string; changeType: ChangeType; content: string; description?: string };
  changeB: { title: string; changeType: ChangeType; content: string; description?: string };
}
