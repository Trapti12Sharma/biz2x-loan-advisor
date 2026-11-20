import { useState } from 'react'
import { inr } from '../utils/format'
import Disclaimer from '../components/Disclaimer'
import TenureComparison from '../components/TenureComparison'

const STATUS_LABEL = { eligible: 'Appears eligible', conditional: 'Needs more info', not_eligible: 'Not a match' }

const ROWS = [
  ['Status', (r) => STATUS_LABEL[r.status]],
  ['Interest rate (mock)', (r) => `${r.annualInterestRate}% p.a.`],
  ['Tenure used', (r) => `${r.evaluatedTenureMonths} months`],
  ['Monthly EMI', (r) => inr(r.emi)],
  ['Total interest', (r) => inr(r.totalInterest)],
  ['Total repayment', (r) => inr(r.totalRepayment)],
  ['Total monthly obligation (with existing EMI)', (r) => `${inr(r.totalMonthlyObligation)} (${Math.round(r.obligationRatioAfter * 100)}% of income)`],
]

export default function ComparePage({ result, products }) {
  const { recommendations, profile } = result

  // Default selection: top 2 results (the engine already ranks them).
  const [selected, setSelected] = useState(() => recommendations.slice(0, 2).map((r) => r.productId))
  const [tenureFor, setTenureFor] = useState(recommendations[0].productId)

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 3 ? [...s, id] : s))

  const chosen = recommendations.filter((r) => selected.includes(r.productId))

  // Tenure trade-off for one product: pick standard tenures inside that product's allowed range.
  const product = products.find((p) => p.id === tenureFor)
  const tenures = product
    ? [...new Set([...[6, 12, 24, 36, 48, 60].filter((t) => t >= product.minTenureMonths && t <= product.maxTenureMonths), profile.tenureMonths].filter((t) => t >= product.minTenureMonths && t <= product.maxTenureMonths))].sort((a, b) => a - b)
    : []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Compare products</h1>
        <p className="text-sm text-slate-600">Pick 2 or 3 products. Figures use your profile: {inr(profile.loanAmount)}, income {inr(profile.monthlyIncome)}.</p>
      </div>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Products to compare</legend>
        {recommendations.map((r) => (
          <label key={r.productId} className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${selected.includes(r.productId) ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-slate-300 bg-white text-slate-700'}`}>
            <input type="checkbox" className="sr-only" checked={selected.includes(r.productId)} onChange={() => toggle(r.productId)} />
            {r.name}
          </label>
        ))}
      </fieldset>

      {chosen.length < 2 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Select at least two products to compare.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="p-3"></th>
                {chosen.map((r) => <th key={r.productId} className="p-3 font-semibold">{r.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, fn]) => (
                <tr key={label} className="border-t border-slate-100">
                  <th scope="row" className="p-3 text-xs font-medium text-slate-500">{label}</th>
                  {chosen.map((r) => <td key={r.productId} className="p-3">{fn(r)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Tenure trade-off for
          <select value={tenureFor} onChange={(e) => setTenureFor(e.target.value)} className="ml-2 rounded-lg border border-slate-300 px-2 py-1 text-sm">
            {recommendations.map((r) => <option key={r.productId} value={r.productId}>{r.name}</option>)}
          </select>
        </label>
        {product && tenures.length >= 2 ? (
          <TenureComparison principal={profile.loanAmount} annualRatePercent={product.annualInterestRate} tenures={tenures} />
        ) : (
          <p className="text-sm text-slate-500">This product has a single allowed tenure, so there is no tenure trade-off to show.</p>
        )}
      </div>
      <Disclaimer />
    </div>
  )
}
