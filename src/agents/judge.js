/**
 * STUB — Judge agent.
 *
 * Stage 0: returns labeled placeholder data.
 * Stage 1: replace body with real IBM watsonx reasoning over all three inputs.
 *
 * @param {object} prosecutorOutput   — output of runProsecutor
 * @param {object} defenderOutput     — output of runDefender
 * @param {object} experimenterOutput — output of runExperimenter
 * @param {object} submittedChange    — { diff, description, file_context }
 * @returns {Promise<{ verdict: string, reasoning: string, conditions: string[]|null, safer_alternative: string|null }>}
 */
async function runJudge(prosecutorOutput, defenderOutput, experimenterOutput, submittedChange) {
  await delay(180);

  return {
    verdict: 'APPROVED_WITH_CONDITIONS',
    reasoning:
      '[STUB] The Experimenter confirms the change passes existing tests. ' +
      'The Defender presents credible mitigations for the Prosecutor\'s two risk claims. ' +
      'However, the deprecated crypto.createCipher finding warrants a follow-up before merging to main.',
    conditions: [
      '[STUB] Replace crypto.createCipher with crypto.createCipheriv before merging.',
      '[STUB] Add an explicit unit test covering the new async code path.',
    ],
    safer_alternative:
      '[STUB] Consider using the existing sanitise() utility already present in src/utils/sanitise.js instead of inline concatenation.',
  };
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

module.exports = { runJudge };
