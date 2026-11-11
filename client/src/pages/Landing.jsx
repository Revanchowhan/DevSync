import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users,
  Compass,
  Trophy,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Search,
  MessageSquare,
  Award,
  Layers,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import MatchRing from '../components/MatchRing'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: 'easeOut' },
  }),
}

const steps = [
  {
    n: '01',
    icon: Users,
    title: 'Create Your Profile',
    text: 'Highlight your technical proficiencies, university, preferred roles, and passion areas so teammates know what you bring.',
  },
  {
    n: '02',
    icon: Compass,
    title: 'Discover Complementary Skills',
    text: 'Filter candidates by missing team skills, university, and experience. Complementarity scoring finds your exact gaps.',
  },
  {
    n: '03',
    icon: MessageSquare,
    title: 'Connect & Form Teams',
    text: 'Send connection requests and team invitations with personal context. Manage incoming requests in one centralized hub.',
  },
  {
    n: '04',
    icon: Trophy,
    title: 'Build & Win Hackathons',
    text: 'Collaborate with your squad, track shared tasks, and ship winning hackathon projects with complete team alignment.',
  },
]

const skillCategories = [
  {
    category: 'Full-Stack & Web',
    skills: ['React', 'Next.js', 'Node.js', 'TypeScript', 'Tailwind CSS', 'PostgreSQL'],
  },
  {
    category: 'AI & Data Science',
    skills: ['Python', 'Machine Learning', 'PyTorch', 'NLP', 'Computer Vision', 'Data Analysis'],
  },
  {
    category: 'Systems & Cloud',
    skills: ['Go', 'Rust', 'Docker', 'Kubernetes', 'AWS', 'GCP'],
  },
  {
    category: 'Design & Product',
    skills: ['UI/UX Design', 'Figma', 'Prototyping', 'User Research', 'Pitch Deck'],
  },
]

const whyDevSyncFeatures = [
  {
    icon: Zap,
    title: 'Explainable Matching Engine',
    text: 'We do not just give a random score. We tell you exactly why you match: "You bring Python/ML, they bring React and UI/UX."',
  },
  {
    icon: ShieldCheck,
    title: 'Verified University Students',
    text: 'Connect safely with ambitious, real university peers across colleges who share your dedication and drive.',
  },
  {
    icon: Layers,
    title: 'Skill Complementarity First',
    text: 'Strong teams need different superpowers. DevSync optimizes for diversity in skillsets and alignment in goals.',
  },
  {
    icon: Trophy,
    title: 'Real-Time Deadlines & Hackathons',
    text: 'Live registration countdowns and team formation timers keep you on track so you never miss a submission cutoff.',
  },
  {
    icon: Users,
    title: 'Unified Requests Workspace',
    text: 'Manage hackathon invites, direct connections, and team applications seamlessly in one transparent dashboard.',
  },
  {
    icon: Award,
    title: 'Host Management Hub',
    text: 'Hackathon hosts manage submissions, approve teams, publish instant announcements, and export roster CSVs with ease.',
  },
]

export default function Landing() {
  const { isAuthed } = useAuth()

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* ============ HERO SECTION ============ */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 border-b border-slate-200/80 dark:border-slate-800">
        <div className="page-shell text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-indigo-200/80 bg-indigo-50/80 dark:bg-indigo-950/40 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6 shadow-subtle">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              DevSync 2.0 · University Hackathon Networking & Teammate Discovery
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.15]"
          >
            Find Your People.{' '}
            <span className="text-indigo-600 dark:text-indigo-400">
              Build Winning Teams.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="mt-5 max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed px-4"
          >
            DevSync connects ambitious university students based on skill complementarity. Stop scrambling for hackathon teammates and start building with the right squad.
          </motion.p>

          {/* Hero CTAs */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 px-4"
          >
            {isAuthed ? (
              <>
                <Link
                  to="/discover"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-subtle hover:shadow transition-all inline-flex items-center justify-center gap-2"
                >
                  <span>Explore Builders</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/hackathons"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-subtle transition-all"
                >
                  Browse Hackathons
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-subtle hover:shadow transition-all inline-flex items-center justify-center gap-2"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/hackathons"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-subtle transition-all"
                >
                  Explore Hackathons
                </Link>
              </>
            )}
          </motion.div>

          {/* Live Trust Metrics */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={4}
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Verified university students</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              <span>Skill gap complementarity algorithm</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-500" />
              <span>Direct hackathon integration</span>
            </div>
          </motion.div>

          {/* Product Preview / Mockup using Actual Application Components */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={5}
            className="mt-12 max-w-5xl mx-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-elevated overflow-hidden text-left"
          >
            {/* Mockup browser bar */}
            <div className="bg-slate-50 dark:bg-slate-850 px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="text-xs font-mono text-slate-400 ml-2">devsync.app/discover</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                94% Teammate Match
              </div>
            </div>

            {/* Mockup inner dashboard content */}
            <div className="p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-900/50 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Candidate Card 1 */}
              <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-subtle">
                        AK
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Alex Kim</h4>
                        <p className="text-xs text-slate-500">UC Berkeley · Computer Science</p>
                      </div>
                    </div>
                    <span className="chip border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">
                      94% Match
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                    Full-stack builder passionate about distributed systems and generative AI agents.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="chip border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 text-[11px]">React</span>
                    <span className="chip border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 text-[11px]">Node.js</span>
                    <span className="chip border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 text-[11px]">PostgreSQL</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Superpower: Backend</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">Available</span>
                </div>
              </div>

              {/* Candidate Card 2 */}
              <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-subtle">
                        SR
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Sophia Rodriguez</h4>
                        <p className="text-xs text-slate-500">MIT · Design & Computation</p>
                      </div>
                    </div>
                    <span className="chip border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">
                      91% Match
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                    Product designer and design systems specialist. Turn complex ideas into elegant interfaces.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="chip border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300 text-[11px]">UI/UX</span>
                    <span className="chip border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300 text-[11px]">Figma</span>
                    <span className="chip border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300 text-[11px]">Tailwind</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Superpower: Design</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">Available</span>
                </div>
              </div>

              {/* Match Breakdown Panel */}
              <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-950/80 shadow-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Complementarity Analysis</span>
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>

                  <div className="flex items-center gap-4 my-2">
                    <MatchRing percent={92} size={70} stroke={6} />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">High Team Fit</p>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Your Python/ML pairs with their React & Design skills. Zero skill overlap, 100% gap coverage.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Skills Gap Filled</span>
                        <span className="font-semibold text-slate-900 dark:text-white">38 / 40</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: '95%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Role Compatibility</span>
                        <span className="font-semibold text-slate-900 dark:text-white">19 / 20</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500 rounded-full" style={{ width: '95%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="inline-flex w-full items-center justify-center gap-1.5 bg-indigo-600 text-white text-xs font-semibold py-2 rounded-xl">
                    Invite to Squad
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="page-shell py-16 md:py-20" id="how-it-works">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">Workflow</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">How DevSync Works</h2>
          <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Four straightforward steps to assemble a high-performing squad before submission day.
          </p>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.n}
                className="relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-card hover:shadow-card-hover transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60 shadow-subtle">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-2xl font-bold text-slate-200 dark:text-slate-800 select-none">
                    {s.n}
                  </span>
                </div>
                <h3 className="font-semibold text-base text-slate-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{s.text}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ============ SKILL COMPLEMENTARITY ============ */}
      <section className="border-y border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 py-16 md:py-20">
        <div className="page-shell">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">Talent Diversity</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Complementary Superpowers</h2>
            <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Winning teams need balanced skill sets, not four developers with the exact same profile.
            </p>
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {skillCategories.map((cat) => (
              <div
                key={cat.category}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-card"
              >
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{cat.category}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {cat.skills.map((skill) => (
                    <Badge key={skill} variant="purple" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHY DEVSYNC ============ */}
      <section className="page-shell py-16 md:py-20" id="about">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">Advantages</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Why University Students Choose DevSync</h2>
          <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Engineered specifically for collegiate hackathons and ambitious builders.
          </p>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {whyDevSyncFeatures.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-card hover:shadow-card-hover transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center mb-4 shadow-subtle">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.text}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="page-shell pb-20">
        <div className="rounded-3xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/70 to-white dark:from-slate-900 dark:to-slate-850 p-8 sm:p-14 text-center shadow-card relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Different Skills. Same Goals.{' '}
              <span className="text-indigo-600 dark:text-indigo-400">Stronger Teams.</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Join thousands of university students forming balanced squads and winning hackathons worldwide.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="w-full sm:w-auto px-7 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-subtle hover:shadow transition-all inline-flex items-center justify-center gap-2"
              >
                <span>Create Free Student Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-7 py-3 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-subtle transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
