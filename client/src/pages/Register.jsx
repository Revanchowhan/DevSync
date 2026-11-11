import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Sparkles, Code2, Building2, ArrowRight, ShieldCheck, 
  Clock, Check 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiError } from '../api/axios.js';
import { isValidEmail } from '../utils/format.js';
import { YEAR_OPTIONS } from '../utils/years.js';
import SkillPicker from '../components/SkillPicker.jsx';
import GoogleSignIn from '../components/GoogleSignIn.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';

const studentInit = {
  name: '', email: '', password: '', college: '', branch: '', year: '',
  skills: [], github: '', linkedin: '', bio: '',
};
const hostInit = { name: '', organization: '', email: '', password: '' };

export default function Register() {
  const navigate = useNavigate();
  const { registerStudent, registerHost, googleAuth } = useAuth();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState(studentInit);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [hostPending, setHostPending] = useState(false);

  const switchRole = (r) => {
    setRole(r);
    setForm(r === 'student' ? studentInit : hostInit);
    setErrors({});
  };

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!isValidEmail(form.email)) e.email = 'Enter a valid email address.';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (role === 'student') {
      if (!form.college.trim()) e.college = 'College is required.';
      if (!form.branch.trim()) e.branch = 'Branch is required.';
      if (!form.year) e.year = 'Select your year.';
      if ((form.skills || []).length === 0) e.skills = 'Add at least one skill — it powers your match score.';
    } else {
      if (!form.organization.trim()) e.organization = 'Organization is required.';
    }
    if (!agreed) e.agreed = 'Please accept the Terms of Service and Privacy Policy to continue.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Validates only role-specific fields for Google
  const googleValidate = () => {
    const e = {};
    if (role === 'student') {
      if (!form.college.trim()) e.college = 'College is required.';
      if (!form.branch.trim()) e.branch = 'Branch is required.';
      if (!form.year) e.year = 'Select your year.';
      if ((form.skills || []).length === 0) e.skills = 'Add at least one skill — it powers your match score.';
    } else {
      if (!form.organization.trim()) e.organization = 'Organization is required.';
    }
    if (!agreed) e.agreed = 'Please accept the Terms of Service and Privacy Policy to continue.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goAfterSignup = (user) => {
    navigate(user.role === 'host' ? '/host' : '/hackathons', { replace: true });
  };

  const handleGoogle = async (idToken) => {
    if (!googleValidate()) {
      toast.error('Fill in your academic/organization fields first, then continue with Google.');
      return;
    }
    setSubmitting(true);
    try {
      const payload =
        role === 'student'
          ? {
              idToken,
              mode: 'signup',
              role: 'student',
              college: form.college.trim(),
              branch: form.branch.trim(),
              year: Number(form.year),
              skills: form.skills,
              github: form.github.trim(),
              linkedin: form.linkedin.trim(),
              bio: form.bio.trim(),
            }
          : { idToken, mode: 'signup', role: 'host', organization: form.organization.trim() };
      const result = await googleAuth(payload);
      if (result?.pendingApproval) {
        setHostPending(true);
        return;
      }
      const user = result;
      toast.success(`Welcome aboard, ${user.name.split(' ')[0]}! 🎉`);
      goAfterSignup(user);
    } catch (err) {
      toast.error(apiError(err, 'Google sign-up failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    setSubmitting(true);
    try {
      let user;
      if (role === 'student') {
        user = await registerStudent({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          college: form.college.trim(),
          branch: form.branch.trim(),
          year: Number(form.year),
          skills: form.skills,
          github: form.github.trim(),
          linkedin: form.linkedin.trim(),
          bio: form.bio.trim(),
        });
      } else {
        const result = await registerHost({
          name: form.name.trim(),
          organization: form.organization.trim(),
          email: form.email.trim(),
          password: form.password,
        });
        if (result?.pendingApproval) {
          setHostPending(true);
          return;
        }
        user = result;
      }
      toast.success(`Welcome aboard, ${user.name.split(' ')[0]}! 🎉`);
      navigate(user.role === 'host' ? '/host' : '/hackathons', { replace: true });
    } catch (err) {
      toast.error(apiError(err, 'Registration failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (hostPending) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex flex-col justify-center py-16 px-4">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto text-center">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 shadow-card space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Clock className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Host Request Submitted</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Thanks! Host accounts on DevSync require administrative review to ensure all hackathons hosted are legitimate and secure.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Once approved, you will be able to log in with your email address and publish hackathons immediately.
            </p>
            <Link to="/login" className="block pt-2">
              <Button variant="primary" className="w-full">
                Go to Login
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-2xl mx-auto"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Join the DevSync Network
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Role Toggle Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => switchRole('student')}
            className={`p-3.5 rounded-lg text-left transition-all cursor-pointer flex items-center gap-3 ${
              role === 'student'
                ? 'bg-white dark:bg-slate-900 shadow-xs'
                : 'hover:bg-white/50 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              role === 'student' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'bg-slate-200/60 text-slate-500'
            }`}>
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-xs sm:text-sm font-semibold ${role === 'student' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                Student Builder
              </p>
              <p className="text-[11px] text-slate-400">Find squads & hack</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => switchRole('host')}
            className={`p-3.5 rounded-lg text-left transition-all cursor-pointer flex items-center gap-3 ${
              role === 'host'
                ? 'bg-white dark:bg-slate-900 shadow-xs'
                : 'hover:bg-white/50 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              role === 'host' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'bg-slate-200/60 text-slate-500'
            }`}>
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-xs sm:text-sm font-semibold ${role === 'host' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                Organizer / Host
              </p>
              <p className="text-[11px] text-slate-400">Host hackathons</p>
            </div>
          </button>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-card">
          <AnimatePresence mode="wait">
            <motion.form
              key={role}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              onSubmit={submit}
              className="space-y-4"
              noValidate
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="name">Full Name *</label>
                  <input
                    id="name"
                    className="input"
                    placeholder="Ada Lovelace"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                  />
                  {errors.name && <p className="error-text">{errors.name}</p>}
                </div>

                <div>
                  <label className="label" htmlFor="email">Email *</label>
                  <input
                    id="email"
                    type="email"
                    className="input"
                    placeholder="ada@university.edu"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                  />
                  {errors.email && <p className="error-text">{errors.email}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="label" htmlFor="password">Password *</label>
                  <PasswordInput
                    id="password"
                    autoComplete="new-password"
                    placeholder="Minimum 6 characters"
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                  />
                  {errors.password && <p className="error-text">{errors.password}</p>}
                </div>

                {role === 'student' ? (
                  <>
                    <div>
                      <label className="label" htmlFor="college">College / University *</label>
                      <input
                        id="college"
                        className="input"
                        placeholder="e.g. Stanford University"
                        value={form.college}
                        onChange={(e) => set('college', e.target.value)}
                      />
                      {errors.college && <p className="error-text">{errors.college}</p>}
                    </div>

                    <div>
                      <label className="label" htmlFor="branch">Branch / Major *</label>
                      <input
                        id="branch"
                        className="input"
                        placeholder="e.g. Computer Science"
                        value={form.branch}
                        onChange={(e) => set('branch', e.target.value)}
                      />
                      {errors.branch && <p className="error-text">{errors.branch}</p>}
                    </div>

                    <div>
                      <label className="label" htmlFor="year">Academic Year *</label>
                      <select
                        id="year"
                        className="input"
                        value={form.year}
                        onChange={(e) => set('year', e.target.value)}
                      >
                        <option value="">Select year</option>
                        {YEAR_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      {errors.year && <p className="error-text">{errors.year}</p>}
                    </div>

                    <div>
                      <label className="label" htmlFor="github">GitHub Profile</label>
                      <input
                        id="github"
                        className="input font-mono text-xs"
                        placeholder="https://github.com/username"
                        value={form.github}
                        onChange={(e) => set('github', e.target.value)}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <SkillPicker value={form.skills} onChange={(v) => set('skills', v)} error={errors.skills} />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="label" htmlFor="bio">Short Bio</label>
                      <textarea
                        id="bio"
                        rows={2}
                        className="input resize-none"
                        placeholder="Frontend builder, loves React & AI agents. Open to full-stack hackathon squads."
                        value={form.bio}
                        onChange={(e) => set('bio', e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="sm:col-span-2">
                      <label className="label" htmlFor="organization">Organization or Club *</label>
                      <input
                        id="organization"
                        className="input"
                        placeholder="e.g. ACM Student Chapter or Tech Club"
                        value={form.organization}
                        onChange={(e) => set('organization', e.target.value)}
                      />
                      {errors.organization && <p className="error-text">{errors.organization}</p>}
                    </div>

                    <div className="sm:col-span-2 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      <p className="font-semibold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Host Privileges
                      </p>
                      <p>As a verified organizer, you can publish hackathons, manage squads, and broadcast announcements.</p>
                      <p className="text-slate-400 dark:text-slate-400">Host accounts are reviewed by an administrator before events can be published.</p>
                    </div>
                  </>
                )}
              </div>

              {/* Agreement */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => {
                      setAgreed(e.target.checked);
                      setErrors((er) => ({ ...er, agreed: undefined }));
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                    I agree to DevSync's{' '}
                    <a href="/terms" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 underline">
                      Privacy Policy
                    </a>.
                  </span>
                </label>
                {errors.agreed && <p className="error-text mt-1">{errors.agreed}</p>}
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                className="w-full py-2.5 gap-2 font-semibold shadow-xs"
              >
                {submitting ? 'Creating account...' : `Create ${role === 'student' ? 'Student' : 'Organizer'} Account`}
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-400">or sign up with</span>
                </div>
              </div>

              <div className="flex justify-center">
                <GoogleSignIn text="signup_with" onCredential={handleGoogle} onError={() => toast.error('Google sign-up failed to load.')} />
              </div>
            </motion.form>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}