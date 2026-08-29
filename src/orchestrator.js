/**
 * Orchestrator — runs the full 4-agent trial pipeline.
 *
 * Execution order:
 *   1. Prosecutor + Defender run in PARALLEL with independent contexts
 *   2. Experimenter runs (could use sandbox results from step 1 in Stage 1)
 *   3. Judge receives all three outputs + original change → issues verdict
 *   4. Trial record saved and returned
 */

const { runProsecutor } = require('./agents/prosecutor');
const { runDefender } = require('./agents/defender');
const { runExperimenter } = require('./agents/experimenter');
const { runJudge } = require('./agents/judge');
const { createTrial, updateTrial } = require('./models/trial');

async function runTrial(submittedChange) {
  // Create trial record immediately — status: PENDING
  const trial = createTrial(submittedChange);

  try {
    updateTrial(trial.id, { status: 'RUNNING' });

    // ── Step 1: Prosecutor & Defender in parallel, independent contexts ──────
    const [prosecutorOutput, defenderOutput] = await Promise.all([
      runProsecutor(submittedChange),
      runDefender(submittedChange),
    ]);

    updateTrial(trial.id, { prosecutor_output: prosecutorOutput, defender_output: defenderOutput });

    // ── Step 2: Experimenter ─────────────────────────────────────────────────
    const experimenterOutput = await runExperimenter(submittedChange);
    updateTrial(trial.id, { experimenter_output: experimenterOutput });

    // ── Step 3: Judge weighs all three outputs ───────────────────────────────
    const judgeVerdict = await runJudge(
      prosecutorOutput,
      defenderOutput,
      experimenterOutput,
      submittedChange
    );

    // ── Step 4: Finalize ─────────────────────────────────────────────────────
    const finalTrial = updateTrial(trial.id, {
      judge_verdict: judgeVerdict,
      status: 'COMPLETE',
    });

    return finalTrial;
  } catch (err) {
    updateTrial(trial.id, { status: 'ERROR' });
    throw err;
  }
}

module.exports = { runTrial };
