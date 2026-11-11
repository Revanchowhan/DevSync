import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Bell, Sun, Moon, Search, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/discover': 'Discover Students',
  '/ideas': 'Ideas Hub',
  '/my-teams': 'My Teams',
  '/hackathons': 'Hackathons Directory',
  '/find-teammates': 'Find Teammates',
  '/messages': 'Messages',
  '/requests': 'Connection & Team Requests',
  '/profile': 'Student Profile',
  '/notifications': 'Notifications',
  '/host': 'Host Dashboard',
  '/host/requests': 'Host Approvals',
}

export default function AppHeader({ onOpenMobileMenu, collapsed }) {
  const { user } = useAuth()
  const { isDark, toggle: toggleTheme } = useTheme()
  const location = useLocation()
  const [unread, setUnread] = useState(0)

  // Determine current page title
  const currentTitle = PAGE_TITLES[location.pathname] || (
    location.pathname.startsWith('/teams/') ? 'Team Workspace' :
    location.pathname.startsWith('/hackathons/') ? 'Hackathon Details' :
    location.pathname.startsWith('/host/hackathons/') ? 'Manage Hackathon' : 'DevSync'
  )

  useEffect(() => {
    let alive = true
    const fetchNotif = async () => {
      try {
        const { data } = await api.get('/notifications/unread-count')
        if (alive) setUnread(data?.count || 0)
      } catch {
        /* ignore */
      }
    }
    fetchNotif()
    const id = setInterval(fetchNotif, 30000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Hamburger (mobile) + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {currentTitle}
          </h1>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Discover link */}
        <Link
          to="/discover"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Search Builders...</span>
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-slate-700 hover:text-indigo-600 transition-all shadow-subtle cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <Link
          to="/notifications"
          className="relative w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-slate-700 hover:text-indigo-600 transition-all shadow-subtle"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-4.5 px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shadow-subtle">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Link>

        {/* User avatar linking to Profile */}
        <Link
          to="/profile"
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white text-xs font-bold shadow-subtle">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
      </div>
    </header>
  )
}
