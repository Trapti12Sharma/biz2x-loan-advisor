import { UserRound, Sparkles, Landmark, Calculator, Scale, MessageCircle, LogOut } from 'lucide-react'

const ITEMS = [
  { id: 'profile', label: 'Borrower Profile', icon: UserRound },
  { id: 'recommendations', label: 'Recommendations', icon: Sparkles, needsResult: true },
  { id: 'compare', label: 'Compare', icon: Scale, needsResult: true },
  { id: 'emi', label: 'EMI Calculator', icon: Calculator },
  { id: 'chat', label: 'AI Advisor Chat', icon: MessageCircle },
]

export default function Sidebar({ page, onNavigate, hasResult, user, onLogout }) {
  return (
    <aside className="bg-slate-900 text-slate-100 md:w-64 md:min-h-screen md:shrink-0">
      <div className="flex items-center gap-2 px-4 py-4 md:py-6">
        <Landmark className="h-6 w-6 text-teal-400" />
        <div>
          <p className="font-semibold leading-tight">AI Loan Advisor</p>
          <p className="text-xs text-slate-400">Demo prototype</p>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-0">
        {ITEMS.map(({ id, label, icon: Icon, needsResult }) => {
          const disabled = needsResult && !hasResult
          const active = page === id
          return (
            <button
              key={id}
              disabled={disabled}
              title={disabled ? 'Submit your borrower profile first' : undefined}
              onClick={() => onNavigate(id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition
                ${active ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'}
                ${disabled ? 'cursor-not-allowed opacity-40 hover:bg-transparent' : ''}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          )
        })}
      </nav>
      <div className="flex items-center justify-between gap-2 border-t border-slate-800 px-4 py-3 text-sm md:mt-auto md:fixed md:bottom-0 md:w-64">
        <span className="truncate text-slate-300" title={user.email}>{user.name}</span>
        <button onClick={onLogout} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-slate-300 hover:bg-slate-800">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </aside>
  )
}
