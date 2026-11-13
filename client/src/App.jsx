import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from './context/AuthContext.jsx'
import PublicNavbar from './components/PublicNavbar.jsx'
import Sidebar from './components/Sidebar.jsx'
import AppHeader from './components/AppHeader.jsx'
import Footer from './components/Footer.jsx'
import AnimatedBackground from './components/AnimatedBackground.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import RoleRoute from './components/RoleRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'

import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Discover from './pages/Discover.jsx'
import Ideas from './pages/Ideas.jsx'
import MyTeams from './pages/MyTeams.jsx'
import Messages from './pages/Messages.jsx'
import VerifyEmail from './pages/VerifyEmail.jsx'
import Hackathons from './pages/Hackathons.jsx'
import HackathonDetail from './pages/HackathonDetail.jsx'
import FindTeammates from './pages/FindTeammates.jsx'
import TeamDetail from './pages/TeamDetail.jsx'
import Requests from './pages/Requests.jsx'
import Profile from './pages/Profile.jsx'
import Notifications from './pages/Notifications.jsx'
import HostDashboard from './pages/host/HostDashboard.jsx'
import HostRequests from './pages/host/HostRequests.jsx'
import HackathonForm from './pages/host/HackathonForm.jsx'
import HackathonManage from './pages/host/HackathonManage.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import NotFound from './pages/NotFound.jsx'
import Privacy from './pages/Privacy.jsx'
import Terms from './pages/Terms.jsx'
import CookieBanner from './components/CookieBanner.jsx'
import OnboardingModal from './components/OnboardingModal.jsx'

/** Wraps a page with a clean transition animation. */
function Page({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative z-10 w-full"
    >
      {children}
    </motion.div>
  )
}

function DashboardRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.isAdmin) return <Navigate to="/admin" replace />
  if (user.role === 'host') return <Navigate to="/host" replace />
  return <Page><Dashboard /></Page>
}

function AdminShortcut() {
  const { user } = useAuth()
  if (!user?.isAdmin) return null

  return (
    <div className="px-4 pt-3 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
      <Link
        to="/admin"
        className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70"
      >
        <ShieldCheck className="h-4 w-4" />
        Admin panel
      </Link>
    </div>
  )
}

const PUBLIC_PATHS = ['/', '/login', '/register', '/verify-email', '/privacy', '/terms', '/hackathons']

export default function App() {
  const location = useLocation()
  const { isAuthed } = useAuth()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('devsync_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Persist sidebar collapsed preference
  useEffect(() => {
    try {
      localStorage.setItem('devsync_sidebar_collapsed', String(sidebarCollapsed))
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [location.pathname])

  const isPublicView = !isAuthed || PUBLIC_PATHS.includes(location.pathname)

  const renderRoutes = () => (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Page><Landing /></Page>} />
        <Route path="/login" element={<Page><Login /></Page>} />
        <Route path="/register" element={<Page><Register /></Page>} />
        <Route path="/dashboard" element={<DashboardRedirect />} />

        {/* ---- student routes ---- */}
        <Route path="/discover" element={<RoleRoute role="student"><Page><Discover /></Page></RoleRoute>} />
        <Route path="/ideas" element={<RoleRoute role="student"><Page><Ideas /></Page></RoleRoute>} />
        <Route path="/my-teams" element={<RoleRoute role="student"><Page><MyTeams /></Page></RoleRoute>} />
        <Route path="/messages" element={<RoleRoute role="student"><Page><Messages /></Page></RoleRoute>} />
        <Route path="/verify-email" element={<Page><VerifyEmail /></Page>} />
        <Route path="/hackathons" element={<Page><Hackathons /></Page>} />
        <Route path="/hackathons/:id" element={<Page><HackathonDetail /></Page>} />
        <Route path="/find-teammates" element={<RoleRoute role="student"><Page><FindTeammates /></Page></RoleRoute>} />
        <Route path="/teams/:id" element={<RoleRoute role="student"><Page><TeamDetail /></Page></RoleRoute>} />
        <Route path="/requests" element={<RoleRoute role="student"><Page><Requests /></Page></RoleRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Page><Profile /></Page></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Page><Notifications /></Page></ProtectedRoute>} />

        {/* ---- host routes ---- */}
        <Route path="/host" element={<RoleRoute role="host"><Page><HostDashboard /></Page></RoleRoute>} />
        <Route path="/host/requests" element={<RoleRoute role="host"><Page><HostRequests /></Page></RoleRoute>} />
        <Route path="/host/hackathons/new" element={<RoleRoute role="host"><Page><HackathonForm /></Page></RoleRoute>} />
        <Route path="/host/hackathons/:id/edit" element={<RoleRoute role="host"><Page><HackathonForm /></Page></RoleRoute>} />
        <Route path="/host/hackathons/:id" element={<RoleRoute role="host"><Page><HackathonManage /></Page></RoleRoute>} />

        {/* Admin pages also rely on server-side requireAdmin authorization. */}
        <Route path="/admin" element={<AdminRoute><Page><AdminPanel /></Page></AdminRoute>} />

        <Route path="/privacy" element={<Page><Privacy /></Page>} />
        <Route path="/terms" element={<Page><Terms /></Page>} />
        <Route path="*" element={<Page><NotFound /></Page>} />
      </Routes>
    </AnimatePresence>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
      <AnimatedBackground />

      {isPublicView ? (
        /* Public layout with top navbar and footer */
        <div className="flex-1 flex flex-col min-h-screen">
          <PublicNavbar />
          <main className="flex-1 flex flex-col">
            {renderRoutes()}
          </main>
          <Footer />
        </div>
      ) : (
        /* Authenticated SaaS Workspace Layout with Collapsible Sidebar */
        <div className="flex-1 flex min-h-screen">
          <Sidebar
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            mobileOpen={mobileSidebarOpen}
            setMobileOpen={setMobileSidebarOpen}
          />
          <div
            className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
              sidebarCollapsed ? 'md:pl-18' : 'md:pl-64'
            }`}
          >
            <AppHeader
              onOpenMobileMenu={() => setMobileSidebarOpen(true)}
              collapsed={sidebarCollapsed}
            />
            <AdminShortcut />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {renderRoutes()}
            </main>
          </div>
        </div>
      )}

      <CookieBanner />
      <OnboardingModal />
    </div>
  )
}
