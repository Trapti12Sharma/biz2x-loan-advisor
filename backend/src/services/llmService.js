const axios = require('axios');

// Safe error: .message is OK to show users; real details are only logged.
class LlmError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = 'LlmError';
    this.status = status;
  }
}

/**
 * Sends one prompt to the company LLM wrapper.
 * Verified response shape (HTTP 201): { response: "<text>", usage: {...}, latency: <ms> }
 * Returns { text, latencyMs }.
 */
async function askLLM(prompt) {
  const url = process.env.LLM_API_URL;
  const token = process.env.LLM_API_TOKEN;
  if (!url || !token) {
    console.error('[llm] LLM_API_URL or LLM_API_TOKEN is not configured');
    throw new LlmError('The AI assistant is not configured on the server.', 503);
  }

  let res;
  try {
    res = await axios.post(
      url,
      { prompt },
      {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        timeout: Number(process.env.LLM_TIMEOUT_MS) || 30000,
      }
    );
  } catch (err) {
    const status = err.response && err.response.status;
    // Log detail server-side only (never the token / headers).
    console.error(`[llm] request failed: code=${err.code} status=${status} msg=${err.message}`);
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') throw new LlmError('The AI assistant took too long to respond.', 504);
    if (status === 401 || status === 403) throw new LlmError('The AI assistant could not be reached due to a server configuration issue.', 502);
    if (status === 429) throw new LlmError('The AI assistant is busy. Please try again shortly.', 503);
    throw new LlmError('The AI assistant is temporarily unavailable.', 502);
  }

  const text = res.data && typeof res.data.response === 'string' ? res.data.response.trim() : '';
  if (!text) {
    console.error('[llm] unexpected response shape:', Object.keys(res.data || {}));
    throw new LlmError('The AI assistant returned an unreadable answer.', 502);
  }
  return { text, latencyMs: res.data.latency };
}

module.exports = { askLLM, LlmError };
