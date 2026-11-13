import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Award,
  MapPin,
  Globe,
  Bell,
  Key,
  CheckCircle2,
} from 'lucide-react'
import api, { apiError } from '../api/axios.js'
import { formatDate, formatDateTime, timeAgo } from '../utils/format.js'
import { skillLabels } from '../utils/skills.js'
import CountdownTimer from '../components/CountdownTimer.jsx'
import { PageSpinner } from '../components/ProtectedRoute.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { Button } from '../components/ui/Button'

const safeText = (value, fallback = '') => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-750">
      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-indigo-500" />
        <span>{label}</span>
      </p>
      <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">{safeText(value, '—')}</p>
    </div>
  )
}

export default function HackathonDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [code, setCode] = useState('')
  const [codeBusy, setCodeBusy] = useState(false)
  const [codeTeam, setCodeTeam] = useState(null)
  const [codeError, setCodeError] = useState('')
  const [joinBusy, setJoinBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/hackathons/${id}`)
      setData(response?.data && typeof response.data === 'object' ? response.data : null)

      try {
        const announcementResponse = await api.get(`/hackathons/${id}/announcements`)
        setAnnouncements(Array.isArray(announcementResponse?.data?.announcements) ? announcementResponse.data.announcements : [])
      } catch {
        setAnnouncements([])
      }
    } catch (err) {
      toast.error(apiError(err, 'Could not load hackathon.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const register = async () => {
    setRegistering(true)
    try {
      const { data: response } = await api.post(`/hackathons/${id}/register`)
      toast.success(safeText(response?.message, 'Registered! 🎉'))
      load()
    } catch (err) {
      toast.error(apiError(err, 'Registration failed.'))
    } finally {
      setRegistering(false)
    }
  }

  if (loading) return <PageSpinner />
  if (!data?.hackathon || typeof data.hackathon !== 'object' || Array.isArray(data.hackathon)) {
    return (
      <div className="py-16">
        <EmptyState
          icon={Calendar}
          title="Hackathon not found"
          message="This competition may have been removed or deleted."
          actionLabel="Back to hackathons"
          actionTo="/hackathons"
        />
      </div>
    )
  }

  const h = data.hackathon
  const title = safeText(h.title, 'Hackathon')
  const description = safeText(h.description, '')
  const mode = safeText(h.mode, 'online')
  const skills = skillLabels(h.requiredSkills)
  const open = h.status === 'open'
  const canRegister = !data.isRegistered && open

  const lookupCode = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      setCodeError('Enter the invite code your friend shared.')
      return
    }
    setCodeBusy(true)
    setCodeError('')
    setCodeTeam(null)
    try {
      const { data: response } = await api.get(`/teams/by-code/${encodeURIComponent(trimmed)}`)
      const team = response?.team
      if (!team || typeof team !== 'object') {
        setCodeError('Could not find that team.')
        return
      }
      if (String(team.hackathon?._id ?? team.hackathon) !== String(h._id)) {
        setCodeError('That squad is competing in a different hackathon.')
        return
      }
      setCodeTeam(team)
    } catch (err) {
      setCodeError(apiError(err, 'Could not find that team.'))
    } finally {
      setCodeBusy(false)
    }
  }

  const requestJoin = async () => {
    if (!codeTeam?._id) return
    setJoinBusy(true)
    try {
      await api.post('/requests/join', { teamId: codeTeam._id })
      toast.success(`Request sent to ${safeText(codeTeam.name, 'the team')}! The leader will review it.`)
      setCodeTeam(null)
      setCode('')
    } catch (err) {
      toast.error(apiError(err, 'Could not send the request.'))
    } finally {
      setJoinBusy(false)
    }
  }

  const myTeamId = data?.myTeam && typeof data.myTeam === 'object' ? data.myTeam._id : data?.myTeam
  const bannerUrl = safeText(h.bannerUrl, '')

  return (
    <div className="space-y-6">
      <Link to="/hackathons" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-semibold transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Hackathons</span>
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-900 shadow-card">
          {bannerUrl ? (
            <img src={bannerUrl} alt={title} className="w-full h-56 md:h-72 object-cover" />
          ) : (
            <div className="w-full h-56 md:h-72 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
              <Calendar className="w-16 h-16 text-indigo-400/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="flex flex-wrap gap-2 mb-2.5">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${open ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300' : 'border-white/20 bg-white/10 text-white/80'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                {open ? 'REGISTRATION OPEN' : 'REGISTRATION CLOSED'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-white/20 bg-white/10 text-white">
                {mode === 'online' ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                {mode === 'online' ? 'ONLINE' : 'IN-PERSON'}
              </span>
              {data.isRegistered && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-600 text-white">
                  ✓ REGISTERED
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">{title}</h1>
            <p className="mt-2 text-white/80 text-xs md:text-sm max-w-2xl leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card">
              <h2 className="font-semibold text-base text-slate-900 dark:text-white mb-4">Event Details & Schedule</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <InfoRow icon={Calendar} label="Hackathon Starts" value={formatDateTime(h.startDate)} />
                <InfoRow icon={Calendar} label="Hackathon Concludes" value={formatDateTime(h.endDate)} />
                <InfoRow icon={Clock} label="Registration Deadline" value={formatDateTime(h.registrationDeadline)} />
                <InfoRow icon={Users} label="Team Formation Deadline" value={formatDateTime(h.teamFormationDeadline)} />
                <InfoRow icon={Users} label="Registered Builders" value={`${Number(h.participantCount) || 0} students`} />
                <InfoRow icon={Users} label="Formed Teams" value={`${Number(h.teamCount) || 0} squads`} />
                <InfoRow icon={Users} label="Max Team Capacity" value={`${Number(h.teamSizeLimit) || '—'} members`} />
                <InfoRow icon={Award} label="Prizes & Grants" value={safeText(h.prize, 'Prizes & Recognition')} />
                {mode === 'offline' && <InfoRow icon={MapPin} label="Physical Venue" value={safeText(h.venue, 'Campus Auditorium')} />}
              </div>
              {skills.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="label">Recommended Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill) => (
                      <span key={skill} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 px-2.5 py-0.5 rounded-lg font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card">
              <h2 className="font-semibold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Host Announcements</span>
              </h2>
              {announcements.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No host announcements posted yet. Updates will appear here.</p>
              ) : (
                <div className="space-y-3">
                  {announcements.filter((item) => item && typeof item === 'object').map((announcement, index) => (
                    <div key={safeText(announcement._id, `announcement-${index}`)} className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border-l-3 border-indigo-600">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {safeText(announcement.title, 'Announcement')}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-mono shrink-0">{timeAgo(announcement.createdAt)}</span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {safeText(announcement.body, '')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card lg:sticky lg:top-24">
              <CountdownTimer deadline={h.registrationDeadline} label="Registration Deadline" />
              <div className="mt-5 space-y-2.5">
                {data.isRegistered ? (
                  <>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 p-3 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>You are registered for this competition!</span>
                    </div>
                    {myTeamId ? (
                      <Link to={`/teams/${encodeURIComponent(String(myTeamId))}`} className="btn-primary w-full text-center block">
                        Open My Squad Workspace →
                      </Link>
                    ) : (
                      <Link to={`/find-teammates?hackathonId=${encodeURIComponent(String(h._id || ''))}`} className="btn-primary w-full text-center block">
                        Find Teammates →
                      </Link>
                    )}
                  </>
                ) : canRegister ? (
                  <Button onClick={register} disabled={registering} className="w-full !py-2.5">
                    {registering ? 'Registering...' : 'Register for Hackathon 🚀'}
                  </Button>
                ) : (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-500 text-center">
                    Registration is closed for this hackathon.
                  </div>
                )}
                <Link to={`/find-teammates?hackathonId=${encodeURIComponent(String(h._id || ''))}`} className="btn-secondary w-full text-center block">
                  Browse Candidates
                </Link>
              </div>
              <p className="mt-4 text-[11px] text-slate-400 text-center">
                Runs from {formatDate(h.startDate)} to {formatDate(h.endDate)}
              </p>
            </div>

            {data.isRegistered && !myTeamId && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-indigo-600" />
                  <span>Join a Friend's Squad</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5">
                  Have an invite code? Enter it here to request to join their squad.
                </p>
                <div className="flex gap-2">
                  <input
                    value={code}
                    onChange={(event) => setCode(event.target.value.toUpperCase())}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') lookupCode()
                    }}
                    placeholder="e.g. XK7Q2P"
                    maxLength={12}
                    className="input font-mono uppercase tracking-widest text-center text-xs"
                  />
                  <Button onClick={lookupCode} disabled={codeBusy} size="sm" variant="secondary" className="shrink-0">
                    {codeBusy ? '...' : 'Find'}
                  </Button>
                </div>
                {codeError && <p className="mt-2 text-xs text-rose-500 font-medium">{codeError}</p>}
                {codeTeam && (
                  <div className="mt-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700">
                    <p className="font-semibold text-slate-900 dark:text-white text-xs">{safeText(codeTeam.name, 'Team')}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Leader: {safeText(codeTeam.owner?.name, 'Unknown')} · {Number(codeTeam.memberCount) || 0}/{Number(codeTeam.teamSizeLimit) || 0} members
                    </p>
                    {codeTeam.isMember ? (
                      <p className="mt-2.5 text-xs text-emerald-600 font-medium">✓ You are already in this squad.</p>
                    ) : codeTeam.myOtherTeam ? (
                      <p className="mt-2.5 text-xs text-amber-600 font-medium">
                        You are already in “{safeText(codeTeam.myOtherTeam.name, 'another squad')}”.
                      </p>
                    ) : (
                      <Button onClick={requestJoin} disabled={joinBusy || codeTeam.isOpen === false} size="sm" className="w-full mt-2.5">
                        {joinBusy ? 'Sending...' : 'Request to Join'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
