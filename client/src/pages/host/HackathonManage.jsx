import React, { useEffect, useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Users,
  Layers,
  Bell,
  Download,
  Search,
  Edit2,
  Calendar,
  Send,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import { GithubIcon, LinkedinIcon } from '../../components/SocialIcons.jsx'
import api, { apiError, toQuery } from '../../api/axios.js'
import { formatDate, formatDateTime, timeAgo, skillNames } from '../../utils/format.js'
import { PageSpinner } from '../../components/ProtectedRoute.jsx'
import { ListSkeleton } from '../../components/Skeleton.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

function ParticipantsTab({ hackathonId }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ search: '', skill: '', college: '' })
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/hackathons/${hackathonId}/participants?${toQuery(filters)}`)
      setRows(data.participants || [])
    } catch (err) {
      toast.error(apiError(err, 'Could not load participants.'))
    } finally {
      setLoading(false)
    }
  }, [hackathonId, filters.search, filters.skill, filters.college])

  useEffect(() => {
    const id = setTimeout(load, 350)
    return () => clearTimeout(id)
  }, [load])

  const exportCsv = async () => {
    setExporting(true)
    try {
      const res = await api.get(`/hackathons/${hackathonId}/participants/export`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `hackathon-${hackathonId}-participants.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Roster CSV downloaded!')
    } catch (err) {
      toast.error(apiError(err, 'CSV export failed.'))
    } finally {
      setExporting(false)
    }
  }

  const setF = (k, v) => setFilters((f) => ({ ...f, [k]: v }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Input className="!w-auto flex-1 min-w-[10rem]" placeholder="Search name or email..." value={filters.search} onChange={(e) => setF('search', e.target.value)} />
        <Input className="!w-auto flex-1 min-w-[10rem]" placeholder="Filter by skill..." value={filters.skill} onChange={(e) => setF('skill', e.target.value)} />
        <Input className="!w-auto flex-1 min-w-[10rem]" placeholder="Filter by college..." value={filters.college} onChange={(e) => setF('college', e.target.value)} />
        <Button onClick={exportCsv} disabled={exporting} size="sm" variant="secondary" className="shrink-0">
          <Download className="w-4 h-4 mr-1.5" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      {loading ? (
        <ListSkeleton count={4} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Users} title="No participants found" message="No students have registered yet or match the filters." />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[700px] text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80 dark:border-slate-800">
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3">University</th>
                  <th className="px-5 py-3">Verified Skills</th>
                  <th className="px-5 py-3">Profiles</th>
                  <th className="px-5 py-3">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{p.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{p.email}</p>
                      <p className="text-[10px] text-slate-500">{p.branch}{p.year ? ` · Yr ${p.year}` : ''}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{p.college || '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {skillNames(p.skills).slice(0, 4).map((s) => (
                          <span key={s} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
                            {s}
                          </span>
                        ))}
                        {skillNames(p.skills).length > 4 && (
                          <span className="text-[10px] text-slate-400 py-0.5">+{skillNames(p.skills).length - 4}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 text-slate-400">
                        {p.github && (
                          <a href={p.github.startsWith('http') ? p.github : `https://${p.github}`} target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white" title="GitHub">
                            <GithubIcon className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {p.linkedin && (
                          <a href={p.linkedin.startsWith('http') ? p.linkedin : `https://${p.linkedin}`} target="_blank" rel="noreferrer" className="hover:text-indigo-600" title="LinkedIn">
                            <LinkedinIcon className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {!p.github && !p.linkedin && <span>—</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{formatDate(p.registeredAt || p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
            Total {rows.length} registered participant{rows.length === 1 ? '' : 's'}
          </div>
        </div>
      )}
    </div>
  )
}

function TeamsTab({ hackathonId }) {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/hackathons/${hackathonId}/teams`)
        setTeams(data.teams || [])
      } catch (err) {
        toast.error(apiError(err, 'Could not load teams.'))
      } finally {
        setLoading(false)
      }
    })()
  }, [hackathonId])

  if (loading) return <ListSkeleton count={4} />
  if (teams.length === 0) {
    return <EmptyState icon={Layers} title="No squads formed yet" message="Teams will appear here once participants assemble squads." />
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {teams.map((t) => (
        <div key={t._id} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{t.name}</h3>
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
              t.isOpen === false
                ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
            }`}>
              {t.isOpen === false ? '🔒 Full Squad' : `● ${t.members?.length || 0} Members`}
            </span>
          </div>
          <div className="space-y-2">
            {(t.members || []).map((m) => (
              <div key={m._id} className="flex items-center gap-2.5 text-xs">
                <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {(m.name || '?').charAt(0).toUpperCase()}
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-medium truncate">{m.name}</span>
                <span className="text-[10px] text-slate-400 truncate ml-auto">{skillNames(m.skills).slice(0, 3).join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function AnnouncementsTab({ hackathonId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', body: '' })
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/hackathons/${hackathonId}/announcements`)
      setItems(data.announcements || [])
    } catch (err) {
      toast.error(apiError(err, 'Could not load announcements.'))
    } finally {
      setLoading(false)
    }
  }, [hackathonId])

  useEffect(() => {
    load()
  }, [load])

  const publish = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Title and body are required.')
      return
    }
    setSending(true)
    try {
      const { data } = await api.post(`/hackathons/${hackathonId}/announcements`, {
        title: form.title.trim(),
        body: form.body.trim(),
      })
      setItems((list) => [data.announcement || data, ...list])
      setForm({ title: '', body: '' })
      toast.success('Announcement published and sent to all participants!')
    } catch (err) {
      toast.error(apiError(err, 'Could not publish announcement.'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <form onSubmit={publish} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-card h-fit lg:sticky lg:top-24 space-y-3">
        <div>
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-indigo-600" />
            <span>Publish Host Announcement</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Broadcast an update to every registered participant.</p>
        </div>
        <Input placeholder="Announcement Title (e.g. Mentor Hours Announced)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} />
        <textarea className="input text-xs resize-none" rows={4} placeholder="Announcement details, links, submission instructions..." value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        <Button type="submit" disabled={sending} className="w-full">
          {sending ? 'Publishing...' : 'Publish Update 📢'}
        </Button>
      </form>

      <div>
        {loading ? (
          <ListSkeleton count={3} />
        ) : items.length === 0 ? (
          <EmptyState icon={Bell} title="No announcements published" message="Post updates, guidelines, or judging criteria for competitors." />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {items.map((a) => (
                <motion.div
                  key={a._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-card border-l-3 !border-l-indigo-600"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">{a.title}</h4>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">{timeAgo(a.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{a.body}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

const TABS = [
  { id: 'participants', label: 'Participants', icon: Users },
  { id: 'teams', label: 'Squads', icon: Layers },
  { id: 'announcements', label: 'Announcements', icon: Bell },
]

export default function HackathonManage() {
  const { id } = useParams()
  const [hackathon, setHackathon] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('participants')

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await api.get(`/hackathons/${id}`)
        setHackathon(data.hackathon)
      } catch (err) {
        toast.error(apiError(err, 'Could not load hackathon.'))
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  if (loading) return <PageSpinner />
  if (!hackathon) {
    return (
      <div className="py-16">
        <EmptyState icon={Calendar} title="Hackathon not found" actionLabel="Back to dashboard" actionTo="/host" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/host" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-semibold transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Host Dashboard</span>
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{hackathon.title}</h1>
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
              hackathon.status === 'open'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
                : 'border-slate-200 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
            }`}>
              {hackathon.status?.toUpperCase()}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {formatDateTime(hackathon.startDate)} – {formatDateTime(hackathon.endDate)} · {hackathon.participantCount ?? 0} participants · {hackathon.teamCount ?? 0} squads
          </p>
        </div>
        <Link to={`/host/hackathons/${id}/edit`}>
          <Button size="sm" variant="secondary">
            <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Details
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                active
                  ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 shadow-subtle'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'participants' && <ParticipantsTab hackathonId={id} />}
          {tab === 'teams' && <TeamsTab hackathonId={id} />}
          {tab === 'announcements' && <AnnouncementsTab hackathonId={id} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
