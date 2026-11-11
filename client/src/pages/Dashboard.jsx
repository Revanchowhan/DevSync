import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users,
  Compass,
  Lightbulb,
  Trophy,
  Inbox,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { calculateProfileCompletion } from '../utils/profileCompletion'
import { ListSkeleton } from '../components/Skeleton'

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    connectionsCount: 0,
    teamsCount: 0,
    ideasCount: 0,
    pendingRequestsCount: 0,
  })
  const [recommendedStudents, setRecommendedStudents] = useState([])
  const [myTeams, setMyTeams] = useState([])
  const [activeHackathons, setActiveHackathons] = useState([])
  const [recentIdeas, setRecentIdeas] = useState([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const [connRes, teamsRes, ideasRes, reqRes, studentsRes, hacksRes] =
          await Promise.allSettled([
            api.get('/connections?status=accepted'),
            api.get('/teams/my'),
            api.get('/ideas?status=open&limit=4'),
            api.get('/requests/all?tab=received'),
            api.get('/students?limit=4'),
            api.get('/hackathons?status=open&limit=3'),
          ])

        if (alive) {
          const conns = connRes.status === 'fulfilled' ? connRes.value.data.connections || [] : []
          const teams = teamsRes.status === 'fulfilled' ? teamsRes.value.data.teams || [] : []
          const ideas = ideasRes.status === 'fulfilled' ? ideasRes.value.data.ideas || [] : []
          const reqs = reqRes.status === 'fulfilled' ? reqRes.value.data.requests || [] : []
          const students = studentsRes.status === 'fulfilled' ? studentsRes.value.data.students || [] : []
          const hacks = hacksRes.status === 'fulfilled' ? hacksRes.value.data.hackathons || [] : []

          setStats({
            connectionsCount: conns.length,
            teamsCount: teams.length,
            ideasCount: ideas.length,
            pendingRequestsCount: reqs.length,
          })

          setMyTeams(teams.slice(0, 3))
          setRecommendedStudents(students)
          setActiveHackathons(hacks)
          setRecentIdeas(ideas.slice(0, 3))
        }
      } catch (err) {
        // Handled via allSettled
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [])

  const completionPercentage = calculateProfileCompletion(user)

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white text-xl font-bold shadow-subtle shrink-0">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Welcome back, {user?.name ? user.name.split(' ')[0] : 'Builder'}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
                Student Builder
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {user?.college || user?.university || 'University Student'}
              {user?.branch ? ` · ${user.branch}` : ''} · {(user?.skills || []).length} verified skills
            </p>
          </div>
        </div>

        {/* Quick CTA Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/discover">
            <Button size="sm" variant="primary" className="shadow-subtle">
              <Compass className="w-4 h-4 mr-1" />
              Find Teammates
            </Button>
          </Link>
          <Link to="/ideas">
            <Button size="sm" variant="secondary">
              <Lightbulb className="w-4 h-4 mr-1 text-amber-500" />
              Pitch Idea
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Profile Strength Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-slate-500 dark:text-slate-400">Profile Strength</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400 font-mono">
                {completionPercentage}%
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  completionPercentage >= 80 ? 'bg-emerald-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              {completionPercentage >= 80
                ? 'High matching accuracy active.'
                : 'Add roles & skills to boost match quality.'}
            </p>
          </div>
          <Link
            to="/profile"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold mt-3 block"
          >
            Update Profile →
          </Link>
        </div>

        {/* Connected Builders */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Connections</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white my-1 font-mono">
            {stats.connectionsCount}
          </p>
          <Link to="/requests" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            View network →
          </Link>
        </div>

        {/* Active Teams */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Teams</span>
            <Trophy className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white my-1 font-mono">
            {stats.teamsCount}
          </p>
          <Link to="/my-teams" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            Open workspace →
          </Link>
        </div>

        {/* Open Ideas */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Open Ideas</span>
            <Lightbulb className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white my-1 font-mono">
            {stats.ideasCount}
          </p>
          <Link to="/ideas" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            Browse concepts →
          </Link>
        </div>

        {/* Pending Requests */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Inbox Invites</span>
            <Inbox className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white my-1 font-mono">
            {stats.pendingRequestsCount}
          </p>
          <Link to="/requests" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            Review invites →
          </Link>
        </div>
      </div>

      {/* Main Grid: Recommended Teammates (Left 2 cols) & Sidebar Widgets (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recommended Teammates */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Recommended Teammates</span>
            </h2>
            <Link to="/discover" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              View All Candidates →
            </Link>
          </div>

          {loading ? (
            <ListSkeleton count={3} />
          ) : recommendedStudents.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200/80 dark:border-slate-800 text-slate-500 text-sm">
              <p>Explore candidate profiles to find complementary teammates.</p>
              <Link to="/discover" className="btn-primary btn-sm mt-3 inline-flex">
                Discover Builders
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedStudents.map((st) => (
                <div
                  key={st._id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-card hover:shadow-card-hover transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    {st.avatarUrl ? (
                      <img
                        src={st.avatarUrl}
                        alt={st.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white font-bold shrink-0 shadow-subtle">
                        {(st.name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                          {st.name}
                        </h4>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 px-2 py-0.2 rounded-full">
                          {st.match?.score || 88}% Fit
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {st.college || st.university || 'University Student'}{st.branch ? ` · ${st.branch}` : ''}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(st.skills || []).slice(0, 3).map((s, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium"
                          >
                            {typeof s === 'string' ? s : s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <Link to="/discover">
                      <Button size="sm" variant="secondary">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ideas Preview Feed */}
          {recentIdeas.length > 0 && (
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>Trending Ideas Looking for Builders</span>
                </h3>
                <Link to="/ideas" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  All Ideas →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recentIdeas.map((idea) => (
                  <Link
                    key={idea._id}
                    to="/ideas"
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700 shadow-card transition-all flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                        {idea.category || 'General'}
                      </span>
                      <h5 className="font-semibold text-xs text-slate-900 dark:text-white mt-2 line-clamp-1">
                        {idea.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {idea.description}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {(idea.interested || []).length} students interested
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Active Teams & Upcoming Hackathons */}
        <div className="space-y-6">
          {/* Active Teams Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Your Active Squads</span>
              </h3>
              <Link to="/my-teams" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                Workspace →
              </Link>
            </div>

            {myTeams.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You haven't formed a team yet. Create or join one for an upcoming hackathon!
                </p>
                <Link to="/my-teams" className="btn-secondary btn-sm mt-3 inline-flex text-xs">
                  Create Squad
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {myTeams.map((t) => (
                  <Link
                    key={t._id}
                    to="/my-teams"
                    className="block p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-slate-600 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">{t.name}</p>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {(t.members || []).length} members
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {t.hackathon?.title || 'Open Hackathon Team'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Hackathons Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-500" />
                <span>Upcoming Hackathons</span>
              </h3>
              <Link to="/hackathons" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                View All →
              </Link>
            </div>

            {activeHackathons.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No upcoming hackathons found.</p>
            ) : (
              <div className="space-y-2.5">
                {activeHackathons.map((h) => (
                  <Link
                    key={h._id}
                    to={`/hackathons/${h._id}`}
                    className="block p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:border-sky-300 dark:hover:border-slate-600 transition-all"
                  >
                    <p className="font-semibold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">{h.title}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      <span>{h.mode || 'Online'}</span>
                      <span className="text-sky-600 dark:text-sky-400 font-medium">
                        Team max: {h.teamSizeLimit || 4}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
