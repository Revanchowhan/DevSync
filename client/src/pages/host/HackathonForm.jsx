import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { ArrowLeft, Trophy, Globe, MapPin, Plus, X, Rocket, Sparkles } from 'lucide-react'
import api, { apiError } from '../../api/axios.js'
import { toLocalInput, fromLocalInput } from '../../utils/format.js'
import { PageSpinner } from '../../components/ProtectedRoute.jsx'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

const emptyForm = {
  title: '', description: '', bannerUrl: '',
  startDate: '', endDate: '', registrationDeadline: '', teamFormationDeadline: '',
  mode: 'online', venue: '', prize: '', teamSizeLimit: 4, requiredSkills: [],
}

export default function HackathonForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [skillInput, setSkillInput] = useState('')

  useEffect(() => {
    if (!isEdit) return
    ;(async () => {
      try {
        const { data } = await api.get(`/hackathons/${id}`)
        const h = data.hackathon
        setForm({
          title: h.title || '',
          description: h.description || '',
          bannerUrl: h.bannerUrl || '',
          startDate: toLocalInput(h.startDate),
          endDate: toLocalInput(h.endDate),
          registrationDeadline: toLocalInput(h.registrationDeadline),
          teamFormationDeadline: toLocalInput(h.teamFormationDeadline),
          mode: h.mode || 'online',
          venue: h.venue || '',
          prize: h.prize || '',
          teamSizeLimit: h.teamSizeLimit || 4,
          requiredSkills: h.requiredSkills || [],
        })
      } catch (err) {
        toast.error(apiError(err, 'Could not load hackathon.'))
        navigate('/host')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, isEdit, navigate])

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const addSkill = () => {
    const s = skillInput.trim()
    if (!s) return
    if (form.requiredSkills.some((x) => x.toLowerCase() === s.toLowerCase())) {
      setSkillInput('')
      return
    }
    setForm((f) => ({ ...f, requiredSkills: [...f.requiredSkills, s] }))
    setSkillInput('')
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required.'
    if (!form.description.trim()) e.description = 'Description is required.'
    if (!form.startDate) e.startDate = 'Start date is required.'
    if (!form.endDate) e.endDate = 'End date is required.'
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      e.endDate = 'End date must be after start date.'
    }
    if (!form.registrationDeadline) e.registrationDeadline = 'Registration deadline is required.'
    if (!form.teamFormationDeadline) e.teamFormationDeadline = 'Team formation deadline is required.'
    if (form.mode === 'offline' && !form.venue.trim()) e.venue = 'Venue is required for in-person events.'
    if (!form.teamSizeLimit || Number(form.teamSizeLimit) < 2) e.teamSizeLimit = 'Squad size must be at least 2.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev) => {
    ev.preventDefault()
    if (!validate()) {
      toast.error('Please fix the highlighted fields.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        bannerUrl: form.bannerUrl.trim() || undefined,
        startDate: fromLocalInput(form.startDate),
        endDate: fromLocalInput(form.endDate),
        registrationDeadline: fromLocalInput(form.registrationDeadline),
        teamFormationDeadline: fromLocalInput(form.teamFormationDeadline),
        mode: form.mode,
        venue: form.venue.trim(),
        prize: form.prize.trim(),
        teamSizeLimit: Number(form.teamSizeLimit),
        requiredSkills: form.requiredSkills,
      }
      if (isEdit) {
        await api.put(`/hackathons/${id}`, payload)
        toast.success('Hackathon updated ✨')
        navigate(`/host/hackathons/${id}`)
      } else {
        const { data } = await api.post('/hackathons', payload)
        const newId = data.hackathon?._id || data._id
        toast.success('Hackathon launched! 🚀')
        navigate(newId ? `/host/hackathons/${newId}` : '/host')
      }
    } catch (err) {
      toast.error(apiError(err, 'Could not save hackathon.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageSpinner />

  const field = (key, label, node, hint) => (
    <div>
      <label className="label" htmlFor={key}>{label}</label>
      {node}
      {errors[key] && <p className="error-text">{errors[key]}</p>}
      {hint && !errors[key] && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/host" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-semibold transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Host Dashboard</span>
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {isEdit ? 'Edit Hackathon' : 'Launch New Hackathon'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Configure competition details, timeline, squad capacity, and target skills.
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={submit}
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-card space-y-5"
        noValidate
      >
        {field('title', 'Competition Title *', (
          <input id="title" className="input text-sm" placeholder="e.g. Stanford AI Spring Hackathon 2026" value={form.title} onChange={(e) => set('title', e.target.value)} />
        ))}

        {field('description', 'Description & Problem Themes *', (
          <textarea id="description" rows={4} className="input text-sm resize-none" placeholder="36 hours to build generative agent solutions. Open to all students..." value={form.description} onChange={(e) => set('description', e.target.value)} />
        ))}

        {field('bannerUrl', 'Banner Image URL (Optional)', (
          <input id="bannerUrl" className="input text-xs" placeholder="https://images.unsplash.com/..." value={form.bannerUrl} onChange={(e) => set('bannerUrl', e.target.value)} />
        ), 'Optional — if omitted, a clean abstract brand banner is displayed.')}

        <div className="grid sm:grid-cols-2 gap-4">
          {field('startDate', 'Event Starts *', (
            <input id="startDate" type="datetime-local" className="input text-xs" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
          ))}
          {field('endDate', 'Event Concludes *', (
            <input id="endDate" type="datetime-local" className="input text-xs" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
          ))}
          {field('registrationDeadline', 'Registration Deadline *', (
            <input id="registrationDeadline" type="datetime-local" className="input text-xs" value={form.registrationDeadline} onChange={(e) => set('registrationDeadline', e.target.value)} />
          ))}
          {field('teamFormationDeadline', 'Squad Formation Deadline *', (
            <input id="teamFormationDeadline" type="datetime-local" className="input text-xs" value={form.teamFormationDeadline} onChange={(e) => set('teamFormationDeadline', e.target.value)} />
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {field('mode', 'Event Format', (
            <div className="grid grid-cols-2 gap-2">
              {['online', 'offline'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => set('mode', m)}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold capitalize transition-all cursor-pointer border ${
                    form.mode === m
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-500 dark:text-indigo-300 shadow-subtle'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {m === 'online' ? '🌐 Online' : '📍 In-Person'}
                </button>
              ))}
            </div>
          ))}
          {field('teamSizeLimit', 'Max Squad Size *', (
            <input id="teamSizeLimit" type="number" min={2} max={10} className="input text-xs" value={form.teamSizeLimit} onChange={(e) => set('teamSizeLimit', e.target.value)} />
          ))}
        </div>

        {form.mode === 'offline' && field('venue', 'Physical Venue *', (
          <input id="venue" className="input text-sm" placeholder="e.g. Engineering Hall B, Campus Center" value={form.venue} onChange={(e) => set('venue', e.target.value)} />
        ))}

        {field('prize', 'Prizes & Incentives', (
          <input id="prize" className="input text-sm" placeholder="e.g. $10,000 Prize Pool + Fast-Track Mentorship" value={form.prize} onChange={(e) => set('prize', e.target.value)} />
        ))}

        <div>
          <span className="label">Recommended Competitor Skills</span>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {form.requiredSkills.map((s) => (
              <span key={s} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-lg flex items-center gap-1 font-medium">
                {s}
                <button type="button" onClick={() => setForm((f) => ({ ...f, requiredSkills: f.requiredSkills.filter((x) => x !== s) }))} className="text-slate-400 hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {form.requiredSkills.length === 0 && <span className="text-xs text-slate-400 italic py-1">No skills added yet</span>}
          </div>
          <div className="flex gap-2">
            <input
              className="input flex-1 text-xs"
              placeholder="e.g. React, Python, PyTorch (Press Enter)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
            />
            <Button type="button" onClick={addSkill} variant="secondary" size="sm" className="shrink-0">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add
            </Button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="submit" disabled={saving} className="w-full !py-2.5">
            {saving ? 'Saving...' : isEdit ? 'Save Changes ✨' : 'Launch Competition 🚀'}
          </Button>
        </div>
      </motion.form>
    </div>
  )
}
