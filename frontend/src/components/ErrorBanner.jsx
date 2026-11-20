import { CircleAlert } from 'lucide-react'

export default function ErrorBanner({ error }) {
  if (!error) return null
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-medium">{error.message}</p>
        {error.details?.length > 0 && (
          <ul className="mt-1 list-disc pl-5">
            {error.details.map((d) => <li key={d}>{d}</li>)}
          </ul>
        )}
      </div>
    </div>
  )
}
