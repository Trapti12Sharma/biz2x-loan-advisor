const { getAllProducts, NOTICE } = require('./productService');
const { calculateEmi } = require('./emiService');
const { validateBorrowerProfile } = require('../utils/borrowerValidator');
const { DISCLAIMER } = require('../utils/constants');
const { inr } = require('../utils/format');

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/**
 * Runs every mock eligibility rule for ONE product.
 * Returns status, the evaluated EMI figures, and a pass/fail reason per rule.
 */
function evaluateProduct(product, profile) {
  const reasons = [];
  const check = (name, passed, message) => reasons.push({ check: name, passed, message });

  // 1. Employment type
  check(
    'employment',
    product.allowedEmploymentTypes.includes(profile.employmentType),
    product.allowedEmploymentTypes.includes(profile.employmentType)
      ? `Open to ${profile.employmentType} applicants.`
      : `Only for ${product.allowedEmploymentTypes.join(' / ')} applicants; you selected ${profile.employmentType}.`
  );

  // 2. Purpose
  const purposeOk = product.allowedPurposes.includes(profile.loanPurpose);
  check(
    'purpose',
    purposeOk,
    purposeOk
      ? `Supports the purpose "${profile.loanPurpose}".`
      : `Not meant for "${profile.loanPurpose}"; supports: ${product.allowedPurposes.join(', ')}.`
  );

  // 3. Minimum income
  const incomeOk = profile.monthlyIncome >= product.minMonthlyIncome;
  check(
    'income',
    incomeOk,
    incomeOk
      ? `Income ${inr(profile.monthlyIncome)} meets the minimum of ${inr(product.minMonthlyIncome)}.`
      : `Income ${inr(profile.monthlyIncome)} is below the minimum of ${inr(product.minMonthlyIncome)}.`
  );

  // 4. Amount range
  const amountOk = profile.loanAmount >= product.minAmount && profile.loanAmount <= product.maxAmount;
  check(
    'amount',
    amountOk,
    amountOk
      ? `${inr(profile.loanAmount)} is within ${inr(product.minAmount)} - ${inr(product.maxAmount)}.`
      : `${inr(profile.loanAmount)} is outside this product's range of ${inr(product.minAmount)} - ${inr(product.maxAmount)}.`
  );

  // 5. Tenure: if outside the product's range, evaluate at the nearest allowed tenure.
  const tenureUsed = clamp(profile.tenureMonths, product.minTenureMonths, product.maxTenureMonths);
  const tenureAdjusted = tenureUsed !== profile.tenureMonths;
  check(
    'tenure',
    true,
    tenureAdjusted
      ? `You asked for ${profile.tenureMonths} months, but this product allows ${product.minTenureMonths}-${product.maxTenureMonths}; figures below use ${tenureUsed} months.`
      : `${tenureUsed} months is within the allowed ${product.minTenureMonths}-${product.maxTenureMonths} months.`
  );

  // EMI figures come from the JS calculator (never from the AI).
  const calc = calculateEmi({
    principal: profile.loanAmount,
    annualRatePercent: product.annualInterestRate,
    tenureMonths: tenureUsed,
  });

  // 6. Affordability: (existing EMI + new EMI) must stay within income * maxObligationRatio.
  const capacity = round2(profile.monthlyIncome * product.maxObligationRatio - profile.existingEmi);
  const obligationAfter = round2(profile.existingEmi + calc.emi);
  const obligationRatioAfter = round2(obligationAfter / profile.monthlyIncome);
  const affordable = capacity > 0 && calc.emi <= capacity;
  let affordMsg;
  if (affordable) {
    affordMsg = `New EMI ${inr(calc.emi)} fits within your spare capacity of ${inr(capacity)} (total obligations would be ${Math.round(obligationRatioAfter * 100)}% of income; limit ${Math.round(product.maxObligationRatio * 100)}%).`;
  } else if (capacity <= 0) {
    affordMsg = `Your existing EMI already uses up the ${Math.round(product.maxObligationRatio * 100)}% obligation limit, leaving no room for a new EMI.`;
  } else {
    affordMsg = `New EMI ${inr(calc.emi)} exceeds your spare capacity of ${inr(capacity)} (limit is ${Math.round(product.maxObligationRatio * 100)}% of income including existing EMI).`;
    for (let t = tenureUsed + 1; t <= product.maxTenureMonths; t++) {
      const alt = calculateEmi({ principal: profile.loanAmount, annualRatePercent: product.annualInterestRate, tenureMonths: t });
      if (alt.emi <= capacity) {
        affordMsg += ` A longer tenure of ${t} months would bring the EMI to ${inr(alt.emi)}, which fits.`;
        break;
      }
    }
  }
  check('affordability', affordable, affordMsg);

  const allPassed = reasons.every((r) => r.passed);
  const status = !allPassed ? 'not_eligible' : product.conditional ? 'conditional' : 'eligible';

  return {
    productId: product.id,
    name: product.name,
    annualInterestRate: product.annualInterestRate,
    status,
    evaluatedTenureMonths: tenureUsed,
    emi: calc.emi,
    totalInterest: calc.totalInterest,
    totalRepayment: calc.totalRepayment,
    totalMonthlyObligation: obligationAfter,
    obligationRatioAfter,
    reasons,
    notes: status === 'conditional' ? product.requirements : [],
  };
}

const STATUS_ORDER = { eligible: 0, conditional: 1, not_eligible: 2 };

/**
 * Main entry: validates the profile, evaluates every product, ranks them.
 * Ranking inside the same status: lowest total interest first; for a "low"
 * risk profile, lowest monthly obligation first.
 */
function recommend(rawProfile) {
  const profile = validateBorrowerProfile(rawProfile);
  const results = getAllProducts().map((p) => evaluateProduct(p, profile));

  const sortKey = profile.riskProfile === 'low' ? 'totalMonthlyObligation' : 'totalInterest';
  results.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a[sortKey] - b[sortKey]);

  const best = results.find((r) => r.status === 'eligible');
  return {
    disclaimer: DISCLAIMER,
    dataNotice: NOTICE,
    profile,
    bestMatchProductId: best ? best.productId : null,
    recommendations: results,
  };
}

module.exports = { recommend, evaluateProduct };
