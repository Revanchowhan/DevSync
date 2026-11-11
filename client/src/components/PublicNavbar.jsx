import React, { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, Sun, Moon, ArrowRight } from 'lucide-react'
import { Logo } from './Sidebar.jsx'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function PublicNavbar() {
  const { isAuthed } = useAuth()
  const { isDark, toggle: toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo />

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link
              to="/hackathons"
              className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors"
            >
              Explore Hackathons
            </Link>
            <a
              href="#how-it-works"
              className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors"
            >
              How It Works
            </a>
            <a
              href="#about"
              className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors"
            >
              Why DevSync
            </a>
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-slate-700 hover:text-indigo-600 transition-all shadow-subtle cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthed ? (
              <Link to="/dashboard" className="btn-primary btn-sm !px-4 !py-2">
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-white transition-colors"
                >
                  Log in
                </Link>
                <Link to="/register" className="btn-primary btn-sm !px-4 !py-2">
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/hackathons"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Explore Hackathons
          </Link>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            How It Works
          </a>
          <a
            href="#about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Why DevSync
          </a>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            {isAuthed ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary text-center"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-secondary text-center"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary text-center"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
