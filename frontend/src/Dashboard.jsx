import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ProfilePage from './pages/ProfilePage'
import RecommendationsPage from './pages/RecommendationsPage'
import ComparePage from './pages/ComparePage'
import EmiPage from './pages/EmiPage'
import ChatPage from './pages/ChatPage'
import { useAdvisor } from './hooks/useAdvisor'
import { useProducts } from './hooks/useProducts'
import { useChat } from './hooks/useChat'

// The signed-in app. It unmounts on logout, which wipes ALL of this state
// (profile, results, chat) from browser memory.
export default function Dashboard({ user, onLogout }) {
  const [page, setPage] = useState('profile')
  const { profile, result, loading, error, submitProfile } = useAdvisor()
  const { products } = useProducts()
  const chat = useChat()

  const handleSubmit = async (p) => {
    const ok = await submitProfile(p)
    if (ok) setPage('recommendations') // move on only when the backend accepted it
  }

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <Sidebar page={page} onNavigate={setPage} hasResult={Boolean(result)} user={user} onLogout={onLogout} />
      <main className="mx-auto w-full max-w-4xl p-4 md:p-8">
        {page === 'profile' && <ProfilePage profile={profile} loading={loading} error={error} onSubmit={handleSubmit} />}
        {page === 'recommendations' && result && <RecommendationsPage result={result} />}
        {page === 'compare' && result && <ComparePage result={result} products={products} />}
        {page === 'emi' && <EmiPage products={products} profile={profile} />}
        {page === 'chat' && <ChatPage chat={chat} profile={profile} onGoToProfile={() => setPage('profile')} />}
      </main>
    </div>
  )
}
