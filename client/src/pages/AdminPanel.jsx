import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Building2, Check, Clock3, RefreshCw, ShieldCheck, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { apiError } from '../api/axios.js'

const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All hosts' },
]

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300',
    approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300',
    rejected: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/40 dark:text-rose-300',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${styles[status] || 'bg-slate-100 text-slate-600 ring-slate-500/20'}`}>
      {status || 'unknown'}
    </span>
  )
}

function SummaryCard({ label, value, icon: Icon, tone }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

export default function AdminPanel() {
  const [hosts, setHosts] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [workingId, setWorkingId] = useState(null)
  const [loadError, setLoadError] = useState('')

  const loadHosts = useCallback(async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true)
    else setLoading(true)
    setLoadError('')
    try {
      const { data } = await api.get('/users/host-requests')
      setHosts(Array.isArray(data.hosts) ? data.hosts : [])
    } catch (error) {
      const message = apiError(error, 'Could not load host accounts. Please try again.')
      setLoadError(message)
      if (quiet) toast.error(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadHosts()
  }, [loadHosts])

  const counts = useMemo(() => hosts.reduce((result, host) => {
    if (Object.hasOwn(result, host.hostStatus)) result[host.hostStatus] += 1
    return result
  }, { pending: 0, approved: 0, rejected: 0 }), [hosts])

  const visibleHosts = useMemo(() => {
    const filtered = filter === 'all' ? hosts : hosts.filter((host) => host.hostStatus === filter)
    return [...filtered].sort((a, b) => {
      if (a.hostStatus === 'pending' && b.hostStatus !== 'pending') return -1
      if (b.hostStatus === 'pending' && a.hostStatus !== 'pending') return 1
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    })
  }, [hosts, filter])

  const decideHost = async (host, decision) => {
    const verb = decision === 'approve' ? 'approve' : 'reject'
    if (!window.confirm(`${verb === 'approve' ? 'Approve' : 'Reject'} ${host.name}'s host account?`)) return

    setWorkingId(host._id)
    try {
      const url = `/users/host-requests/${host._id}/${decision}`
      if (decision === 'reject') {
        const note = window.prompt('Optional reason to share with the host:', '')
        if (note === null) {
          setWorkingId(null)
          return
        }
        await api.post(url, { note })
      } else {
        await api.post(url)
      }
      toast.success(`Host account ${decision === 'approve' ? 'approved' : 'rejected'}.`)
      await loadHosts({ quiet: true })
    } catch (error) {
      toast.error(apiError(error, `Could not ${verb} this host account.`))
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-6 py-7 text-white shadow-lg sm:px-8 sm:py-9">
        <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-100">
              <ShieldCheck className="h-4 w-4" /> Admin workspace
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Platform overview</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Review host applications and monitor account approval status.</p>
          </div>
          <button
            type="button"
            onClick={() => loadHosts({ quiet: true })}
            disabled={refreshing || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Host account summary">
        <SummaryCard label="Total host accounts" value={hosts.length} icon={Building2} tone="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300" />
        <SummaryCard label="Awaiting review" value={counts.pending} icon={Clock3} tone="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300" />
        <SummaryCard label="Approved" value={counts.approved} icon={Check} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300" />
        <SummaryCard label="Rejected" value={counts.rejected} icon={X} tone="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-200/80 px-5 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Host accounts</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Approve applications to allow hosts to manage hackathons.</p>
          </div>
          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800" role="tablist" aria-label="Filter host accounts">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                onClick={() => setFilter(item.id)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${filter === item.id ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}
              >
                {item.label}{item.id === 'pending' && counts.pending > 0 ? ` (${counts.pending})` : ''}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-6" aria-label="Loading host accounts">
            {[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-rose-500" />
            <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Could not load host accounts</p>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{loadError}</p>
            <button type="button" className="btn-secondary btn-sm mt-4" onClick={() => loadHosts()}>Try again</button>
          </div>
        ) : visibleHosts.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800"><Building2 className="h-5 w-5" /></div>
            <p className="mt-4 font-semibold text-slate-800 dark:text-slate-200">{filter === 'pending' ? 'No host applications waiting' : 'No host accounts found'}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">New host applications will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {visibleHosts.map((host) => (
              <article key={host._id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                    {(host.name || 'H').trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate font-semibold text-slate-900 dark:text-white">{host.name || 'Unnamed host'}</h4>
                      <StatusBadge status={host.hostStatus} />
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{host.email || 'No email'}{host.organization ? ` · ${host.organization}` : ''}</p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Applied {formatDate(host.createdAt)}</p>
                  </div>
                </div>
                {host.hostStatus === 'pending' && (
                  <div className="flex shrink-0 gap-2 sm:pl-4">
                    <button
                      type="button"
                      onClick={() => decideHost(host, 'reject')}
                      disabled={workingId === host._id}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/30"
                    >
                      <X className="h-4 w-4" /> Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => decideHost(host, 'approve')}
                      disabled={workingId === host._id}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" /> Approve
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
