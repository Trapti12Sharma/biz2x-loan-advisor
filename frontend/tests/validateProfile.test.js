import test from 'node:test'
import assert from 'node:assert'
import { validateProfile } from '../src/utils/validateProfile.js'

const good = {
  loanAmount: '500000', loanPurpose: 'personal', monthlyIncome: '50000',
  existingEmi: '5000', tenureMonths: '36', employmentType: 'salaried', riskProfile: 'medium',
}

test('valid form converts strings to numbers', () => {
  const r = validateProfile(good)
  assert.ok(r.valid)
  assert.strictEqual(r.profile.loanAmount, 500000)
  assert.strictEqual(typeof r.profile.monthlyIncome, 'number')
})

test('blank existing EMI defaults to 0', () => {
  assert.strictEqual(validateProfile({ ...good, existingEmi: '' }).profile.existingEmi, 0)
})

test('invalid loan amount, zero income, EMI > income, bad tenure, missing selects', () => {
  assert.ok(validateProfile({ ...good, loanAmount: '0' }).errors.loanAmount)
  assert.ok(validateProfile({ ...good, loanAmount: 'abc' }).errors.loanAmount)
  assert.ok(validateProfile({ ...good, monthlyIncome: '0' }).errors.monthlyIncome)
  assert.ok(validateProfile({ ...good, existingEmi: '60000' }).errors.existingEmi)
  assert.ok(validateProfile({ ...good, tenureMonths: '12.5' }).errors.tenureMonths)
  assert.ok(validateProfile({ ...good, tenureMonths: '999' }).errors.tenureMonths)
  const empty = validateProfile({ loanAmount: '', loanPurpose: '', monthlyIncome: '', existingEmi: '', tenureMonths: '', employmentType: '' })
  assert.strictEqual(empty.valid, false)
  assert.ok(empty.errors.loanPurpose && empty.errors.employmentType)
})
