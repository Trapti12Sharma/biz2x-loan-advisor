// Frontend validation = fast feedback only. The backend re-validates everything.
// Form values are strings; this converts them to numbers for the API.
export function validateProfile(form) {
  const errors = {}

  const loanAmount = Number(form.loanAmount)
  if (form.loanAmount === '' || !Number.isFinite(loanAmount) || loanAmount <= 0) errors.loanAmount = 'Enter a loan amount greater than 0'

  const monthlyIncome = Number(form.monthlyIncome)
  if (form.monthlyIncome === '' || !Number.isFinite(monthlyIncome) || monthlyIncome <= 0) errors.monthlyIncome = 'Enter a monthly income greater than 0'

  const existingEmi = Number(form.existingEmi === '' ? 0 : form.existingEmi)
  if (!Number.isFinite(existingEmi) || existingEmi < 0) errors.existingEmi = 'Enter 0 or a positive amount'
  else if (!errors.monthlyIncome && existingEmi > monthlyIncome) errors.existingEmi = 'Existing EMI cannot exceed monthly income'

  const tenureMonths = Number(form.tenureMonths)
  if (form.tenureMonths === '' || !Number.isInteger(tenureMonths) || tenureMonths < 1 || tenureMonths > 360) {
    errors.tenureMonths = 'Enter whole months between 1 and 360'
  }

  if (!form.loanPurpose) errors.loanPurpose = 'Select a purpose'
  if (!form.employmentType) errors.employmentType = 'Select an employment type'

  const profile = {
    loanAmount,
    loanPurpose: form.loanPurpose,
    monthlyIncome,
    existingEmi,
    tenureMonths,
    employmentType: form.employmentType,
    riskProfile: form.riskProfile || 'medium',
  }
  return { errors, profile, valid: Object.keys(errors).length === 0 }
}
