import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Crown,
  Users,
  Copy,
  RefreshCw,
  Edit2,
  Lock,
  Trash2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react'
import api, { apiError } from '../api/axios.js'
import { useAuth } from '../context/AuthContext.jsx'
import { skillNames, formatDateTime } from '../utils/format.js'
import { PageSpinner } from '../components/ProtectedRoute.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Modal from '../components/Modal.jsx'
import SkillPicker from '../components/SkillPicker.jsx'
import { Button } from '../components/ui/Button'

function MemberCard({ m, isOwner, isMe }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 flex gap-3.5 items-start border border-slate-200/80 dark:border-slate-750 shadow-subtle">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white font-bold shrink-0 text-sm shadow-subtle">
        {(m.name || '?').charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{m.name}</p>
          {isOwner && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 px-2 py-0.2 rounded-full">
              <Crown className="w-2.5 h-2.5 text-amber-600" /> Leader
            </span>
          )}
          {isMe && (
            <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 px-2 py-0.2 rounded-full">
              You
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{m.college || m.university || 'Student'}{m.branch ? ` · ${m.branch}` : ''}</p>
        <div className="mt-2.5 flex flex-wrap gap-1">
          {(m.skills || []).map((s) => {
            const sName = typeof s === 'string' ? s : s.name
            const sLevel = typeof s === 'object' ? s.level : null
            return (
              <span key={sName} className="text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-medium">
                {sName} {sLevel && <span className="text-slate-400">· {sLevel}</span>}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function TeamDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '', missingSkills: [] })
  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [codeBusy, setCodeBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/teams/${id}`)
      setTeam(data.team)
    } catch (err) {
      toast.error(apiError(err, 'Could not load team.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  if (loading) return <PageSpinner />
  if (!team) {
    return (
      <div className="page-shell py-16">
        <EmptyState icon={Users} title="Team not found" message="This squad may have been disbanded or removed." actionLabel="Find teammates" actionTo="/find-teammates" />
      </div>
    )
  }

  const isOwner = team.owner === user?._id || team.owner?._id === user?._id
  const members = team.members || []
  const isMember = members.some((m) => String(m._id) === String(user?._id))
  const canViewCode = isOwner || isMember
  const openSpots = team.openSpots ?? Math.max(0, (team.maxSize || members.length) - members.length)
  const skillGap = team.skillGap || []

  const openEdit = () => {
    setEditForm({
      name: team.name || '',
      description: team.description || '',
      missingSkills: (team.missingSkills || []).map((s) => (typeof s === 'string' ? { name: s } : { name: s.name })),
    })
    setEditOpen(true)
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!editForm.name.trim()) {
      toast.error('Team name is required.')
      return
    }
    setSaving(true)
    try {
      const { data } = await api.put(`/teams/${id}`, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        missingSkills: editForm.missingSkills.map((s) => ({ name: s.name })),
      })
      setTeam(data.team || data)
      toast.success('Team updated ✏️')
      setEditOpen(false)
    } catch (err) {
      toast.error(apiError(err, 'Could not update team.'))
    } finally {
      setSaving(false)
    }
  }

  const doConfirm = async () => {
    try {
      if (confirmAction === 'close') {
        await api.post(`/teams/${id}/close`)
        toast.success('Team closed — no more requests accepted.')
        load()
      } else if (confirmAction === 'delete') {
        await api.delete(`/teams/${id}`)
        toast.success('Team disbanded.')
        navigate('/find-teammates')
      }
    } catch (err) {
      toast.error(apiError(err, 'Action failed.'))
    } finally {
      setConfirmAction(null)
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/my-teams" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-semibold transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Teams</span>
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Banner Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{team.name}</h1>
                {team.isOpen === false ? (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                    🔒 Closed
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300">
                    ● Recruiting
                  </span>
                )}
              </div>
              {team.description && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">{team.description}</p>}
              <p className="mt-2 text-xs text-slate-400">
                {team.hackathon?.title ? (
                  <>Competing in: <Link to={`/hackathons/${team.hackathon._id || team.hackathon}`} className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">{team.hackathon.title}</Link></>
                ) : null}
              </p>
            </div>
            {isOwner && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={openEdit} size="sm" variant="secondary">
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
                {team.isOpen !== false && (
                  <Button onClick={() => setConfirmAction('close')} size="sm" variant="secondary">
                    <Lock className="w-3.5 h-3.5 mr-1" /> Close Squad
                  </Button>
                )}
                <Button onClick={() => setConfirmAction('delete')} size="sm" variant="danger">
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Disband
                </Button>
              </div>
            )}
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-3 gap-3 mt-6 max-w-md pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center border border-slate-200/60 dark:border-slate-700/60">
              <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">{members.length}</p>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mt-0.5">Members</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center border border-slate-200/60 dark:border-slate-700/60">
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">{openSpots}</p>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mt-0.5">Open Spots</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center border border-slate-200/60 dark:border-slate-700/60">
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono">{skillGap.length}</p>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mt-0.5">Skill Gaps</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Members list */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card">
              <h2 className="font-semibold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Squad Members ({members.length})</span>
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {members.map((m) => (
                  <MemberCard
                    key={m._id}
                    m={m}
                    isOwner={String(m._id) === String(team.owner?._id || team.owner)}
                    isMe={String(m._id) === String(user?._id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right column: Invite Code & Skill gaps */}
          <div className="space-y-6">
            {canViewCode && team.joinCode && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-dashed border-indigo-200 dark:border-indigo-900/60 shadow-card">
                <h2 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">Squad Invite Code</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Share this invite code with prospective teammates to let them join directly.
                </p>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 py-3.5 text-center border border-slate-200 dark:border-slate-700">
                  <span className="font-mono text-2xl font-bold tracking-[0.25em] text-indigo-600 dark:text-indigo-400">
                    {team.joinCode}
                  </span>
                </div>
                <div className="flex gap-2 mt-3.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      navigator.clipboard?.writeText(team.joinCode)
                      toast.success('Invite code copied to clipboard!')
                    }}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy Code
                  </Button>
                  {isOwner && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={codeBusy}
                      onClick={async () => {
                        if (!window.confirm('Generate a new code? The previous code will stop functioning.')) return
                        setCodeBusy(true)
                        try {
                          const { data } = await api.post(`/teams/${id}/regenerate-code`)
                          setTeam({ ...team, joinCode: data.joinCode })
                          toast.success('New code generated!')
                        } catch (err) {
                          toast.error(apiError(err, 'Could not regenerate code.'))
                        } finally {
                          setCodeBusy(false)
                        }
                      }}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${codeBusy ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card">
              <h2 className="font-semibold text-sm text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Team Skill Gap Analysis</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5">Key missing capabilities your squad still needs:</p>
              {skillGap.length === 0 ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>No gaps — all required skills are covered!</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {skillGap.map((s) => (
                    <span key={s} className="text-xs bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-lg font-medium">
                      ⚠ Needs {s}
                    </span>
                  ))}
                </div>
              )}

              {isOwner && team.isOpen !== false && (
                <Link
                  to={`/find-teammates?hackathonId=${team.hackathon?._id || team.hackathon}&teamId=${team._id}`}
                  className="btn-primary btn-sm w-full mt-4 text-center block"
                >
                  Find Complementary Teammates →
                </Link>
              )}
            </div>

            {(team.missingSkills || []).length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card">
                <h2 className="font-semibold text-slate-900 dark:text-white mb-2 text-xs uppercase tracking-wider text-slate-400">
                  Target Missing Skills
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {(team.missingSkills || []).map((s) => (
                    <span key={s.name || s} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-lg">
                      {s.name || s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Squad Profile" wide>
        <form onSubmit={saveEdit} className="space-y-4">
          <div>
            <label className="label">Team Name *</label>
            <input className="input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          </div>
          <SkillPicker label="Missing skills (max 10)" value={editForm.missingSkills} onChange={(v) => setEditForm({ ...editForm, missingSkills: v })} withLevel={false} />
          <div className="pt-2">
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm modal */}
      <Modal open={Boolean(confirmAction)} onClose={() => setConfirmAction(null)} title={confirmAction === 'close' ? 'Close Squad Recruitment?' : 'Disband Squad?'}>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
          {confirmAction === 'close'
            ? 'Closing recruitment prevents new join requests. Existing members remain active.'
            : 'Disbanding permanently removes this squad and deletes all workspace items.'}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setConfirmAction(null)} className="flex-1">
            Cancel
          </Button>
          <Button
            size="sm"
            variant={confirmAction === 'delete' ? 'danger' : 'primary'}
            onClick={doConfirm}
            className="flex-1"
          >
            {confirmAction === 'close' ? 'Close Squad' : 'Disband Squad'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
