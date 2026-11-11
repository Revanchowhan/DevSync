import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { ShieldCheck, Check, X, Clock, AlertTriangle, Users } from 'lucide-react'
import api, { apiError } from '../../api/axios.js'
import { useAuth } from '../../context/AuthContext.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { Button } from '../../components/ui/Button'

function statusChip(status) {
  if (status === 'approved') return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
  if (status === 'pending') return 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300'
  return 'border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300'
}

function HostRow({ host, busyId, onDecide, showActions }) {
  const busy = busyId === host._id
  return (
    <div className="flex flex-wrap items-center gap-3.5 px-5 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
      <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-subtle">
        {(host.name || 'H').charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate flex items-center gap-2">
          {host.name}
          {host.isAdmin && (
            <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.2 rounded-full">
              ADMIN
            </span>
          )}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
          {host.email} · {host.organization || 'Independent Host'} · Requested {new Date(host.createdAt).toLocaleDateString()}
        </p>
      </div>
      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${statusChip(host.hostStatus)}`}>
        {(host.hostStatus || 'approved').toUpperCase()}
      </span>
      {showActions && !host.isAdmin && (
        <div className="flex gap-1.5">
          {host.hostStatus !== 'approved' && (
            <Button size="sm" onClick={() => onDecide(host, 'approve')} disabled={busy}>
              {busy ? '...' : '✓ Approve'}
            </Button>
          )}
          {host.hostStatus !== 'rejected' && (
            <Button size="sm" variant="danger" onClick={() => onDecide(host, 'reject')} disabled={busy}>
              {busy ? '...' : host.hostStatus === 'approved' ? 'Revoke' : '✕ Reject'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default function HostRequests() {
  const { user } = useAuth()
  const [pending, setPending] = useState([])
  const [hosts, setHosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users/host-requests')
      setPending(data.pending || [])
      setHosts(data.hosts || [])
      setForbidden(false)
    } catch (err) {
      if (err?.response?.status === 403) setForbidden(true)
      else toast.error(apiError(err, 'Could not load host requests.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const decide = async (host, action) => {
    setBusyId(host._id)
    try {
      await api.post(`/users/host-requests/${host._id}/${action}`)
      toast.success(
        action === 'approve'
          ? `${host.name} approved — they can log in and create hackathons now.`
          : `${host.name} ${host.hostStatus === 'approved' ? 'revoked' : 'rejected'}.`
      )
      await load()
    } catch (err) {
      toast.error(apiError(err, 'Could not update host.'))
    } finally {
      setBusyId(null)
    }
  }

  if (!loading && forbidden) {
    return (
      <div className="py-16">
        <EmptyState
          icon={AlertTriangle}
          title="Admin Access Required"
          message="Host approvals are restricted to verified platform administrators."
          actionLabel="Back to Dashboard"
          actionTo="/host"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Host Account Approvals
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Review, verify, or revoke host accounts organizing collegiate hackathons on DevSync.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <span>Pending Approvals</span>
          {pending.length > 0 && (
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </h2>

        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-sm text-slate-500 border border-slate-200/80 dark:border-slate-800">
            Loading host requests...
          </div>
        ) : pending.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-500">
            All caught up! No pending host verification requests.
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden">
            {pending.map((h) => (
              <HostRow key={h._id} host={h} busyId={busyId} onDecide={decide} showActions />
            ))}
          </motion.div>
        )}
      </div>

      <div className="space-y-3 pt-2">
        <h2 className="font-semibold text-base text-slate-900 dark:text-white">All Registered Hosts</h2>
        {loading ? null : hosts.length === 0 ? (
          <EmptyState icon={Users} title="No hosts yet" message="Approved and rejected host accounts will be listed here." />
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden">
            {hosts.map((h) => (
              <HostRow key={h._id} host={h} busyId={busyId} onDecide={decide} showActions />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
