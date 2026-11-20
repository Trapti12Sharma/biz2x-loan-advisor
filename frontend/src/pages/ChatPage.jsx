import { useState, useRef, useEffect } from 'react'
import { SendHorizontal, Loader2, Trash2, MessageSquareText, UserCheck, UserX } from 'lucide-react'
import ChatMessage from '../components/ChatMessage'
import ErrorBanner from '../components/ErrorBanner'
import { inr } from '../utils/format'

const SUGGESTIONS = [
  'Which loan option is suitable for me?',
  'Explain shorter vs longer tenure for my loan',
  'What is EMI and how is it calculated?',
  'Why is a product not a match for me?',
]

export default function ChatPage({ chat, profile, onGoToProfile }) {
  const { messages, sending, error, send, clear } = chat
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  // Scroll to newest message whenever the list or typing indicator changes.
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, sending])

  const submit = (e) => {
    e.preventDefault()
    if (!input.trim() || sending) return
    send(input)
    setInput('')
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-3 md:h-[calc(100vh-4rem)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-slate-900">AI Loan Advisor</h1>
        {messages.length > 0 && (
          <button onClick={clear} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
            <Trash2 className="h-4 w-4" /> Clear chat
          </button>
        )}
      </div>

      {profile ? (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <UserCheck className="h-4 w-4 shrink-0" />
          Using your profile: {inr(profile.loanAmount)} for {profile.tenureMonths} months, income {inr(profile.monthlyIncome)}.
        </p>
      ) : (
        <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <UserX className="h-4 w-4 shrink-0" />
          No borrower profile yet, so answers are general and no EMI is calculated.
          <button onClick={onGoToProfile} className="font-semibold underline">Add profile</button>
        </p>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-slate-200 bg-slate-100/60 p-4">
        {messages.length === 0 && !sending && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <MessageSquareText className="h-10 w-10 text-slate-400" />
            <p className="text-sm text-slate-600">Ask about loan products, EMI or tenure. Try one:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-teal-500 hover:text-teal-700">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => <ChatMessage key={m.id} message={m} />)}
        {sending && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Advisor is thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ErrorBanner error={error} />

      <form onSubmit={submit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
          placeholder="Ask about loans, EMI, tenure..."
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button type="submit" disabled={sending || !input.trim()} aria-label="Send message" className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
          <SendHorizontal className="h-4 w-4" />
        </button>
      </form>
      <p className="text-center text-[11px] text-slate-500">
        Indicative guidance on mock data. Final approval depends on lender underwriting and verification.
      </p>
    </div>
  )
}
