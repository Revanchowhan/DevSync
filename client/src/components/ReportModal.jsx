import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ShieldAlert, X } from 'lucide-react';
import api, { apiError } from '../api/axios';
import { Button } from './ui/Button';

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or unsolicited promotions' },
  { value: 'harassment', label: 'Harassment, bullying, or hate speech' },
  { value: 'inappropriate_content', label: 'Inappropriate or harmful content' },
  { value: 'fake_profile', label: 'Fake identity or impersonation' },
  { value: 'other', label: 'Other community guideline violations' },
];

export default function ReportModal({ targetUser, isOpen, onClose }) {
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/safety/report', {
        targetUserId: targetUser._id || targetUser.id,
        reason,
        details: details.trim(),
      });
      toast.success('Report submitted. Thank you for keeping DevSync safe!');
      onClose();
    } catch (err) {
      toast.error(apiError(err, 'Failed to submit report.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-elevated space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" /> Report User: {targetUser.name}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Our team reviews reported accounts against our safety policies. Please specify what occurred:
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Details (Optional)
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              placeholder="Provide context or links..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl p-2.5 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 resize-none placeholder-slate-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
