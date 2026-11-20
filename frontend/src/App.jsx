import { Loader2 } from 'lucide-react'
import LoginPage from './pages/LoginPage'
import Dashboard from './Dashboard'
import { useAuth } from './hooks/useAuth'

// Auth gate: nothing from the app renders until we have a verified user.
export default function App() {
  const { user, checking, login, logout } = useAuth()

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Checking your session...
      </div>
    )
  }
  if (!user) return <LoginPage onLogin={login} />

  // key=user.id guarantees a fresh Dashboard (fresh state) if the user ever changes.
  return <Dashboard key={user.id} user={user} onLogout={logout} />
}
