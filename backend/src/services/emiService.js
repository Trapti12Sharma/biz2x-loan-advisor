const { ValidationError } = require('../utils/errors');

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// Strict check: must be a real finite number (strings like "5000" are rejected).
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

function validateInputs(principal, annualRatePercent, tenureMonths) {
  const problems = [];
  if (!isNum(principal) || principal <= 0) problems.push('principal must be a number greater than 0');
  if (!isNum(annualRatePercent) || annualRatePercent < 0 || annualRatePercent > 100) {
    problems.push('annualRatePercent must be a number between 0 and 100');
  }
  if (!Number.isInteger(tenureMonths) || tenureMonths < 1 || tenureMonths > 600) {
    problems.push('tenureMonths must be a whole number between 1 and 600');
  }
  if (problems.length) throw new ValidationError('Invalid EMI input', problems);
}

/**
 * Reducing-balance EMI.
 * EMI = P * r * (1+r)^n / ((1+r)^n - 1), r = annualRate / 12 / 100
 * Returns { emi, totalInterest, totalRepayment, monthlyRate, tenureMonths, principal, annualRatePercent }
 */
function calculateEmi({ principal, annualRatePercent, tenureMonths }) {
  validateInputs(principal, annualRatePercent, tenureMonths);

  const r = annualRatePercent / 12 / 100;
  let rawEmi;
  if (r === 0) {
    // Zero interest: formula would divide by zero, so split principal evenly.
    rawEmi = principal / tenureMonths;
  } else {
    const growth = Math.pow(1 + r, tenureMonths);
    rawEmi = (principal * r * growth) / (growth - 1);
  }

  const emi = round2(rawEmi);
  const totalRepayment = round2(emi * tenureMonths);
  const totalInterest = round2(totalRepayment - principal);

  return { principal, annualRatePercent, tenureMonths, monthlyRate: r, emi, totalInterest, totalRepayment };
}

/**
 * Same loan over several tenures + a plain-language trade-off built from the numbers.
 */
function compareTenures({ principal, annualRatePercent, tenures }) {
  if (!Array.isArray(tenures) || tenures.length < 2 || tenures.length > 10) {
    throw new ValidationError('Invalid tenure comparison input', ['tenures must be an array of 2 to 10 whole numbers']);
  }
  const options = tenures
    .map((tenureMonths) => calculateEmi({ principal, annualRatePercent, tenureMonths }))
    .sort((a, b) => a.tenureMonths - b.tenureMonths);

  const shortest = options[0];
  const longest = options[options.length - 1];
  let tradeoff;
  if (shortest.tenureMonths === longest.tenureMonths) {
    tradeoff = 'All tenures are equal, so there is no trade-off to show.';
  } else {
    const emiDiff = round2(shortest.emi - longest.emi);
    const interestDiff = round2(longest.totalInterest - shortest.totalInterest);
    tradeoff =
      `A shorter tenure (${shortest.tenureMonths} months) has a higher monthly EMI (₹${shortest.emi}), ` +
      `about ₹${emiDiff} more per month than ${longest.tenureMonths} months (₹${longest.emi}). ` +
      (interestDiff > 0
        ? `A longer tenure lowers the monthly burden but costs about ₹${interestDiff} more in total interest.`
        : 'With 0% interest, tenure does not change the total cost; it only changes the monthly amount.');
  }
  return { options, tradeoff };
}

module.exports = { calculateEmi, compareTenures };
