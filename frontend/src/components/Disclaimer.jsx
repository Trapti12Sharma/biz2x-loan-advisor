import { ShieldAlert } from 'lucide-react'

export const DISCLAIMER_TEXT =
  'All loan recommendations are indicative and subject to final lender approval, underwriting and document verification.'

export default function Disclaimer({ className = '' }) {
  return (
    <div className={`flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 ${className}`}>
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{DISCLAIMER_TEXT} Product data shown is mock demonstration data, not real lender policy.</p>
    </div>
  )
}
