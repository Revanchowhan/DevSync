import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock, Eye, Database, Cookie } from 'lucide-react';

const SECTIONS = [
  {
    icon: Lock,
    title: '1. Information We Collect',
    body: 'Account credentials and profile data: your name, email address, password (stored as a one-way salted bcrypt hash with 12 rounds — we never see or store plain-text passwords), college/university, academic branch, graduation year, verified skills and proficiency levels, interests, preferred roles, project links (GitHub, LinkedIn), and biography. For hackathon hosts, organization details are also maintained.',
  },
  {
    icon: Eye,
    title: '2. How We Use Your Information',
    body: 'DevSync uses your data solely to deliver the team discovery, matchmaking, and hackathon networking platform. This includes calculating explainable skill complementarity scores, facilitating connection requests and team collaboration, and delivering platform notifications. We never sell your personal data, and we do not serve third-party ads.',
  },
  {
    icon: ShieldCheck,
    title: '3. Visibility and Privacy Controls',
    body: 'Your public student profile (displaying your name, university, skills, interests, and past projects) is visible to other authenticated students on DevSync to facilitate finding teammates. Sensitive fields such as email address, account password hashes, and security tokens are strictly kept confidential and never returned by public endpoints. You may also set your profile visibility to "hidden" at any time in Profile Settings.',
  },
  {
    icon: Database,
    title: '4. Service Providers & Infrastructure',
    body: 'DevSync runs on secure cloud infrastructure: Vercel (frontend and serverless API execution) and MongoDB Atlas (encrypted database with TLS 1.3). Infrastructure providers are bound by strict security and confidentiality obligations.',
  },
  {
    icon: Cookie,
    title: '5. Cookies & Local Storage',
    body: 'DevSync stores authentication session tokens and theme preferences using browser storage. No tracking cookies or advertising pixels are used.',
  },
  {
    icon: ShieldCheck,
    title: '6. Data Retention and Account Deletion',
    body: 'Your data is retained for as long as your account remains active. You can edit your profile at any time, or permanently delete your account and associated personal records directly from the danger zone in your Profile.',
  },
  {
    icon: ShieldCheck,
    title: '7. Contact and Inquiries',
    body: 'If you have any questions or requests regarding your data privacy on DevSync, please reach out to privacy@devsync.network.',
  },
];

export default function Privacy() {
  return (
    <div className="page-shell py-12 max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Legal Documentation</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Last updated: October 2026 · Effective for all DevSync student and host accounts
          </p>
        </div>

        <div className="space-y-4">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <section
                key={s.title}
                className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card"
              >
                <h2 className="font-semibold text-base mb-2 text-slate-900 dark:text-white flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                  {s.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-9.5">
                  {s.body}
                </p>
              </section>
            );
          })}
        </div>

        <div className="mt-8 text-center text-xs text-slate-500 pt-6 border-t border-slate-200 dark:border-slate-800">
          Also review our{' '}
          <Link to="/terms" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Terms of Service
          </Link>
          .
        </div>
      </motion.div>
    </div>
  );
}