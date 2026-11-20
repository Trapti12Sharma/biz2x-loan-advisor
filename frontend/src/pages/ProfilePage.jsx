import ProfileForm from '../components/ProfileForm'
import ErrorBanner from '../components/ErrorBanner'
import Disclaimer from '../components/Disclaimer'

export default function ProfilePage({ profile, loading, error, onSubmit }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Borrower profile</h1>
        <p className="text-sm text-slate-600">Tell us about the loan you need. We check it against the demo product catalog.</p>
      </div>
      <ErrorBanner error={error} />
      <ProfileForm initial={profile} loading={loading} onSubmit={onSubmit} />
      <Disclaimer />
    </div>
  )
}
