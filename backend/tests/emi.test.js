const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const { calculateEmi, compareTenures } = require('../src/services/emiService');

test('standard EMI: 5,00,000 @ 12% for 36 months', () => {
  const r = calculateEmi({ principal: 500000, annualRatePercent: 12, tenureMonths: 36 });
  assert.strictEqual(r.emi, 16607.15);
  assert.strictEqual(r.totalRepayment, 597857.4);
  assert.strictEqual(r.totalInterest, 97857.4);
});

test('zero-interest EMI splits principal evenly', () => {
  const r = calculateEmi({ principal: 10000, annualRatePercent: 0, tenureMonths: 10 });
  assert.strictEqual(r.emi, 1000);
  assert.strictEqual(r.totalInterest, 0);
  assert.strictEqual(r.totalRepayment, 10000);
});

test('longer tenure => lower EMI but higher total interest', () => {
  const { options, tradeoff } = compareTenures({ principal: 500000, annualRatePercent: 12, tenures: [60, 12, 36] });
  assert.deepStrictEqual(options.map((o) => o.tenureMonths), [12, 36, 60]);
  assert.ok(options[0].emi > options[1].emi && options[1].emi > options[2].emi);
  assert.ok(options[0].totalInterest < options[1].totalInterest && options[1].totalInterest < options[2].totalInterest);
  assert.match(tradeoff, /shorter tenure/i);
});

test('invalid inputs throw ValidationError', () => {
  const bad = [
    { principal: 0, annualRatePercent: 10, tenureMonths: 12 },
    { principal: -5, annualRatePercent: 10, tenureMonths: 12 },
    { principal: '500000', annualRatePercent: 10, tenureMonths: 12 },
    { principal: 1000, annualRatePercent: -1, tenureMonths: 12 },
    { principal: 1000, annualRatePercent: 10, tenureMonths: 0 },
    { principal: 1000, annualRatePercent: 10, tenureMonths: 12.5 },
    { principal: NaN, annualRatePercent: 10, tenureMonths: 12 },
  ];
  for (const input of bad) {
    assert.throws(() => calculateEmi(input), { name: 'ValidationError' }, JSON.stringify(input));
  }
});

test('POST /api/emi works and returns 400 with details on bad input', async () => {
  const server = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
  const url = `http://localhost:${server.address().port}/api/emi`;
  const post = (body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  const ok = await post({ principal: 500000, annualRatePercent: 12, tenureMonths: 36 });
  assert.strictEqual(ok.status, 200);
  assert.strictEqual((await ok.json()).emi, 16607.15);

  const bad = await post({ principal: 0 });
  const badBody = await bad.json();
  assert.strictEqual(bad.status, 400);
  assert.ok(Array.isArray(badBody.details) && badBody.details.length >= 1);
  server.close();
});
