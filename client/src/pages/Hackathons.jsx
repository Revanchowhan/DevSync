import React, {
  useEffect,
  useState,
  useCallback,
} from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Trophy,
  Calendar,
  MapPin,
  Globe,
  RotateCcw,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'
import api, {
  apiError,
  toQuery,
} from '../api/axios.js'
import { formatDate } from '../utils/format.js'
import CountdownTimer from '../components/CountdownTimer.jsx'
import {
  HackathonCardSkeleton,
} from '../components/Skeleton.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const text = (value, fallback = '') => {
  if (typeof value === 'string') return value

  if (
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value)
  }

  return fallback
}

function skillList(value) {
  if (!Array.isArray(value)) return []

  return value.flatMap((skill) => {
    if (
      typeof skill === 'string' ||
      typeof skill === 'number'
    ) {
      return [String(skill)]
    }

    if (
      skill &&
      typeof skill === 'object' &&
      typeof skill.name === 'string'
    ) {
      const name = skill.name.trim()
      return name ? [name] : []
    }

    return []
  })
}

function StatusBadge({ status }) {
  const open = status === 'open'

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
        open
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
          : 'border-slate-200 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          open
            ? 'bg-emerald-500 animate-pulse'
            : 'bg-slate-400'
        }`}
      />
      {open ? 'OPEN' : 'CLOSED'}
    </span>
  )
}

function Banner({ url, title }) {
  const imageUrl = text(url)

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={title}
        className="w-full h-44 object-cover"
        loading="lazy"
      />
    )
  }

  return (
    <div className="w-full h-44 bg-gradient-to-tr from-indigo-600/10 via-sky-500/10 to-indigo-600/5 dark:from-slate-800 dark:to-slate-850 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),transparent_38%)]" />

      <div className="relative w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-subtle">
        <Trophy className="w-6 h-6" />
      </div>
    </div>
  )
}

function HackathonCard({ h, index }) {
  const title = text(h?.title, 'Hackathon')
  const description = text(h?.description)
  const skills = skillList(h?.requiredSkills)
  const mode = text(h?.mode)
  const venue = text(h?.venue, 'In-Person')

  const participantCount = Number.isFinite(
    Number(h?.participantCount)
  )
    ? Number(h.participantCount)
    : 0

  const teamSizeLimit = Number.isFinite(
    Number(h?.teamSizeLimit)
  )
    ? Number(h.teamSizeLimit)
    : '—'

  const id = text(h?._id, `hackathon-${index}`)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.05, 0.3),
      }}
    >
      <Link
        to={`/hackathons/${encodeURIComponent(id)}`}
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden block h-full shadow-card hover:shadow-card-lg transition-all"
      >
        <div>
          <div className="relative">
            <Banner
              url={h?.bannerUrl}
              title={title}
            />

            <div className="absolute top-3 left-3 flex gap-2">
              <StatusBadge status={text(h?.status)} />

              {Boolean(h?.isRegistered) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-600 text-white shadow-subtle">
                  ✓ Registered
                </span>
              )}
            </div>
          </div>

          <div className="p-5">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-snug line-clamp-1">
              {title}
            </h3>

            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2rem] leading-relaxed">
              {description}
            </p>

            <div className="mt-3.5">
              <CountdownTimer
                deadline={h?.registrationDeadline}
                compact
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {skills.slice(0, 4).map((skill, skillIndex) => (
                <span
                  key={`${skill}-${skillIndex}`}
                  className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 px-2 py-0.5 rounded font-medium"
                >
                  {skill}
                </span>
              ))}

              {skills.length > 4 && (
                <span className="text-[10px] text-slate-400 py-0.5 px-1 font-medium">
                  +{skills.length - 4}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {formatDate(h?.startDate)} –{' '}
                {formatDate(h?.endDate)}
              </span>
            </span>

            <span className="font-medium text-slate-700 dark:text-slate-300">
              👥 {participantCount} builders
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5">
              {mode === 'online' ? (
                <Globe className="w-3.5 h-3.5 text-sky-500" />
              ) : (
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
              )}

              <span>
                {mode === 'online' ? 'Online' : venue}
              </span>

              <span>
                · Max {teamSizeLimit}
              </span>
            </span>

            <span className="text-indigo-600 dark:text-indigo-400 font-semibold inline-flex items-center gap-0.5">
              Details
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function Hackathons() {
  const [hackathons, setHackathons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filters, setFilters] = useState({
    search: '',
    skill: '',
    status: '',
    from: '',
    to: '',
  })

  const fetchAll = useCallback(
    async (currentFilters = filters) => {
      setLoading(true)
      setError('')

      try {
        const { data } = await api.get(
          `/hackathons?${toQuery(currentFilters)}`
        )

        const safeHackathons = Array.isArray(
          data?.hackathons
        )
          ? data.hackathons.filter(
              (item) =>
                item &&
                typeof item === 'object' &&
                !Array.isArray(item)
            )
          : []

        setHackathons(safeHackathons)
      } catch (err) {
        setError(
          apiError(
            err,
            'Could not load hackathons right now. Please try again.'
          )
        )
        setHackathons([])
      } finally {
        setLoading(false)
      }
    },
    [filters]
  )

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAll(filters)
    }, 350)

    return () => clearTimeout(timer)
  }, [
    filters.search,
    filters.skill,
    filters.status,
    filters.from,
    filters.to,
    fetchAll,
  ])

  const setFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      skill: '',
      status: '',
      from: '',
      to: '',
    })
  }

  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Hackathons Directory
        </h1>

        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Explore upcoming collegiate hackathons, form squads,
          and track countdown deadlines.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-card">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Input
              placeholder="Search hackathons..."
              value={filters.search}
              onChange={(event) =>
                setFilter('search', event.target.value)
              }
            />
          </div>

          <Input
            placeholder="Required skill (e.g. React)..."
            value={filters.skill}
            onChange={(event) =>
              setFilter('skill', event.target.value)
            }
          />

          <select
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
            value={filters.status}
            onChange={(event) =>
              setFilter('status', event.target.value)
            }
          >
            <option value="">All Statuses</option>
            <option value="open">
              Open for Registration
            </option>
            <option value="closed">Closed</option>
          </select>

          <div className="flex gap-2">
            <input
              type="date"
              className="input text-xs !py-1.5 flex-1"
              value={filters.from}
              onChange={(event) =>
                setFilter('from', event.target.value)
              }
              title="Starts after date"
            />

            {hasFilters && (
              <Button
                onClick={clearFilters}
                variant="secondary"
                size="sm"
                className="shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <HackathonCardSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={AlertCircle}
          title="Couldn’t load hackathons"
          message={text(
            error,
            'Could not load hackathons.'
          )}
          actionLabel="Try again"
          onAction={() => fetchAll(filters)}
        />
      ) : hackathons.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No hackathons found"
          message={
            hasFilters
              ? 'Try loosening your filter parameters to explore more competitions.'
              : 'No hackathons are live right now. Check back soon!'
          }
          actionLabel={
            hasFilters ? 'Clear Filters' : undefined
          }
          onAction={hasFilters ? clearFilters : undefined}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hackathons.map((hackathon, index) => (
            <HackathonCard
              key={text(
                hackathon?._id,
                `hackathon-${index}`
              )}
              h={hackathon}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  )
}
