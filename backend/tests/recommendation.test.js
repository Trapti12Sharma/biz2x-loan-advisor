const test = require('node:test');
const assert = require('node:assert');
const { validateBorrowerProfile } = require('../src/utils/borrowerValidator');
const { recommend } = require('../src/services/recommendationService');

const valid = {
  loanAmount: 500000, loanPurpose: 'personal', monthlyIncome: 50000,
  existingEmi: 5000, tenureMonths: 36, employmentType: 'salaried', riskProfile: 'medium',
};
const byId = (res, id) => res.recommendations.find((r) => r.productId === id);

test('valid borrower information passes and is normalized', () => {
  const p = validateBorrowerProfile({ ...valid, employmentType: ' Salaried ' });
  assert.strictEqual(p.employmentType, 'salaried');
  assert.strictEqual(p.riskProfile, 'medium');
});

test('invalid loan amount is rejected', () => {
  for (const amt of [0, -100, '500000', NaN, undefined]) {
    assert.throws(() => validateBorrowerProfile({ ...valid, loanAmount: amt }), { name: 'ValidationError' });
  }
});

test('zero monthly income is rejected', () => {
  assert.throws(() => validateBorrowerProfile({ ...valid, monthlyIncome: 0 }), (e) =>
    e.name === 'ValidationError' && e.details.some((d) => d.includes('monthlyIncome')));
});

test('existing EMI greater than income is rejected', () => {
  assert.throws(() => validateBorrowerProfile({ ...valid, existingEmi: 60000 }), (e) =>
    e.details.some((d) => d.includes('existingEmi cannot be greater')));
});

test('missing borrower information lists every missing field', () => {
  assert.throws(() => validateBorrowerProfile({}), (e) => e.details.length >= 5);
  assert.throws(() => validateBorrowerProfile(null), { name: 'ValidationError' });
});

test('eligible recommendation: ₹50k income, ₹5L, 36 months -> Personal Loan eligible', () => {
  const res = recommend(valid);
  const pl = byId(res, 'PL-001');
  assert.strictEqual(pl.status, 'eligible');
  assert.strictEqual(pl.emi, 16726.81); // 12.5% mock rate
  assert.strictEqual(res.bestMatchProductId, 'PL-001');
  assert.ok(res.disclaimer.includes('indicative and subject to final lender approval'));
});

test('ineligible recommendations carry clear reasons', () => {
  const res = recommend(valid);
  const sme = byId(res, 'SME-001'); // salaried + personal purpose
  assert.strictEqual(sme.status, 'not_eligible');
  assert.ok(sme.reasons.some((r) => r.check === 'employment' && !r.passed));
  const sa = byId(res, 'SA-001'); // amount above 50k max
  assert.ok(sa.reasons.some((r) => r.check === 'amount' && !r.passed));
});

test('low income makes Personal Loan ineligible', () => {
  const res = recommend({ ...valid, monthlyIncome: 20000, existingEmi: 0 });
  assert.strictEqual(byId(res, 'PL-001').status, 'not_eligible');
});

test('unaffordable EMI suggests a longer tenure', () => {
  const res = recommend({ ...valid, monthlyIncome: 35000, existingEmi: 5000, tenureMonths: 24 });
  const pl = byId(res, 'PL-001');
  assert.strictEqual(pl.status, 'not_eligible');
  const afford = pl.reasons.find((r) => r.check === 'affordability');
  assert.match(afford.message, /longer tenure of \d+ months/);
});

test('zero-interest BNPL is evaluated without errors', () => {
  const res = recommend({ ...valid, loanAmount: 10000, loanPurpose: 'shopping', tenureMonths: 5 });
  const b = byId(res, 'BNPL-001');
  assert.strictEqual(b.status, 'eligible');
  assert.strictEqual(b.emi, 2000);
  assert.strictEqual(b.totalInterest, 0);
});

test('secured loan is conditional, never plain eligible', () => {
  const res = recommend({ ...valid, loanAmount: 800000, tenureMonths: 60 });
  const s = byId(res, 'SEC-001');
  assert.strictEqual(s.status, 'conditional');
  assert.ok(s.notes.length > 0);
});

test('different tenures give different EMIs for the same product', () => {
  const a = byId(recommend({ ...valid, tenureMonths: 24 }), 'PL-001');
  const b = byId(recommend({ ...valid, tenureMonths: 48 }), 'PL-001');
  assert.ok(a.emi > b.emi && a.totalInterest < b.totalInterest);
});
