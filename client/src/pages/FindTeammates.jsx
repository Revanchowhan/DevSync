import React, { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Search,
  Key,
  Users,
  Plus,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react'
import { GithubIcon } from '../components/SocialIcons.jsx'
import api, { apiError, toQuery } from '../api/axios.js'
import { useAuth } from '../context/AuthContext.jsx'
import { skillNames } from '../utils/format.js'
import MatchRing from '../components/MatchRing.jsx'
import Modal from '../components/Modal.jsx'
import SkillPicker from '../components/SkillPicker.jsx'
import { ListSkeleton } from '../components/Skeleton.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

function Avatar({ name, size = 'w-10 h-10 text-sm' }) {
  return (
    <div className={`${size} rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white font-bold shrink-0 shadow-subtle`}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  )
}

function JoinWithCodeCard({ hackathonId }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [found, setFound] = useState(null)
  const [error, setError] = useState('')
  const [joinBusy, setJoinBusy] = useState(false)

  const lookup = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      setError('Enter the invite code your friend shared.')
      return
    }
    setBusy(true)
    setError('')
    setFound(null)
    try {
      const { data } = await api.get(`/teams/by-code/${encodeURIComponent(trimmed)}`)
      if (String(data.team.hackathon._id) !== String(hackathonId)) {
        setError('That team is competing in a different hackathon.')
        return
      }
      setFound(data.team)
    } catch (err) {
      setError(apiError(err, 'Could not find that team.'))
    } finally {
      setBusy(false)
    }
  }

  const requestJoin = async () => {
    if (!found) return
    setJoinBusy(true)
    try {
      await api.post('/requests/join', { teamId: found._id })
      toast.success(`Request sent to ${found.name}! The leader will review it in Requests.`)
      setFound(null)
      setCode('')
    } catch (err) {
      toast.error(apiError(err, 'Could not send the request.'))
    } finally {
      setJoinBusy(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-center border border-dashed border-indigo-200 dark:border-indigo-900/60 shadow-card">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
        <Key className="w-5 h-5" />
      </div>
      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Have a friend's squad code?</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
        Enter the join code here to find their team and request a spot.
      </p>
      <div className="flex gap-2 max-w-xs mx-auto">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter') lookup() }}
          placeholder="e.g. XK7Q2P"
          maxLength={12}
          className="input font-mono uppercase tracking-widest text-center text-xs"
        />
        <Button onClick={lookup} disabled={busy} size="sm" variant="secondary" className="shrink-0">
          {busy ? '...' : 'Find'}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-rose-500 font-medium">{error}</p>}
      {found && (
        <div className="mt-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-left max-w-sm mx-auto border border-slate-200 dark:border-slate-700">
          <p className="font-semibold text-slate-900 dark:text-white text-sm">{found.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Leader: {found.owner?.name} · {found.memberCount}/{found.teamSizeLimit} members
            {found.isOpen === false && ' · Closed'}
          </p>
          {found.isMember ? (
            <p className="mt-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> You are already a member of this team.
            </p>
          ) : found.myOtherTeam ? (
            <p className="mt-2.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
              You are already registered in “{found.myOtherTeam.name}” for this hackathon.
            </p>
          ) : (
            <Button onClick={requestJoin} disabled={joinBusy || found.isOpen === false} size="sm" className="w-full mt-3">
              {joinBusy ? 'Sending...' : 'Request to Join Squad →'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function CreateTeamCard({ hackathonId, onCreated }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', missingSkills: [] })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Team name is required.'
    if (form.missingSkills.length > 10) errs.missingSkills = 'Max 10 missing skills.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSubmitting(true)
    try {
      const { data } = await api.post('/teams', {
        hackathonId,
        name: form.name.trim(),
        description: form.description.trim(),
        missingSkills: form.missingSkills.map((s) => ({ name: s.name })),
      })
      toast.success('Squad created! Now explore candidates. 🎉')
      setOpen(false)
      setForm({ name: '', description: '', missingSkills: [] })
      onCreated(data.team)
    } catch (err) {
      toast.error(apiError(err, 'Could not create team.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-center border border-dashed border-indigo-200 dark:border-indigo-900/60 shadow-card">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
          <Users className="w-5 h-5" />
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">No squad yet for this hackathon</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          Create one, declare the missing skills your team needs, and our matching algorithm will rank candidates.
        </p>
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Create Squad
        </Button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create your team squad" wide>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Team Name *</label>
            <input className="input text-xs" placeholder="e.g. Matrix Builders" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <p className="error-text">{errors.name}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input text-xs resize-none" rows={3} placeholder="What project idea are you tackling? What skills are you looking for?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <SkillPicker
            label="Missing skills we need (max 10)"
            value={form.missingSkills}
            onChange={(v) => setForm({ ...form, missingSkills: v })}
            withLevel={false}
            error={errors.missingSkills}
          />
          <div className="pt-2">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Creating...' : 'Create Team Squad 🚀'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

function RequestModal({ candidate, teamId, onClose, onSent }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    setSending(true)
    try {
      await api.post('/requests', { teamId, toUserId: candidate.user._id, message: message.trim() })
      toast.success(`Request sent to ${candidate.user.name.split(' ')[0]}! 🤝`)
      onSent()
      onClose()
    } catch (err) {
      toast.error(apiError(err, 'Could not send request.'))
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal open={Boolean(candidate)} onClose={onClose} title={`Invite ${candidate?.user.name?.split(' ')[0] || ''} to your team`}>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
        Add a friendly introduction note — candidates respond much quicker when you share your project goals!
      </p>
      <textarea
        className="input text-xs resize-none"
        rows={4}
        maxLength={500}
        placeholder="Hey! We saw your experience in React & ML and think you'd be a great fit for our hackathon project..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="flex gap-2 mt-4 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button variant="ghost" size="sm" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button size="sm" onClick={send} disabled={sending} className="flex-1">
          {sending ? 'Sending...' : 'Send Invitation 🤝'}
        </Button>
      </div>
    </Modal>
  )
}

export default function FindTeammates() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [hackathons, setHackathons] = useState([])
  const [hackathonId, setHackathonId] = useState(params.get('hackathonId') || '')
  const [teams, setTeams] = useState([])
  const [teamId, setTeamId] = useState(params.get('teamId') || '')
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ search: '', skill: '', college: '', sort: 'match' })
  const [requestTarget, setRequestTarget] = useState(null)
  const [sentIds, setSentIds] = useState(new Set())

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/hackathons')
        const mine = (data.hackathons || []).filter((h) => h.isRegistered)
        setHackathons(mine)
        if (!hackathonId && mine.length > 0) setHackathonId(mine[0]._id)
      } catch {
        /* ignore */
      }
    })()
  }, [])

  const loadTeams = useCallback(async () => {
    if (!hackathonId) {
      setTeams([])
      return
    }
    try {
      const { data } = await api.get(`/teams/my?${toQuery({ hackathonId })}`)
      const list = data.teams || []
      setTeams(list)
      if (!teamId || !list.some((t) => t._id === teamId)) {
        setTeamId(list[0]?._id || '')
      }
    } catch (err) {
      toast.error(apiError(err, 'Could not load your teams.'))
    }
  }, [hackathonId])

  useEffect(() => {
    loadTeams()
  }, [loadTeams])

  const loadCandidates = useCallback(async () => {
    if (!hackathonId || !teamId) {
      setCandidates([])
      return
    }
    setLoading(true)
    try {
      const { data } = await api.get(
        `/teams/search/candidates?${toQuery({ hackathonId, teamId, skill: filters.skill, search: filters.search, college: filters.college, sort: 'match' })}`
      )
      let list = data.candidates || []
      if (filters.sort === 'name') {
        list = [...list].sort((a, b) => a.user.name.localeCompare(b.user.name))
      }
      setCandidates(list)
    } catch (err) {
      toast.error(apiError(err, 'Could not load candidates.'))
    } finally {
      setLoading(false)
    }
  }, [hackathonId, teamId, filters.skill, filters.search, filters.college, filters.sort])

  useEffect(() => {
    const id = setTimeout(loadCandidates, 350)
    return () => clearTimeout(id)
  }, [loadCandidates])

  useEffect(() => {
    setParams(
      { ...(hackathonId ? { hackathonId } : {}), ...(teamId ? { teamId } : {}) },
      { replace: true }
    )
  }, [hackathonId, teamId])

  const team = teams.find((t) => t._id === teamId)
  const setF = (k, v) => setFilters((f) => ({ ...f, [k]: v }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Find Hackathon Teammates
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Match candidates against your team's specific skill gaps. Higher score = higher complementarity.
        </p>
      </div>

      {/* Selectors */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-card grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Registered Hackathon</label>
          <select
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15"
            value={hackathonId}
            onChange={(e) => { setHackathonId(e.target.value); setTeamId('') }}
          >
            {hackathons.map((h) => (
              <option key={h._id} value={h._id}>
                {h.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Your Active Squad</label>
          {teams.length > 0 ? (
            <select
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
            >
              {teams.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}{t.isOpen === false ? ' (Closed)' : ''}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-slate-500 py-2.5">Create a team below to begin searching candidates.</p>
          )}
        </div>
      </div>

      {!teamId && hackathonId && (
        <div className="grid gap-6 md:grid-cols-2">
          <CreateTeamCard hackathonId={hackathonId} onCreated={(t) => { setTeams((ts) => [...ts, t]); setTeamId(t._id) }} />
          <JoinWithCodeCard hackathonId={hackathonId} />
        </div>
      )}

      {team && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-600" /> {team.name}
          </span>
          {team.isOpen === false && (
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
              Closed
            </span>
          )}
          <span className="text-slate-500 dark:text-slate-400">
            Missing skills:{' '}
            {(team.missingSkills || []).length > 0 ? (
              (team.missingSkills || []).map((s) => (
                <span key={s.name || s} className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-medium ml-1">
                  {s.name || s}
                </span>
              ))
            ) : (
              <span className="text-slate-400 italic">none declared</span>
            )}
          </span>
          <Link to={`/teams/${team._id}`} className="ml-auto text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Manage Squad →
          </Link>
        </div>
      )}

      {teamId && (
        <>
          {/* Candidate Filters */}
          <div className="grid gap-3 md:grid-cols-4">
            <Input placeholder="Search name..." value={filters.search} onChange={(e) => setF('search', e.target.value)} />
            <Input placeholder="Filter by skill..." value={filters.skill} onChange={(e) => setF('skill', e.target.value)} />
            <Input placeholder="Filter by university..." value={filters.college} onChange={(e) => setF('college', e.target.value)} />
            <select
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15"
              value={filters.sort}
              onChange={(e) => setF('sort', e.target.value)}
            >
              <option value="match">Sort: Best Match</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>
          </div>

          {loading ? (
            <ListSkeleton count={4} />
          ) : candidates.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No candidates found"
              message="All registered builders are either in your team or filtered out. Try widening the search filters."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <AnimatePresence>
                {candidates.map((c, i) => {
                  const u = c.user || {}
                  const sent = sentIds.has(u._id)
                  return (
                    <motion.div
                      key={u._id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.2) }}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-card hover:shadow-card-hover transition-all flex gap-4"
                    >
                      <MatchRing percent={c.matchPercent} size={74} stroke={6} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <Avatar name={u.name} />
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm text-slate-900 dark:text-white truncate">{u.name}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {u.college || u.university || 'Student'}{u.branch ? ` · ${u.branch}` : ''}
                            </p>
                          </div>
                        </div>

                        {(c.matchedSkills || []).length > 0 && (
                          <div className="mt-3">
                            <p className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                              ✓ Fills your gaps
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {c.matchedSkills.map((s) => (
                                <span key={s} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-medium">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {skillNames(u.skills).slice(0, 5).map((s) => (
                            <span key={s} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 px-2 py-0.5 rounded">
                              {s}
                            </span>
                          ))}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          {u.github ? (
                            <a href={u.github.startsWith('http') ? u.github : `https://${u.github}`} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1">
                              <GithubIcon className="w-3.5 h-3.5" /> GitHub
                            </a>
                          ) : <div />}

                          <Button
                            size="sm"
                            variant={sent ? 'secondary' : 'primary'}
                            onClick={() => setRequestTarget(c)}
                            disabled={sent || team?.isOpen === false}
                          >
                            {sent ? '✓ Invited' : 'Send Invite'}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      <RequestModal
        candidate={requestTarget}
        teamId={teamId}
        onClose={() => setRequestTarget(null)}
        onSent={() => requestTarget && setSentIds((s) => new Set(s).add(requestTarget.user._id))}
      />
    </div>
  )
}
