import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { calculateEmi } from '../services/api'
import { inr } from '../utils/format'
import ErrorBanner from '../components/ErrorBanner'
import Disclaimer from '../components/Disclaimer'
import TenureComparison from '../components/TenureComparison'

const inputCls = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500'

function Summary({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-900">{value}</p>
    </div>
  )
}

export default function EmiPage({ products, profile }) {
  const [form, setForm] = useState({
    principal: profile ? String(profile.loanAmount) : '',
    rate: '',
    tenure: profile ? String(profile.tenureMonths) : '',
  })
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      // Number() converts form strings; '' becomes NaN-safe by sending NaN -> backend rejects clearly.
      const body = {
        principal: form.principal === '' ? null : Number(form.principal),
        annualRatePercent: form.rate === '' ? null : Number(form.rate),
        tenureMonths: form.tenure === '' ? null : Number(form.tenure),
      }
      setResult(await calculateEmi(body))
    } catch (err) {
      setResult(null)
      setError({ message: err.message, details: err.details })
    } finally {
      setLoading(false)
    }
  }

  const tenureSet = result
    ? [...new Set([12, 24, 36, 48, 60, result.tenureMonths])].sort((a, b) => a - b)
    : []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">EMI calculator</h1>
        <p className="text-sm text-slate-600">Reducing-balance EMI, calculated by our server code (not by AI).</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Fill the rate from a demo product (optional)
            <select className={inputCls} defaultValue="" onChange={(e) => e.target.value !== '' && setForm((f) => ({ ...f, rate: e.target.value }))}>
              <option value="">Choose a product...</option>
              {products.map((p) => <option key={p.id} value={p.annualInterestRate}>{p.name} ({p.annualInterestRate}% - mock)</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">Loan amount (₹)
            <input type="number" min="0" className={inputCls} value={form.principal} onChange={set('principal')} />
          </label>
          <label className="block text-sm font-medium text-slate-700">Annual interest rate (%)
            <input type="number" min="0" step="0.01" className={inputCls} value={form.rate} onChange={set('rate')} />
          </label>
          <label className="block text-sm font-medium text-slate-700">Tenure (months)
            <input type="number" min="1" className={inputCls} value={form.tenure} onChange={set('tenure')} />
          </label>
        </div>
        <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Calculate EMI
        </button>
      </form>

      <ErrorBanner error={error} />

      {!result && !error && (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Enter loan details and press Calculate to see your EMI summary.
        </p>
      )}

      {result && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Summary label="Monthly EMI" value={inr(result.emi)} />
            <Summary label="Total interest" value={inr(result.totalInterest)} />
            <Summary label="Total repayment" value={inr(result.totalRepayment)} />
          </div>
          <TenureComparison principal={result.principal} annualRatePercent={result.annualRatePercent} tenures={tenureSet} />
        </>
      )}
      <Disclaimer />
    </div>
  )
}
