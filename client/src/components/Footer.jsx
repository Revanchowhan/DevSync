import React from 'react'
import { Link } from 'react-router-dom'
import { Logo } from './Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Footer() {
  const { isStudent, isHost } = useAuth()

  return (
    <footer className="relative z-10 mt-auto border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="page-shell py-12">
        <div className="grid gap-8 grid-cols-1 md:grid-cols-4">
          <div className="md:col-span-2 space-y-3">
            <Logo />
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Different Skills. Same Goals. Stronger Teams. DevSync helps university students connect and form high-performing hackathon squads with complementary skills.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>DevSync Network · Live across university campuses</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/hackathons" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Hackathons
                </Link>
              </li>
              {isStudent && (
                <>
                  <li>
                    <Link to="/discover" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      Discover Teammates
                    </Link>
                  </li>
                  <li>
                    <Link to="/ideas" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      Ideas Hub
                    </Link>
                  </li>
                  <li>
                    <Link to="/requests" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      Requests
                    </Link>
                  </li>
                </>
              )}
              {isHost && (
                <li>
                  <Link to="/host" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    Host Dashboard
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Resources & Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#about" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  About DevSync
                </a>
              </li>
              <li>
                <Link to="/privacy" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} DevSync. Built for university builders.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <Link to="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Privacy
            </Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
