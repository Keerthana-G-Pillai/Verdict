// ============================================================
// VERDICT Demo Scenarios — Public index
// ============================================================

export { paymentRetryScenario } from "./code-change";
export { dbMigrationScenario } from "./code-diff";
export { jwtMigrationScenario } from "./pull-request";
export { redisCachingScenario } from "./engineering-decision";
export { jwtSessionSimulation, dbRenameSimulation } from "./simulation-scenarios";

export type { DemoScenario, DemoSimulationScenario } from "./types";

import { paymentRetryScenario } from "./code-change";
import { dbMigrationScenario } from "./code-diff";
import { jwtMigrationScenario } from "./pull-request";
import { redisCachingScenario } from "./engineering-decision";
import { jwtSessionSimulation, dbRenameSimulation } from "./simulation-scenarios";
import type { DemoScenario, DemoSimulationScenario } from "./types";
import type { ChangeType } from "@/lib/analysis/types";

export const DEMO_SCENARIOS: DemoScenario[] = [
  paymentRetryScenario,
  dbMigrationScenario,
  jwtMigrationScenario,
  redisCachingScenario,
];

export const DEMO_SIMULATION_SCENARIOS: DemoSimulationScenario[] = [
  jwtSessionSimulation,
  dbRenameSimulation,
];

export function getScenariosForType(changeType: ChangeType): DemoScenario[] {
  return DEMO_SCENARIOS.filter((s) => s.changeType === changeType);
}
