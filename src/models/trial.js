/**
 * Trial data model + in-memory store.
 *
 * Fields:
 *   id                  — uuid
 *   submitted_change    — { diff, description, file_context }
 *   prosecutor_output   — { risks: [{ claim, severity, justification }] }
 *   defender_output     — { evidence: [{ claim, justification }] }
 *   experimenter_output — { executed, result, details, unexpected_findings }
 *   judge_verdict       — { verdict, reasoning, conditions, safer_alternative }
 *   status              — "PENDING" | "RUNNING" | "COMPLETE" | "ERROR"
 *   timestamp           — ISO string
 */

const { v4: uuidv4 } = require('uuid');

// In-memory store — sufficient for Stage 0
const trials = new Map();

function createTrial(submittedChange) {
  const trial = {
    id: uuidv4(),
    submitted_change: {
      diff: submittedChange.diff,
      description: submittedChange.description,
      file_context: submittedChange.file_context || null,
    },
    prosecutor_output: null,
    defender_output: null,
    experimenter_output: null,
    judge_verdict: null,
    status: 'PENDING',
    timestamp: new Date().toISOString(),
  };
  trials.set(trial.id, trial);
  return trial;
}

function updateTrial(id, patch) {
  const trial = trials.get(id);
  if (!trial) throw new Error(`Trial not found: ${id}`);
  Object.assign(trial, patch);
  return trial;
}

function getTrial(id) {
  return trials.get(id) || null;
}

function getAllTrials() {
  return Array.from(trials.values()).sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
}

module.exports = { createTrial, updateTrial, getTrial, getAllTrials };
