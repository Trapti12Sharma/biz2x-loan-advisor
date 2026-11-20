import { useState } from 'react'
import { Landmark, Loader2 } from 'lucide-react'
import ErrorBanner from '../components/ErrorBanner'

// MOCK demo accounts for the assignment prototype only.
const DEMO = [
  { name: 'Aarav Demo', email: 'aarav@example.com', password: 'Demo@1234' },
  { name: 'Diya Demo', email: 'diya@example.com', password: 'Demo@5678' },
]

const inputCls = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500'

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError({ message: 'Enter your email and password', details: [] })
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onLogin(email.trim(), password)
    } catch (err) {
      setError({ message: err.message, details: [] })
      setLoading(false) // on success this page unmounts, so only reset on failure
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Landmark className="h-6 w-6 text-teal-600" />
          <div>
            <h1 className="font-semibold text-slate-900">AI Loan Advisor</h1>
            <p className="text-xs text-slate-500">Sign in to your demo account</p>
          </div>
        </div>

        <ErrorBanner error={error} />

        <form onSubmit={submit} noValidate className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">Email
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </label>
          <label className="block text-sm font-medium text-slate-700">Password
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
          </label>
          <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
          </button>
        </form>

        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <p className="mb-2 font-medium">Mock demo accounts (local prototype only)</p>
          {DEMO.map((d) => (
            <button key={d.email} type="button" onClick={() => { setEmail(d.email); setPassword(d.password); setError(null) }} className="mb-1 block w-full rounded border border-slate-200 bg-white px-2 py-1 text-left hover:border-teal-500">
              {d.name}: {d.email}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
