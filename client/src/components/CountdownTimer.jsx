import React, { useEffect, useState } from 'react'

function pad(n) {
  return String(n).padStart(2, '0')
}

function parts(deadline) {
  const diff = new Date(deadline).getTime() - Date.now()
  if (Number.isNaN(diff) || diff <= 0) return null
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { d, h, m, s }
}

/**
 * CountdownTimer — live ticking countdown to a deadline.
 */
export default function CountdownTimer({ deadline, label = 'Registration closes in', compact = false }) {
  const [t, setT] = useState(() => parts(deadline))

  useEffect(() => {
    setT(parts(deadline))
    const id = setInterval(() => setT(parts(deadline)), 1000)
    return () => clearInterval(id)
  }, [deadline])

  if (!t) {
    return (
      <span className="chip border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400 font-mono text-xs">
        ● Closed
      </span>
    )
  }

  const urgent = t.d === 0 && t.h < 6

  if (compact) {
    return (
      <span
        className={`font-mono text-xs font-semibold tabular-nums ${
          urgent ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-indigo-600 dark:text-indigo-400'
        }`}
        title={label}
      >
        {t.d > 0 && `${t.d}d `}
        {pad(t.h)}:{pad(t.m)}:{pad(t.s)}
      </span>
    )
  }

  const cells = [
    [t.d, 'days'],
    [t.h, 'hrs'],
    [t.m, 'min'],
    [t.s, 'sec'],
  ]

  return (
    <div>
      <p className="label !mb-1.5">{label}</p>
      <div className="flex gap-1.5">
        {cells.map(([v, u]) => (
          <div
            key={u}
            className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-center min-w-[3rem] shadow-subtle ${
              urgent ? '!border-rose-300 dark:!border-rose-800' : ''
            }`}
          >
            <div
              className={`font-mono text-base font-bold tabular-nums leading-none ${
                urgent ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
              }`}
            >
              {pad(v)}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">{u}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
