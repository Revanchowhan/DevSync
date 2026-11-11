import React from 'react'

/**
 * MatchRing — Clean SVG circular progress for teammate match percentages.
 * Color ranges: red < 40, amber 40–70, emerald > 70.
 */
export default function MatchRing({ percent = 0, size = 80, stroke = 7, showLabel = true }) {
  const p = Math.max(0, Math.min(100, Math.round(percent)))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color = p < 40 ? '#ef4444' : p <= 70 ? '#f59e0b' : '#10b981'

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-slate-100 dark:text-slate-800"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * p) / 100}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-semibold text-slate-900 dark:text-white leading-none" style={{ fontSize: Math.max(14, size * 0.22) }}>
            {p}%
          </span>
          <span className="text-[9px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
            match
          </span>
        </div>
      )}
    </div>
  )
}
