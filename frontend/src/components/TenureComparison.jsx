import { useState, useEffect } from 'react'
import { Loader2, Scale } from 'lucide-react'
import { compareTenures } from '../services/api'
import { inr } from '../utils/format'
import ErrorBanner from './ErrorBanner'

// Shows the same loan over several tenures + a plain-language trade-off.
// All numbers come from the backend calculator (never from the AI).
export default function TenureComparison({ principal, annualRatePercent, tenures }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const key = `${principal}|${annualRatePercent}|${tenures.join(',')}` // re-run when inputs change

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    compareTenures({ principal, annualRatePercent, tenures })
      .then((d) => { if (!cancelled) setData(d) })
      .catch((e) => { if (!cancelled) { setData(null); setError({ message: e.message, details: e.details }) } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Scale className="h-4 w-4 text-teal-600" /> Shorter vs longer tenure</h3>
      {loading && <p className="mt-3 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Calculating...</p>}
      <div className="mt-3"><ErrorBanner error={error} /></div>
      {data && !loading && (
        <>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr><th className="py-1 pr-3">Tenure</th><th className="pr-3">Monthly EMI</th><th className="pr-3">Total interest</th><th>Total repayment</th></tr>
              </thead>
              <tbody>
                {data.options.map((o) => (
                  <tr key={o.tenureMonths} className="border-t border-slate-100">
                    <td className="py-1.5 pr-3 font-medium">{o.tenureMonths} months</td>
                    <td className="pr-3">{inr(o.emi)}</td>
                    <td className="pr-3">{inr(o.totalInterest)}</td>
                    <td>{inr(o.totalRepayment)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{data.tradeoff}</p>
        </>
      )}
    </section>
  )
}
