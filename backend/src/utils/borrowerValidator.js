const { ValidationError } = require('./errors');
const { EMPLOYMENT_TYPES, RISK_PROFILES, LOAN_PURPOSES } = require('./constants');

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * Validates a borrower profile. Returns a clean, normalized object
 * (only known fields, trimmed/lowercased strings) or throws ValidationError
 * listing EVERY problem so the UI can show them all at once.
 */
function validateBorrowerProfile(input) {
  const p = input && typeof input === 'object' ? input : {};
  const problems = [];

  if (!isNum(p.loanAmount) || p.loanAmount <= 0) problems.push('loanAmount must be a number greater than 0');
  else if (p.loanAmount > 100000000) problems.push('loanAmount cannot exceed ₹10,00,00,000');

  const purpose = typeof p.loanPurpose === 'string' ? p.loanPurpose.trim().toLowerCase() : '';
  if (!LOAN_PURPOSES.includes(purpose)) problems.push(`loanPurpose must be one of: ${LOAN_PURPOSES.join(', ')}`);

  if (!isNum(p.monthlyIncome) || p.monthlyIncome <= 0) problems.push('monthlyIncome must be a number greater than 0');

  if (!isNum(p.existingEmi) || p.existingEmi < 0) problems.push('existingEmi must be a number, 0 or more');
  else if (isNum(p.monthlyIncome) && p.existingEmi > p.monthlyIncome) {
    problems.push('existingEmi cannot be greater than monthlyIncome');
  }

  if (!Number.isInteger(p.tenureMonths) || p.tenureMonths < 1 || p.tenureMonths > 360) {
    problems.push('tenureMonths must be a whole number between 1 and 360');
  }

  const employment = typeof p.employmentType === 'string' ? p.employmentType.trim().toLowerCase() : '';
  if (!EMPLOYMENT_TYPES.includes(employment)) problems.push(`employmentType must be one of: ${EMPLOYMENT_TYPES.join(', ')}`);

  // Optional: defaults to "medium" when omitted.
  let risk = 'medium';
  if (p.riskProfile !== undefined && p.riskProfile !== null && p.riskProfile !== '') {
    risk = typeof p.riskProfile === 'string' ? p.riskProfile.trim().toLowerCase() : '';
    if (!RISK_PROFILES.includes(risk)) problems.push(`riskProfile must be one of: ${RISK_PROFILES.join(', ')}`);
  }

  if (problems.length) throw new ValidationError('Invalid borrower profile', problems);

  return {
    loanAmount: p.loanAmount,
    loanPurpose: purpose,
    monthlyIncome: p.monthlyIncome,
    existingEmi: p.existingEmi,
    tenureMonths: p.tenureMonths,
    employmentType: employment,
    riskProfile: risk,
  };
}

module.exports = { validateBorrowerProfile };
