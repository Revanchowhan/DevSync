import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Trophy,
  Plus,
  Users,
  Calendar,
  Layers,
  Settings,
  Edit2,
  Trash2,
  Clock,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'
import api, { apiError } from '../../api/axios.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatDate } from '../../utils/format.js'
import { HackathonCardSkeleton } from '../../components/Skeleton.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import Modal from '../../components/Modal.jsx'
import { Button } from '../../components/ui/Button'

function StatCard({ icon: Icon, label, value }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-card"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="font-mono text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">{value}</p>
    </motion.div>
  )
}

export default function HostDashboard() {
  const { user } = useAuth()
  const [hackathons, setHackathons] = useState([])
  const [pendingHosts, setPendingHosts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/hackathons')
      setHackathons(data.hackathons || [])
    } catch (err) {
      toast.error(apiError(err, 'Could not load hackathons.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!user?.isAdmin) return
    api
      .get('/users/host-requests')
      .then(({ data }) => setPendingHosts((data.pending || []).length))
      .catch(() => {})
  }, [user?.isAdmin])

  const doDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/hackathons/${deleteTarget._id}`)
      toast.success(`"${deleteTarget.title}" deleted.`)
      setHackathons((list) => list.filter((h) => h._id !== deleteTarget._id))
    } catch (err) {
      toast.error(apiError(err, 'Could not delete hackathon.'))
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const stats = {
    total: hackathons.length,
    open: hackathons.filter((h) => h.status === 'open').length,
    participants: hackathons.reduce((s, h) => s + (h.participantCount || 0), 0),
    teams: hackathons.reduce((s, h) => s + (h.teamCount || 0), 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Host Control Center{user?.organization ? ` · ${user.organization}` : ''}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your university competitions, teams, announcements, and registrations.
          </p>
        </div>
        <Link to="/host/hackathons/new">
          <Button size="sm" className="shadow-subtle">
            <Plus className="w-4 h-4 mr-1.5" /> Create Hackathon
          </Button>
        </Link>
      </div>

      {user?.isAdmin && pendingHosts > 0 && (
        <Link
          to="/host/requests"
          className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl px-5 py-3.5 flex items-center gap-3 hover:border-amber-400 transition-all text-xs"
        >
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300">
            <strong className="text-slate-900 dark:text-white">{pendingHosts} host account{pendingHosts === 1 ? '' : 's'}</strong>{' '}
            awaiting admin verification before they can organize events.
          </span>
          <span className="ml-auto font-semibold text-amber-700 dark:text-amber-400 shrink-0 inline-flex items-center gap-1">
            Review Approvals <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Trophy} label="Hackathons" value={stats.total} />
        <StatCard icon={Calendar} label="Active Now" value={stats.open} />
        <StatCard icon={Users} label="Participants" value={stats.participants} />
        <StatCard icon={Layers} label="Squads" value={stats.teams} />
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-base text-slate-900 dark:text-white">Your Managed Competitions</h2>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <HackathonCardSkeleton />
            <HackathonCardSkeleton />
          </div>
        ) : hackathons.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No hackathons created yet"
            message="Create your first university hackathon and open student registration."
            actionLabel="+ Create Hackathon"
            actionTo="/host/hackathons/new"
          />
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[680px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200/80 dark:border-slate-800">
                    <th className="px-5 py-3">Hackathon</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Timeline</th>
                    <th className="px-5 py-3">Participants</th>
                    <th className="px-5 py-3">Squads</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {hackathons.map((h) => (
                    <tr key={h._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <Link to={`/host/hackathons/${h._id}`} className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-sm">
                          {h.title}
                        </Link>
                        <p className="text-[11px] text-slate-400 mt-0.5">{h.mode} · Max {h.teamSizeLimit} per squad</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          h.status === 'open'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
                            : 'border-slate-200 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                        }`}>
                          {h.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                        {formatDate(h.startDate)} – {formatDate(h.endDate)}
                      </td>
                      <td className="px-5 py-4 font-mono font-medium text-slate-900 dark:text-white">{h.participantCount ?? 0}</td>
                      <td className="px-5 py-4 font-mono font-medium text-slate-900 dark:text-white">{h.teamCount ?? 0}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link to={`/host/hackathons/${h._id}`} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" title="Manage Squads & Announcements">
                            <Settings className="w-3.5 h-3.5" />
                          </Link>
                          <Link to={`/host/hackathons/${h._id}/edit`} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" title="Edit Event Details">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>
                          <button onClick={() => setDeleteTarget(h)} className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400" title="Delete Hackathon">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete Hackathon?">
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
          <strong className="text-slate-900 dark:text-white">“{deleteTarget?.title}”</strong> will be permanently deleted along with all its teams, registrations, and announcements.
        </p>
        <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mb-4">This action cannot be undone.</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)} className="flex-1">Cancel</Button>
          <Button size="sm" variant="danger" onClick={doDelete} disabled={deleting} className="flex-1">
            {deleting ? 'Deleting...' : 'Confirm Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
