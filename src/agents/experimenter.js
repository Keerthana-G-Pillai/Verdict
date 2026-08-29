/**
 * STUB — Experimenter agent.
 *
 * Stage 0: returns labeled placeholder data.
 * Stage 1: replace body with real sandboxed execution + Bob agent analysis.
 *
 * @param {object} submittedChange  — { diff, description, file_context }
 * @returns {Promise<{ executed: boolean, result: string, details: string, unexpected_findings: string|null }>}
 */
async function runExperimenter(submittedChange) {
  await delay(200);

  return {
    executed: true,
    result: 'PASS',
    details:
      '[STUB] Applied diff to isolated sandbox environment. All 42 existing unit tests passed. ' +
      'No runtime exceptions detected during a 30-second smoke run. ' +
      'Memory and CPU usage within normal bounds.',
    unexpected_findings:
      '[STUB] One deprecated API call detected (crypto.createCipher); not blocking but flagged for Stage 1 review.',
  };
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

module.exports = { runExperimenter };
