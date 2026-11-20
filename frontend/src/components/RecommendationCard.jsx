import { CircleCheck, CircleX, TriangleAlert, Info, Star } from 'lucide-react'
import { inr } from '../utils/format'

const STATUS = {
  eligible: { label: 'Appears eligible', cls: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-300' },
  conditional: { label: 'Needs more info', cls: 'bg-amber-100 text-amber-800', border: 'border-amber-300' },
  not_eligible: { label: 'Not a match', cls: 'bg-slate-100 text-slate-600', border: 'border-slate-200' },
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

export default function RecommendationCard({ rec, isBest }) {
  const s = STATUS[rec.status]
  return (
    <article className={`rounded-xl border bg-white p-4 shadow-sm ${isBest ? 'border-2 border-teal-500' : s.border}`}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          {isBest && <Star className="h-4 w-4 fill-teal-500 text-teal-500" aria-label="Best match" />}
          {rec.name}
        </h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
      </header>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Interest rate (mock)" value={`${rec.annualInterestRate}% p.a.`} />
        <Stat label={`Monthly EMI (${rec.evaluatedTenureMonths} mo)`} value={inr(rec.emi)} />
        <Stat label="Total interest" value={inr(rec.totalInterest)} />
        <Stat label="Total repayment" value={inr(rec.totalRepayment)} />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Total monthly obligation with existing EMI: <b>{inr(rec.totalMonthlyObligation)}</b> ({Math.round(rec.obligationRatioAfter * 100)}% of income)
      </p>

      {rec.notes.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-amber-800">
          {rec.notes.map((n) => (
            <li key={n} className="flex gap-1.5"><TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />{n}</li>
          ))}
        </ul>
      )}

      <details className="mt-3 text-sm">
        <summary className="flex cursor-pointer items-center gap-1 text-teal-700"><Info className="h-4 w-4" /> Why this result?</summary>
        <ul className="mt-2 space-y-1.5">
          {rec.reasons.map((r) => (
            <li key={r.check} className="flex gap-2 text-slate-700">
              {r.passed
                ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                : <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />}
              <span>{r.message}</span>
            </li>
          ))}
        </ul>
      </details>
    </article>
  )
}
