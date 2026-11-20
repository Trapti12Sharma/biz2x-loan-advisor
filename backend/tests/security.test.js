const test = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');

process.env.AUTH_SECRET = 'test-secret-for-unit-tests-only';

const app = require('../src/app');
const llm = require('../src/services/llmService');
const store = require('../src/services/userDataStore');
const rateLimit = require('../src/middleware/rateLimit');

const PROFILE = {
  loanAmount: 500000, loanPurpose: 'personal', monthlyIncome: 50000,
  existingEmi: 5000, tenureMonths: 36, employmentType: 'salaried',
};

let server;
let base;
let tokenA; // user-1
let tokenB; // user-2
const prompts = [];

const call = (path, { method = 'GET', token, body } = {}) =>
  fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });

test.before(async () => {
  // Fake LLM so these tests never call the real API.
  llm.askLLM = async (prompt) => { prompts.push(prompt); return { text: 'fake ai reply', latencyMs: 1 }; };
  server = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
  base = `http://localhost:${server.address().port}`;

  tokenA = (await (await call('/api/auth/login', { method: 'POST', body: { email: 'aarav@example.com', password: 'Demo@1234' } })).json()).token;
  tokenB = (await (await call('/api/auth/login', { method: 'POST', body: { email: 'diya@example.com', password: 'Demo@5678' } })).json()).token;
});
test.after(() => server.close());
test.beforeEach(() => { store._resetAll(); prompts.length = 0; });

test('login succeeds and never returns the password hash', async () => {
  const res = await call('/api/auth/login', { method: 'POST', body: { email: 'AARAV@example.com', password: 'Demo@1234' } });
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(body.token);
  assert.strictEqual(body.user.id, 'user-1');
  assert.ok(!JSON.stringify(body).includes('passwordHash'));
});

test('login fails with the SAME message for wrong password and unknown email', async () => {
  const wrongPw = await call('/api/auth/login', { method: 'POST', body: { email: 'aarav@example.com', password: 'nope' } });
  const noUser = await call('/api/auth/login', { method: 'POST', body: { email: 'ghost@example.com', password: 'nope' } });
  assert.strictEqual(wrongPw.status, 401);
  assert.strictEqual(noUser.status, 401);
  assert.strictEqual((await wrongPw.json()).error, (await noUser.json()).error);
});

test('protected routes reject missing, garbage, wrong-secret and expired tokens', async () => {
  for (const path of ['/api/profile', '/api/chat/history', '/api/auth/me']) {
    assert.strictEqual((await call(path)).status, 401, `${path} no token`);
    assert.strictEqual((await call(path, { token: 'garbage' })).status, 401, `${path} garbage`);
  }
  const forged = jwt.sign({ sub: 'user-1' }, 'attacker-secret');
  assert.strictEqual((await call('/api/profile', { token: forged })).status, 401);
  const expired = jwt.sign({ sub: 'user-1' }, process.env.AUTH_SECRET, { expiresIn: -10 });
  assert.strictEqual((await call('/api/profile', { token: expired })).status, 401);
  const ghost = jwt.sign({ sub: 'user-999' }, process.env.AUTH_SECRET);
  assert.strictEqual((await call('/api/profile', { token: ghost })).status, 401);
  assert.strictEqual((await call('/api/recommendations', { method: 'POST', body: PROFILE })).status, 401);
  assert.strictEqual((await call('/api/chat', { method: 'POST', body: { message: 'hi' } })).status, 401);
});

test('UNAUTHORIZED ACCESS: user B cannot read user A data (IDOR blocked)', async () => {
  await call('/api/recommendations', { method: 'POST', token: tokenA, body: PROFILE });

  // A can read own profile via both routes
  assert.strictEqual((await (await call('/api/profile', { token: tokenA })).json()).profile.loanAmount, 500000);
  assert.strictEqual((await call('/api/users/user-1/profile', { token: tokenA })).status, 200);

  // B asking for A's profile by id -> 403, and no data in the body
  const attack = await call('/api/users/user-1/profile', { token: tokenB });
  assert.strictEqual(attack.status, 403);
  assert.ok(!JSON.stringify(await attack.json()).includes('500000'));

  // B's own view is empty, not A's
  assert.strictEqual((await (await call('/api/profile', { token: tokenB })).json()).profile, null);
});

test('chat history is isolated per user', async () => {
  await call('/api/chat', { method: 'POST', token: tokenA, body: { message: 'secret question from A' } });
  const a = await (await call('/api/chat/history', { token: tokenA })).json();
  const b = await (await call('/api/chat/history', { token: tokenB })).json();
  assert.strictEqual(a.messages.length, 2);
  assert.strictEqual(a.messages[0].content, 'secret question from A');
  assert.strictEqual(b.messages.length, 0);

  // B clearing history does not touch A's
  await call('/api/chat/history', { method: 'DELETE', token: tokenB });
  assert.strictEqual((await (await call('/api/chat/history', { token: tokenA })).json()).messages.length, 2);
});

test('chat uses the server-stored profile; a client-sent profile/userId is ignored', async () => {
  await call('/api/recommendations', { method: 'POST', token: tokenA, body: PROFILE });
  // B has no stored profile but tries to smuggle A's id and a fake profile in the body.
  await call('/api/chat', { method: 'POST', token: tokenB, body: { message: 'hi', userId: 'user-1', profile: PROFILE } });
  assert.ok(prompts[0].includes('NOT AVAILABLE'), "B's prompt must not contain a profile");
  assert.ok(!prompts[0].includes('16726.81'));

  // A's chat does use A's stored profile.
  await call('/api/chat', { method: 'POST', token: tokenA, body: { message: 'hi' } });
  assert.ok(prompts[1].includes('16726.81'));
});

test('the LLM prompt contains no user identity (name/email/id)', async () => {
  await call('/api/recommendations', { method: 'POST', token: tokenA, body: PROFILE });
  await call('/api/chat', { method: 'POST', token: tokenA, body: { message: 'hi' } });
  for (const secret of ['Aarav', 'aarav@example.com', 'user-1']) assert.ok(!prompts[0].includes(secret), secret);
});

test('invalid chat message is rejected and not stored', async () => {
  const res = await call('/api/chat', { method: 'POST', token: tokenA, body: { message: '   ' } });
  assert.strictEqual(res.status, 400);
  assert.strictEqual((await (await call('/api/chat/history', { token: tokenA })).json()).messages.length, 0);
});

test('rate limiter returns 429 after the limit', async () => {
  const express = require('express');
  const mini = express();
  mini.get('/x', rateLimit({ windowMs: 60000, max: 2 }), (req, res) => res.json({ ok: true }));
  const s = await new Promise((r) => { const x = mini.listen(0, () => r(x)); });
  const url = `http://localhost:${s.address().port}/x`;
  const codes = [];
  for (let i = 0; i < 3; i++) codes.push((await fetch(url)).status);
  s.close();
  assert.deepStrictEqual(codes, [200, 200, 429]);
});

test('security headers are set and x-powered-by is hidden', async () => {
  const res = await call('/api/health');
  assert.strictEqual(res.headers.get('x-powered-by'), null);
  assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
  assert.strictEqual(res.headers.get('cache-control'), 'no-store');
});
