import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. What DevSync Is',
    body: 'DevSync is a modern university networking and team collaboration platform designed for students to find hackathon teammates with complementary skills and shared project goals. Students can discover peers, build hackathon squads, share project ideas, and manage team tasks. Verified hosts can manage hackathons, review registrations, and communicate event announcements.',
  },
  {
    title: '2. Accepting These Terms',
    body: 'By creating an account or using DevSync, you agree to these Terms of Service and to our Privacy Policy. If you do not agree, do not use the Service. We record the date and time you accept these terms during account registration. If you are registering on behalf of an organization (as a hackathon host), you confirm that you have the authority to bind that entity.',
  },
  {
    title: '3. Eligibility and Account Integrity',
    body: 'You must be at least 16 years old to use DevSync. If you are under 18, you confirm you have permission from a parent or legal guardian. Each student is permitted one active account, and you agree to provide truthful academic and contact details.',
  },
  {
    title: '4. Account Credentials and Security',
    body: 'You are responsible for keeping your login credentials confidential and for all activity conducted under your account. If you sign in via Google OAuth, you are also subject to Google’s terms. Promptly notify us if you suspect unauthorized access.',
  },
  {
    title: '5. Acceptable Conduct',
    body: 'You agree to maintain a respectful, collaborative community. You will not harass or demean teammates, spam invitation requests, harvest platform data, attempt unauthorized access, or misrepresent hackathon submissions.',
  },
  {
    title: '6. User Content and Project Ownership',
    body: 'You retain full ownership of all project ideas, code repositories, and materials you create. By posting on DevSync, you grant DevSync a non-exclusive license to display this content to other students to enable team matching.',
  },
  {
    title: '7. Hackathons Hosted by Third Parties',
    body: 'Hackathons on DevSync are organized by student clubs and universities. DevSync provides the matchmaking and discovery infrastructure but does not judge submissions or distribute prizes directly.',
  },
  {
    title: '8. Disclaimers and Limitations of Liability',
    body: 'DevSync is provided on an "as is" and "as available" basis without warranties of any kind. We strive for high uptime and accurate match calculations, but cannot guarantee uninterrupted service or hackathon outcomes.',
  },
];

export default function Terms() {
  return (
    <div className="page-shell py-12 max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
            <FileText className="w-3.5 h-3.5" />
            <span>Platform Agreement</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Terms of Service</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Last updated: October 2026 · Governing all usage of DevSync platform and services
          </p>
        </div>

        <div className="space-y-4">
          {SECTIONS.map((s) => (
            <section
              key={s.title}
              className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card"
            >
              <h2 className="font-semibold text-base mb-2 text-slate-900 dark:text-white">
                {s.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {s.body}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-8 text-center text-xs text-slate-500 pt-6 border-t border-slate-200 dark:border-slate-800">
          Also review our{' '}
          <Link to="/privacy" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Privacy Policy
          </Link>
          .
        </div>
      </motion.div>
    </div>
  );
}