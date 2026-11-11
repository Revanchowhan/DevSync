import React, { useState, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Compass,
  Lightbulb,
  Users,
  Trophy,
  MessageSquare,
  UserPlus,
  User,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

export function Logo({ compact = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group shrink-0">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-subtle group-hover:shadow transition-all shrink-0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
          <path d="M16 21h5v-5" />
        </svg>
      </div>
      {!compact && (
        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Dev<span className="text-indigo-600 dark:text-indigo-400">Sync</span>
        </span>
      )}
    </Link>
  )
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, isStudent, isHost, logout } = useAuth()
  const { isDark, toggle: toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const [unreadMsg, setUnreadMsg] = useState(0)
  const [pendingReq, setPendingReq] = useState(0)

  // Poll counts
  useEffect(() => {
    let alive = true
    const fetchCounts = async () => {
      try {
        const [msgRes, reqRes] = await Promise.allSettled([
          api.get('/conversations/unread-total'),
          api.get('/requests/all?tab=received'),
        ])
        if (alive) {
          if (msgRes.status === 'fulfilled') setUnreadMsg(msgRes.value.data.unreadTotal || 0)
          if (reqRes.status === 'fulfilled') {
            const count = (reqRes.value.data.requests || []).length
            setPendingReq(count)
          }
        }
      } catch {
        /* silent */
      }
    }
    fetchCounts()
    const id = setInterval(fetchCounts, 30000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  const studentNavItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/discover', label: 'Discover', icon: Compass },
    { to: '/ideas', label: 'Ideas', icon: Lightbulb },
    { to: '/my-teams', label: 'My Teams', icon: Users },
    { to: '/hackathons', label: 'Hackathons', icon: Trophy },
    { to: '/messages', label: 'Messages', icon: MessageSquare, badge: unreadMsg },
    { to: '/requests', label: 'Requests', icon: UserPlus, badge: pendingReq },
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/profile#settings', label: 'Settings', icon: Settings },
  ]

  const hostNavItems = [
    { to: '/host', label: 'Dashboard', icon: LayoutDashboard },
    ...(user?.isAdmin ? [{ to: '/host/requests', label: 'Host Approvals', icon: ShieldCheck }] : []),
    { to: '/hackathons', label: 'Hackathons', icon: Trophy },
    { to: '/profile', label: 'Profile', icon: User },
  ]

  const navItems = isHost ? hostNavItems : studentNavItems

  const handleLogout = () => {
    logout()
    if (setMobileOpen) setMobileOpen(false)
    navigate('/')
  }

  const renderNavLinks = (isMobile = false) => (
    <nav className="flex-1 space-y-1 px-3 py-3 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.to || (item.to !== '/dashboard' && item.to !== '/host' && location.pathname.startsWith(item.to.split('#')[0]) && item.to !== '/profile#settings')
        const isCollapsedMode = !isMobile && collapsed

        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => isMobile && setMobileOpen(false)}
            title={isCollapsedMode ? item.label : undefined}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold shadow-subtle'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            } ${isCollapsedMode ? 'justify-center px-2' : ''}`}
          >
            <Icon
              className={`w-4 h-4 shrink-0 transition-colors ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'
              }`}
            />
            {!isCollapsedMode && (
              <span className="truncate flex-1">{item.label}</span>
            )}
            {!isCollapsedMode && item.badge > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-600 text-white leading-none">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
            {isCollapsedMode && item.badge > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-900" />
            )}
          </NavLink>
        )
      })}
    </nav>
  )

  const renderBottomProfile = (isMobile = false) => {
    const isCollapsedMode = !isMobile && collapsed
    return (
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
        {/* User Card */}
        <div
          className={`flex items-center gap-2.5 p-2 rounded-xl ${
            isCollapsedMode ? 'justify-center p-1' : ''
          }`}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
          )}

          {!isCollapsedMode && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate leading-tight">
                {user?.name || 'Builder'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
                {user?.role === 'host' ? 'Host' : user?.college || 'Student'}
              </p>
            </div>
          )}
        </div>

        {/* Quick actions (Theme & Logout) */}
        <div className={`flex items-center gap-1 ${isCollapsedMode ? 'flex-col' : 'justify-between'}`}>
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={handleLogout}
            title="Log out"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ${
              isCollapsedMode ? 'p-2' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsedMode && <span>Logout</span>}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Collapsible Left Sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed top-0 left-0 bottom-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-200 ${
          collapsed ? 'w-18' : 'w-64'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 dark:border-slate-800">
          <Logo compact={collapsed} />
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-all hover:bg-slate-50 shadow-subtle cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation links */}
        {renderNavLinks(false)}

        {/* Bottom profile and controls */}
        {renderBottomProfile(false)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <div
        className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-elevated transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 dark:border-slate-800">
          <Logo />
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {renderNavLinks(true)}
        {renderBottomProfile(true)}
      </div>
    </>
  )
}
