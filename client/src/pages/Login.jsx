import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiError } from '../api/axios.js';
import { isValidEmail } from '../utils/format.js';
import { firstName } from '../utils/skills.js';
import GoogleSignIn from '../components/GoogleSignIn.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import { Button } from '../components/ui/Button.jsx';

function displayName(user) {
  return typeof user?.name === 'string' && user.name.trim() ? user.name.trim().split(/\s+/)[0] : 'builder';
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleAuth } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!isValidEmail(form.email)) nextErrors.email = 'Enter a valid email address.';
    if (!form.password) nextErrors.password = 'Password is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goAfterAuth = (user) => {
    const from = location.state?.from;
    if (from && from !== '/login' && from !== '/register') navigate(from, { replace: true });
    else navigate(user?.role === 'host' ? '/host' : '/hackathons', { replace: true });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const user = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${displayName(user)}! 🚀`);
      goAfterAuth(user);
    } catch (err) {
      toast.error(apiError(err, 'Login failed. Check your credentials.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async (idToken) => {
    try {
      const user = await googleAuth({ idToken, mode: 'login' });
      toast.success(`Welcome back, ${displayName(user)}! 🚀`);
      goAfterAuth(user);
    } catch (err) {
      if (err?.response?.status === 404) toast.error('No account found for this Google email. Please sign up first.');
      else toast.error(apiError(err, 'Google sign-in failed.'));
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3"><Sparkles className="w-3.5 h-3.5" /><span>DevSync Network</span></div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Sign in to access your squad workspace and hackathons.</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-card">
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <label className="label" htmlFor="email">Student or Host Email</label>
              <input id="email" type="email" autoComplete="email" className="input" placeholder="you@university.edu" value={form.email} onChange={(event) => set('email', event.target.value)} />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between"><label className="label" htmlFor="password">Password</label></div>
              <PasswordInput id="password" autoComplete="current-password" placeholder="••••••••" value={form.password} onChange={(event) => set('password', event.target.value)} />
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>
            <Button type="submit" variant="primary" disabled={submitting} className="w-full py-2.5 gap-2 font-semibold shadow-xs">
              {submitting ? 'Signing in...' : <><span>Sign in</span><ArrowRight className="w-4 h-4" /></>}
            </Button>
            <div className="relative my-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800" /></div><div className="relative flex justify-center text-xs"><span className="bg-white dark:bg-slate-900 px-3 text-slate-400">or continue with</span></div></div>
            <div className="flex justify-center"><GoogleSignIn text="signin_with" onCredential={handleGoogle} onError={() => toast.error('Google sign-in failed to load.')} /></div>
          </form>
          <div className="mt-5 p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs space-y-2">
            <p className="font-semibold text-indigo-900 dark:text-indigo-200 text-[11px] uppercase tracking-wider">⚡ Quick Demo Access (1-Click Fill)</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setForm({ email: 'student1@hackmate.demo', password: 'hackmate123' })} className="py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium hover:bg-indigo-50 dark:hover:bg-slate-700 text-center transition-all cursor-pointer">🎓 Student Demo</button>
              <button type="button" onClick={() => setForm({ email: 'host@hackmate.demo', password: 'hackmate123' })} className="py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium hover:bg-indigo-50 dark:hover:bg-slate-700 text-center transition-all cursor-pointer">🏛️ Host Demo</button>
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">Don't have an account yet? <Link to="/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Create an account</Link></div>
        </div>
      </motion.div>
    </div>
  );
}
