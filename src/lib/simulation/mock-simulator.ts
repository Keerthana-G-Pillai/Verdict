// ============================================================
// VERDICT — Mock Merge Simulator
// Runs the full simulation pipeline with deterministic,
// content-aware conflict detection.
// ============================================================

import { nanoid } from "@/lib/analysis/nanoid";
import { detectDomains } from "./domain-detector";
import {
  detectDomainOverlaps,
  detectConflicts,
  buildIntegrationChecks,
  computeIntegrationRisk,
  computeSimConfidence,
  deriveIntegrationVerdict,
} from "./semantic-conflict-engine";
import { generateIntegrationStrategy } from "./integration-strategy";
import type {
  Simulator,
  SimulationInput,
  SimulationResult,
  SimEvent,
  SimPipelineStage,
  SimPipelineStageId,
  SimPipelineStageStatus,
} from "./types";

// ── Pipeline stage definitions ────────────────────────────────

export const SIM_PIPELINE_STAGES: SimPipelineStage[] = [
  { id: "compare_changes",    label: "Compare Changes",       shortLabel: "Compare",    icon: "compare_arrows",  status: "waiting" },
  { id: "detect_overlap",     label: "Detect Overlap",        shortLabel: "Overlap",    icon: "hub",             status: "waiting" },
  { id: "analyze_semantics",  label: "Analyze Semantics",     shortLabel: "Semantics",  icon: "psychology",      status: "waiting" },
  { id: "simulate_integration",label:"Simulate Integration",  shortLabel: "Simulate",   icon: "science",         status: "waiting" },
  { id: "validate_coexistence",label:"Validate Coexistence",  shortLabel: "Validate",   icon: "verified_user",   status: "waiting" },
  { id: "integration_verdict", label: "Integration Verdict",  shortLabel: "Verdict",    icon: "gavel",           status: "waiting" },
];

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export const mockSimulator: Simulator = {
  async simulate(input: SimulationInput, onEvent, onStageUpdate) {
    const startMs = Date.now();
    const events: SimEvent[] = [];
    const stages = SIM_PIPELINE_STAGES.map((s) => ({ ...s }));

    function emit(
      stageId: SimPipelineStageId,
      message: string,
      type: SimEvent["type"] = "info",
      detail?: string
    ) {
      const event: SimEvent = {
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

    function setStage(stageId: SimPipelineStageId, status: SimPipelineStageStatus, summary?: string) {
      const s = stages.find((x) => x.id === stageId)!;
      s.status = status;
      if (status === "running") s.startedAt = Date.now();
      if (["complete", "warning", "failed"].includes(status)) {
        s.completedAt = Date.now();
        if (summary) s.summary = summary;
      }
      onStageUpdate(stageId, status, summary);
    }

    const textA = `${input.changeA.title} ${input.changeA.content} ${input.changeA.description ?? ""}`;
    const textB = `${input.changeB.title} ${input.changeB.content} ${input.changeB.description ?? ""}`;

    // ╔════════════════════════════════════╗
    // ║  STAGE 1 — COMPARE CHANGES         ║
    // ╚════════════════════════════════════╝
    setStage("compare_changes", "running");
    await sleep(500);
    emit("compare_changes", `Parsing Change A: "${input.changeA.title}"`);
    await sleep(350);
    emit("compare_changes", `Parsing Change B: "${input.changeB.title}"`);
    await sleep(350);
    emit("compare_changes", "Extracting change signatures");
    await sleep(400);

    const domainsA = detectDomains(textA);
    const domainsB = detectDomains(textB);

    const domainNamesA = domainsA.slice(0, 3).map((d) => d.domain.replace(/-/g, " "));
    const domainNamesB = domainsB.slice(0, 3).map((d) => d.domain.replace(/-/g, " "));

    emit("compare_changes", `Change A domain signature: ${domainNamesA.join(", ") || "general"}`);
    await sleep(300);
    emit("compare_changes", `Change B domain signature: ${domainNamesB.join(", ") || "general"}`);
    await sleep(300);
    setStage("compare_changes", "complete", `${domainsA.length} + ${domainsB.length} domain signals`);
    await sleep(200);

    // ╔════════════════════════════════════╗
    // ║  STAGE 2 — DETECT OVERLAP          ║
    // ╚════════════════════════════════════╝
    setStage("detect_overlap", "running");
    await sleep(400);
    emit("detect_overlap", "Scanning for shared dependencies");
    await sleep(400);
    emit("detect_overlap", "Checking overlapping system areas");
    await sleep(400);

    const overlaps = detectDomainOverlaps(domainsA, domainsB);

    if (overlaps.length === 0) {
      emit("detect_overlap", "No domain overlap detected between changes", "success");
      setStage("detect_overlap", "complete", "No shared domains");
    } else {
      for (const ov of overlaps) {
        emit(
          "detect_overlap",
          `Shared domain: ${ov.domain.replace(/-/g, " ")} — ${ov.sharedAreas.length} shared area${ov.sharedAreas.length !== 1 ? "s" : ""}`,
          "warning"
        );
        await sleep(250);
      }
      setStage("detect_overlap", "warning", `${overlaps.length} domain overlap${overlaps.length !== 1 ? "s" : ""}`);
    }
    await sleep(200);

    // ╔════════════════════════════════════╗
    // ║  STAGE 3 — ANALYZE SEMANTICS       ║
    // ╚════════════════════════════════════╝
    setStage("analyze_semantics", "running");
    await sleep(400);
    emit("analyze_semantics", "Comparing API contracts");
    await sleep(400);
    emit("analyze_semantics", "Inspecting shared state assumptions");
    await sleep(400);
    emit("analyze_semantics", "Checking behavioral compatibility");
    await sleep(400);

    const { direct, semantic } = detectConflicts(textA, textB, domainsA, domainsB);
    const allConflicts = [...direct, ...semantic];

    if (allConflicts.length === 0) {
      emit("analyze_semantics", "No semantic conflicts detected", "success");
      setStage("analyze_semantics", "complete", "No conflicts");
    } else {
      // Announce critical/high conflicts
      for (const c of allConflicts.filter((x) => x.severity === "critical" || x.severity === "high")) {
        emit(
          "analyze_semantics",
          `${c.severity.toUpperCase()}: ${c.title}`,
          c.severity === "critical" ? "error" : "warning"
        );
        await sleep(300);
      }
      const critCount = allConflicts.filter((x) => x.severity === "critical").length;
      setStage(
        "analyze_semantics",
        critCount > 0 ? "warning" : "complete",
        `${allConflicts.length} conflict${allConflicts.length !== 1 ? "s" : ""} found`
      );
    }
    await sleep(200);

    // ╔════════════════════════════════════╗
    // ║  STAGE 4 — SIMULATE INTEGRATION    ║
    // ╚════════════════════════════════════╝
    setStage("simulate_integration", "running");
    await sleep(400);
    emit("simulate_integration", "No execution environment connected — using semantic analysis", "info");
    await sleep(300);
    emit("simulate_integration", "Modeling combined change behavior");
    await sleep(500);
    emit("simulate_integration", "Projecting integration outcomes");
    await sleep(400);

    const integrationChecks = buildIntegrationChecks(allConflicts, domainsA, domainsB);
    const conflictChecks = integrationChecks.filter((c) => c.outcome === "conflict" || c.outcome === "warning");

    if (conflictChecks.length > 0) {
      emit("simulate_integration", `${conflictChecks.length} integration issue${conflictChecks.length !== 1 ? "s" : ""} projected`, "warning");
    } else {
      emit("simulate_integration", "Integration simulation complete — no issues projected", "success");
    }

    setStage(
      "simulate_integration",
      conflictChecks.length > 0 ? "warning" : "complete",
      "Static analysis · No execution environment"
    );
    await sleep(200);

    // ╔════════════════════════════════════╗
    // ║  STAGE 5 — VALIDATE COEXISTENCE    ║
    // ╚════════════════════════════════════╝
    setStage("validate_coexistence", "running");
    await sleep(400);
    emit("validate_coexistence", "Assessing independent function of each change");
    await sleep(400);
    emit("validate_coexistence", "Checking combined behavioral assumptions");
    await sleep(400);

    const riskScore = computeIntegrationRisk(allConflicts, overlaps);
    const confidence = computeSimConfidence(allConflicts, textA.length, textB.length);

    if (allConflicts.length === 0) {
      emit("validate_coexistence", "Both changes can coexist without behavioral conflicts", "success");
      setStage("validate_coexistence", "complete", "Coexistence validated");
    } else {
      emit("validate_coexistence", `Coexistence risk score: ${riskScore}/100`, riskScore >= 60 ? "error" : "warning");
      setStage("validate_coexistence", riskScore >= 60 ? "warning" : "complete", `Risk score: ${riskScore}`);
    }
    await sleep(200);

    // ╔════════════════════════════════════╗
    // ║  STAGE 6 — INTEGRATION VERDICT     ║
    // ╚════════════════════════════════════╝
    setStage("integration_verdict", "running");
    await sleep(400);
    emit("integration_verdict", "Aggregating conflict evidence");
    await sleep(300);
    emit("integration_verdict", "Deriving integration verdict");
    await sleep(400);

    const { verdict, rationale } = deriveIntegrationVerdict(riskScore, allConflicts);
    const integrationSteps = generateIntegrationStrategy(allConflicts, domainsA, domainsB, verdict);

    emit(
      "integration_verdict",
      `Verdict: ${verdict.replace(/_/g, " ").toUpperCase()}`,
      verdict === "safe_to_integrate" ? "success" : verdict === "conflict_detected" ? "error" : "warning"
    );

    setStage("integration_verdict", "complete", verdict.replace(/_/g, " ").toUpperCase());
    await sleep(200);

    const result: SimulationResult = {
      id: input.id,
      input,
      stages,
      events,
      domainsA: domainNamesA,
      domainsB: domainNamesB,
      domainOverlaps: overlaps,
      directConflicts: direct,
      semanticConflicts: semantic,
      integrationChecks,
      integrationSteps,
      integrationRiskScore: riskScore,
      confidence,
      conflictCount: allConflicts.length,
      criticalConflictCount: allConflicts.filter((c) => c.severity === "critical").length,
      verdict,
      verdictRationale: rationale,
      analyzedAt: new Date().toISOString(),
      executionMs: Date.now() - startMs,
    };

    return result;
  },
};
