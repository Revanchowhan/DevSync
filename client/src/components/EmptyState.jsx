import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

/** Friendly empty-state panel with optional CTA. */
export default function EmptyState({ icon: Icon, title, message, actionLabel, actionTo, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-2xl p-10 text-center max-w-md mx-auto"
    >
      <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-subtle">
        {Icon ? (
          typeof Icon === 'function' ? (
            <Icon className="w-6 h-6" />
          ) : (
            <span className="text-xl">{Icon}</span>
          )
        ) : (
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        )}
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      {message && <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-primary mt-5 inline-flex text-xs">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary mt-5 text-xs">
          {actionLabel}
        </button>
      )}
    </motion.div>
  )
}
