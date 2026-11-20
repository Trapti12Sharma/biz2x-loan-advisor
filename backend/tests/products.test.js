const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const { getAllProducts, getProductById } = require('../src/services/productService');

test('catalog has 6 products, each with required fields', () => {
  const products = getAllProducts();
  assert.strictEqual(products.length, 6);
  for (const p of products) {
    for (const f of ['id', 'name', 'annualInterestRate', 'minMonthlyIncome', 'minAmount', 'maxAmount',
      'minTenureMonths', 'maxTenureMonths', 'allowedEmploymentTypes', 'allowedPurposes', 'maxObligationRatio']) {
      assert.ok(p[f] !== undefined, `${p.id} missing ${f}`);
    }
    assert.ok(p.minAmount < p.maxAmount && p.minTenureMonths <= p.maxTenureMonths);
  }
});

test('getProductById finds a product and returns undefined for unknown id', () => {
  assert.strictEqual(getProductById('PL-001').name, 'Personal Loan');
  assert.strictEqual(getProductById('NOPE'), undefined);
});

test('GET /api/products returns catalog with mock notice', async () => {
  const server = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
  const res = await fetch(`http://localhost:${server.address().port}/api/products`);
  const body = await res.json();
  server.close();
  assert.strictEqual(res.status, 200);
  assert.match(body.notice, /MOCK/);
  assert.strictEqual(body.products.length, 6);
});
