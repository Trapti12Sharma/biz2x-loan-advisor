import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { validateProfile } from '../utils/validateProfile'
import { PURPOSE_OPTIONS, EMPLOYMENT_OPTIONS, RISK_OPTIONS } from '../utils/format'

const EMPTY = {
  loanAmount: '', loanPurpose: '', monthlyIncome: '', existingEmi: '',
  tenureMonths: '', employmentType: '', riskProfile: 'medium',
}

// Sample from the assignment's example question (for quick demos).
const SAMPLE = {
  loanAmount: '500000', loanPurpose: 'personal', monthlyIncome: '50000', existingEmi: '5000',
  tenureMonths: '36', employmentType: 'salaried', riskProfile: 'medium',
}

const inputCls = (err) =>
  `mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 ${err ? 'border-red-400' : 'border-slate-300'}`

function Field({ label, error, children }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {children}
      {error && <span className="mt-1 block text-xs font-normal text-red-600">{error}</span>}
    </label>
  )
}

export default function ProfileForm({ initial, loading, onSubmit }) {
  // Local state: what the user is typing right now.
  const [form, setForm] = useState(
    initial ? Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, String(v)])) : EMPTY
  )
  const [errors, setErrors] = useState({})

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault() // stop the browser's full-page reload
    const { errors: errs, profile, valid } = validateProfile(form)
    setErrors(errs)
    if (valid) onSubmit(profile)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Required loan amount (₹)" error={errors.loanAmount}>
          <input type="number" min="0" inputMode="numeric" value={form.loanAmount} onChange={set('loanAmount')} className={inputCls(errors.loanAmount)} placeholder="e.g. 500000" />
        </Field>
        <Field label="Loan purpose" error={errors.loanPurpose}>
          <select value={form.loanPurpose} onChange={set('loanPurpose')} className={inputCls(errors.loanPurpose)}>
            <option value="">Select purpose</option>
            {PURPOSE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Monthly income (₹)" error={errors.monthlyIncome}>
          <input type="number" min="0" inputMode="numeric" value={form.monthlyIncome} onChange={set('monthlyIncome')} className={inputCls(errors.monthlyIncome)} placeholder="e.g. 50000" />
        </Field>
        <Field label="Existing monthly EMI (₹)" error={errors.existingEmi}>
          <input type="number" min="0" inputMode="numeric" value={form.existingEmi} onChange={set('existingEmi')} className={inputCls(errors.existingEmi)} placeholder="0 if none" />
        </Field>
        <Field label="Preferred tenure (months)" error={errors.tenureMonths}>
          <input type="number" min="1" max="360" inputMode="numeric" value={form.tenureMonths} onChange={set('tenureMonths')} className={inputCls(errors.tenureMonths)} placeholder="e.g. 36" />
        </Field>
        <Field label="Employment type" error={errors.employmentType}>
          <select value={form.employmentType} onChange={set('employmentType')} className={inputCls(errors.employmentType)}>
            <option value="">Select type</option>
            {EMPLOYMENT_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Risk profile (optional)" error={errors.riskProfile}>
          <select value={form.riskProfile} onChange={set('riskProfile')} className={inputCls(errors.riskProfile)}>
            {RISK_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Checking...' : 'Get recommendations'}
        </button>
        <button type="button" onClick={() => { setForm(SAMPLE); setErrors({}) }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
          Fill sample data
        </button>
      </div>
    </form>
  )
}
