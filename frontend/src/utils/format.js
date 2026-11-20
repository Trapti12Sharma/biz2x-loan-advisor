export const inr = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })

export const PURPOSE_OPTIONS = [
  ['personal', 'Personal'],
  ['medical', 'Medical'],
  ['education', 'Education'],
  ['travel', 'Travel'],
  ['home_renovation', 'Home renovation'],
  ['debt_consolidation', 'Debt consolidation'],
  ['emergency', 'Emergency'],
  ['shopping', 'Shopping'],
  ['business', 'Business'],
  ['working_capital', 'Working capital'],
]

export const EMPLOYMENT_OPTIONS = [
  ['salaried', 'Salaried'],
  ['self-employed', 'Self-employed'],
]

export const RISK_OPTIONS = [
  ['low', 'Low (prefer lower monthly burden)'],
  ['medium', 'Medium'],
  ['high', 'High'],
]
