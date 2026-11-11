import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, CheckCircle2, AlertCircle, Mail, ArrowRight, Sparkles } from 'lucide-react';
import api, { apiError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user, refreshMe } = useAuth();

  const [loading, setLoading] = useState(!!token);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Request form state
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [requesting, setRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [simulatedToken, setSimulatedToken] = useState(null);

  useEffect(() => {
    if (!token) return;

    (async () => {
      setLoading(true);
      try {
        await api.post('/safety/verify-email/confirm', { token });
        setSuccess(true);
        if (refreshMe) await refreshMe();
      } catch (err) {
        setErrorMsg(apiError(err, 'Verification failed or link expired.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [token, refreshMe]);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setRequesting(true);
    try {
      const { data } = await api.post('/safety/verify-email/request', {
        collegeEmail: emailInput.trim(),
      });
      setRequestSent(true);
      if (data.simulated && data.token) {
        setSimulatedToken(data.token);
      }
    } catch (err) {
      setErrorMsg(apiError(err, 'Failed to send verification email.'));
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="page-shell py-16 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 shadow-card text-center space-y-6"
      >
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-200/60 dark:border-indigo-800/60">
          <GraduationCap className="w-7 h-7" />
        </div>

        {loading ? (
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verifying Student Status...</h2>
            <p className="text-xs text-slate-500 mt-2">Authenticating verification token with campus database.</p>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Campus Verified</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Student Email Verified!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Your verified university student badge is now active on your DevSync profile. Teammates will see your verified badge across Discovery and Teams.
            </p>
            <div className="pt-2">
              <Link to="/profile">
                <Button variant="primary" className="gap-2">
                  <span>Return to Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        ) : errorMsg ? (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Verification Issue</h2>
            <p className="text-xs text-rose-600 dark:text-rose-400">{errorMsg}</p>
            <div className="pt-2">
              <Button variant="secondary" onClick={() => setErrorMsg('')}>
                Try Again
              </Button>
            </div>
          </div>
        ) : requestSent ? (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verification Link Sent</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              We sent a confirmation link to <span className="font-semibold text-slate-900 dark:text-white">{emailInput}</span>. Click the link in your inbox to verify your student status.
            </p>
            {simulatedToken && (
              <div className="bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 p-4 rounded-xl text-left text-xs space-y-2 mt-4">
                <p className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Local Development Simulation:
                </p>
                <p className="text-slate-600 dark:text-slate-400">SMTP service was simulated. Click below to confirm directly:</p>
                <Link
                  to={`/verify-email?token=${simulatedToken}`}
                  className="text-indigo-600 dark:text-indigo-400 underline font-mono text-[11px] block break-all font-semibold"
                >
                  Verify Token Now →
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleRequest} className="space-y-4 text-left">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verify Student Email</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your university student email (.edu or .ac.*) to unlock the official Verified Student Builder badge.
              </p>
            </div>

            <div>
              <label className="label">
                University Email Address
              </label>
              <input
                type="email"
                required
                placeholder="your.name@university.edu"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="input"
              />
            </div>

            <Button type="submit" variant="primary" className="w-full gap-2" disabled={requesting}>
              <span>{requesting ? 'Sending Link...' : 'Send Verification Email'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
}