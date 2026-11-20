const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');

let server;
let base;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve); // port 0 = OS picks a free port
  });
  base = `http://localhost:${server.address().port}`;
});

test.after(() => server.close());

test('GET /api/health returns ok', async () => {
  const res = await fetch(`${base}/api/health`);
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.status, 'ok');
});

test('unknown route returns 404 JSON', async () => {
  const res = await fetch(`${base}/api/nope`);
  assert.strictEqual(res.status, 404);
  assert.strictEqual((await res.json()).error, 'Route not found');
});

test('malformed JSON returns 400, not a stack trace', async () => {
  const res = await fetch(`${base}/api/health`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{bad',
  });
  const body = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(body.error, 'Invalid JSON in request body');
});
