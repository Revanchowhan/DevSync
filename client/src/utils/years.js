/** Year-of-study options. The API expects a number 1-6; the UI shows labels. */

export const YEAR_OPTIONS = [
  { label: '1st Year', value: 1 },
  { label: '2nd Year', value: 2 },
  { label: '3rd Year', value: 3 },
  { label: '4th Year', value: 4 },
  { label: 'Graduate', value: 5 },
]

export function yearLabel(value) {
  const opt = YEAR_OPTIONS.find((o) => o.value === Number(value))
  return opt ? opt.label : ''
}
