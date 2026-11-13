import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { normalizeSkills } from '../utils/skills'

export const SKILL_LEVELS = [
  'Beginner',
  'Intermediate',
  'Advanced',
]

export const SKILL_SUGGESTIONS = [
  'React',
  'Node.js',
  'Python',
  'JavaScript',
  'TypeScript',
  'Next.js',
  'MongoDB',
  'PostgreSQL',
  'Express.js',
  'Django',
  'FastAPI',
  'Flask',
  'TensorFlow',
  'PyTorch',
  'Machine Learning',
  'Data Science',
  'Flutter',
  'React Native',
  'Kotlin',
  'Swift',
  'Figma',
  'UI/UX',
  'Tailwind CSS',
  'Docker',
  'AWS',
  'DevOps',
  'GraphQL',
  'Go',
  'Rust',
  'Blockchain',
  'Cybersecurity',
]

const levelColor = {
  Beginner:
    'border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-300',
  Intermediate:
    'border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300',
  Advanced:
    'border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300',
}

export default function SkillPicker({
  value: rawValue,
  onChange,
  withLevel = true,
  label = 'Skills',
  error,
}) {
  const [name, setName] = useState('')
  const [level, setLevel] = useState('Intermediate')

  const value = normalizeSkills(rawValue)

  const add = (skillName, skillLevel = level) => {
    const clean =
      typeof skillName === 'string'
        ? skillName.trim()
        : ''

    if (!clean) return

    const alreadyExists = value.some(
      (skill) =>
        skill.name.toLowerCase() === clean.toLowerCase()
    )

    if (alreadyExists) return

    const newSkill = withLevel
      ? { name: clean, level: skillLevel }
      : { name: clean }

    onChange([...value, newSkill])
    setName('')
  }

  const remove = (skillName) => {
    onChange(
      value.filter((skill) => skill.name !== skillName)
    )
  }

  const remaining = SKILL_SUGGESTIONS
    .filter(
      (suggestion) =>
        !value.some(
          (skill) =>
            skill.name.toLowerCase() ===
            suggestion.toLowerCase()
        )
    )
    .slice(0, 10)

  return (
    <div>
      {label && <span className="label">{label}</span>}

      <div className="flex flex-wrap gap-2 mb-3 min-h-[2rem]">
        <AnimatePresence>
          {value.map((skill) => (
            <motion.span
              key={skill.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`chip ${
                withLevel
                  ? levelColor[skill.level] ||
                    levelColor.Intermediate
                  : 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300'
              }`}
            >
              <span className="font-medium text-xs">
                {skill.name}
              </span>

              {withLevel && (
                <span className="opacity-70 text-[10px]">
                  · {skill.level || 'Intermediate'}
                </span>
              )}

              <button
                type="button"
                onClick={() => remove(skill.name)}
                className="ml-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 transition-colors"
                aria-label={`Remove ${skill.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>

        {value.length === 0 && (
          <span className="text-xs text-slate-400 dark:text-slate-500 italic py-1">
            No skills added yet
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              add(name)
            }
          }}
          placeholder="e.g. React, Python, Figma"
          className="input flex-1 text-xs sm:text-sm"
        />

        {withLevel && (
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className="input !w-auto text-xs sm:text-sm"
          >
            {SKILL_LEVELS.map((skillLevel) => (
              <option
                key={skillLevel}
                value={skillLevel}
                className="bg-white dark:bg-slate-900"
              >
                {skillLevel}
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={() => add(name)}
          className="btn-secondary shrink-0 text-xs sm:text-sm"
        >
          <Plus className="w-4 h-4 mr-1 inline" />
          Add
        </button>
      </div>

      {remaining.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 mr-1">
            Suggestions:
          </span>

          {remaining.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => add(suggestion)}
              className="px-2 py-0.5 rounded-md text-[11px] font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      )}

      {error && <p className="error-text">{error}</p>}
    </div>
  )
}
