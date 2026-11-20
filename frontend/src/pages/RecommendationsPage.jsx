import RecommendationCard from '../components/RecommendationCard'
import Disclaimer from '../components/Disclaimer'
import { inr } from '../utils/format'

export default function RecommendationsPage({ result }) {
  const { profile, recommendations, bestMatchProductId } = result
  const anyEligible = Boolean(bestMatchProductId)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Recommendations</h1>
        <p className="text-sm text-slate-600">
          For {inr(profile.loanAmount)} over {profile.tenureMonths} months · income {inr(profile.monthlyIncome)} · existing EMI {inr(profile.existingEmi)}
        </p>
      </div>

      {!anyEligible && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          No product fully matches this profile under the demo rules. Open "Why this result?" on each card to see what to adjust, such as the amount or tenure.
        </div>
      )}

      <div className="space-y-3">
        {recommendations.map((rec) => (
          <RecommendationCard key={rec.productId} rec={rec} isBest={rec.productId === bestMatchProductId} />
        ))}
      </div>
      <Disclaimer />
    </div>
  )
}
