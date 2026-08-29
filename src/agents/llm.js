/**
 * Thin wrapper around @ibm-cloud/watsonx-ai textChat.
 *
 * Configuration — set these environment variables:
 *   WATSONX_AI_AUTH_TYPE   e.g. "iam" (default) or "bearertoken"
 *   WATSONX_AI_APIKEY      your IBM Cloud IAM API key  (iam mode)
 *   WATSONX_AI_BEARER_TOKEN your bearer token          (bearertoken mode)
 *   WATSONX_AI_URL         service URL (default: https://us-south.ml.cloud.ibm.com)
 *   WATSONX_PROJECT_ID     your watsonx.ai project ID
 *   WATSONX_MODEL_ID       model to use (default: ibm/granite-3-3-8b-instruct)
 *
 * Returns the assistant message text as a string.
 */

const { WatsonXAI } = require('@ibm-cloud/watsonx-ai');

const SERVICE_URL =
  process.env.WATSONX_AI_URL || 'https://us-south.ml.cloud.ibm.com';
const MODEL_ID =
  process.env.WATSONX_MODEL_ID || 'ibm/granite-3-3-8b-instruct';
const PROJECT_ID = process.env.WATSONX_PROJECT_ID || null;

// Lazily instantiated so missing credentials surface at call-time, not import-time.
let _client = null;
function getClient() {
  if (!_client) {
    _client = new WatsonXAI({
      version: '2024-05-31',
      serviceUrl: SERVICE_URL,
    });
  }
  return _client;
}

/**
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} [opts]
 * @param {number} [opts.maxTokens]
 * @returns {Promise<string>}
 */
async function chat(messages, opts = {}) {
  const client = getClient();
  const params = {
    messages,
    modelId: MODEL_ID,
    maxTokens: opts.maxTokens ?? 1024,
  };
  if (PROJECT_ID) params.projectId = PROJECT_ID;

  const response = await client.textChat(params);
  const content = response?.result?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error(`Unexpected LLM response shape: ${JSON.stringify(response?.result)}`);
  }
  return content;
}

/**
 * Call the LLM and parse a JSON object from the response.
 * Strips markdown code fences if present.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} [opts]
 * @returns {Promise<object>}
 */
async function chatJSON(messages, opts = {}) {
  const raw = await chat(messages, opts);
  // Strip optional ```json ... ``` fences
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try {
    return JSON.parse(stripped);
  } catch (err) {
    throw new Error(`LLM returned non-JSON content: ${raw.slice(0, 300)}`);
  }
}

module.exports = { chat, chatJSON };
