import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie } from 'lucide-react'

const KEY = 'hm-cookie-ok'

export default function CookieBanner() {
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem(KEY) !== '1'
    } catch {
      return true
    }
  })

  const accept = () => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* storage unavailable */
    }
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-elevated flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Cookie className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                We use browser storage strictly to keep you authenticated and store your settings.
                No third-party ad trackers. See our{' '}
                <Link to="/privacy" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
              <button onClick={accept} className="btn-primary btn-sm mt-2.5 !text-xs !py-1 !px-3">
                Accept & Dismiss
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
