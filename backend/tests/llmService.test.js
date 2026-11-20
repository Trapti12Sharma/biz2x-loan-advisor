const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { askLLM, LlmError } = require('../src/services/llmService');

// A local fake of the company LLM wrapper. Behaviour is switched per test.
let mode = 'ok';
let lastRequest = null;
let server;

test.before(async () => {
  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      lastRequest = { auth: req.headers.authorization, body: JSON.parse(body || '{}') };
      const send = (status, obj) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
      if (mode === 'ok') return send(201, { response: '  Hello there  ', usage: {}, latency: 12 }); // verified real shape
      if (mode === '401') return send(401, { message: 'Invalid or expired API token', statusCode: 401 });
      if (mode === '429') return send(429, { message: 'slow down' });
      if (mode === '500') return send(500, { message: 'boom' });
      if (mode === 'bad-shape') return send(201, { unexpected: true });
      if (mode === 'empty') return send(201, { response: '   ' });
      if (mode === 'slow') return setTimeout(() => send(201, { response: 'late' }), 400);
      return send(500, {});
    });
  });
  await new Promise((r) => server.listen(0, r));
  process.env.LLM_API_URL = `http://localhost:${server.address().port}/llm/query`;
  process.env.LLM_API_TOKEN = 'SECRET-TOKEN-VALUE';
  process.env.LLM_TIMEOUT_MS = '100';
});
test.after(() => server.close());

const expectLlmError = async (status) => {
  await assert.rejects(() => askLLM('hi'), (err) => {
    assert.ok(err instanceof LlmError);
    assert.strictEqual(err.status, status);
    assert.ok(!err.message.includes('SECRET-TOKEN-VALUE'), 'token must never appear in an error message');
    return true;
  });
};

test('AI API successful response: parses `response`, trims it, sends Bearer token and {prompt}', async () => {
  mode = 'ok';
  const out = await askLLM('Explain personal loans');
  assert.strictEqual(out.text, 'Hello there');
  assert.strictEqual(out.latencyMs, 12);
  assert.strictEqual(lastRequest.auth, 'Bearer SECRET-TOKEN-VALUE');
  assert.deepStrictEqual(lastRequest.body, { prompt: 'Explain personal loans' });
});

test('AI API failure: 401 -> safe 502 message', async () => { mode = '401'; await expectLlmError(502); });
test('AI API failure: 429 -> 503', async () => { mode = '429'; await expectLlmError(503); });
test('AI API failure: 500 -> 502', async () => { mode = '500'; await expectLlmError(502); });
test('AI API failure: unexpected response shape -> 502', async () => { mode = 'bad-shape'; await expectLlmError(502); });
test('AI API failure: empty text -> 502', async () => { mode = 'empty'; await expectLlmError(502); });
test('AI API failure: timeout -> 504', async () => { mode = 'slow'; await expectLlmError(504); });

test('AI API failure: server not configured -> 503', async () => {
  const saved = process.env.LLM_API_TOKEN;
  delete process.env.LLM_API_TOKEN;
  await expectLlmError(503);
  process.env.LLM_API_TOKEN = saved;
});
