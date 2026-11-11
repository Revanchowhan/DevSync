import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Ban, X } from 'lucide-react';
import api, { apiError } from '../api/axios';
import { Button } from './ui/Button';

export default function BlockModal({ targetUser, isOpen, onClose, onBlocked }) {
  const [blocking, setBlocking] = useState(false);

  if (!isOpen || !targetUser) return null;

  const handleBlock = async () => {
    setBlocking(true);
    try {
      await api.post('/safety/block', {
        targetUserId: targetUser._id || targetUser.id,
      });
      toast.success(`${targetUser.name} has been blocked.`);
      if (onBlocked) onBlocked();
      onClose();
    } catch (err) {
      toast.error(apiError(err, 'Failed to block user.'));
    } finally {
      setBlocking(false);
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
            <Ban className="w-4 h-4 text-rose-500" /> Block {targetUser.name}?
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <p className="font-medium text-slate-800 dark:text-slate-200">When you block this builder:</p>
          <ul className="list-disc pl-4 space-y-1 text-slate-500 dark:text-slate-400">
            <li>Existing connections and team invitations will be deleted immediately.</li>
            <li>Direct messaging will be disabled in both directions.</li>
            <li>Neither of you will appear in each other's Discover searches or recommendations.</li>
          </ul>
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={handleBlock}
            disabled={blocking}
          >
            {blocking ? 'Blocking...' : 'Confirm Block'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
