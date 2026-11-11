import React from 'react'
import { useTheme } from '../context/ThemeContext.jsx'

/**
 * AnimatedBackground — Soft, minimal SaaS ambient mesh background.
 * Provides subtle depth without aggressive neon or canvas particle clutter.
 */
export default function AnimatedBackground() {
  const { isDark } = useTheme()

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {isDark ? (
        <>
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[55rem] h-[28rem] rounded-full bg-indigo-950/30 blur-[130px]" />
          <div className="absolute top-1/3 -right-40 w-[35rem] h-[35rem] rounded-full bg-slate-900/40 blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
        </>
      ) : (
        <>
          {/* Subtle light mesh */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[60rem] h-[26rem] rounded-full bg-indigo-50/70 blur-[100px]" />
          <div className="absolute top-1/4 right-0 w-[32rem] h-[32rem] rounded-full bg-sky-50/50 blur-[90px]" />
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              maskImage: 'linear-gradient(to bottom, black 40%, transparent 95%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 95%)',
            }}
          />
        </>
      )}
    </div>
  )
}
