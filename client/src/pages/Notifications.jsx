import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Bell, CheckCheck, Inbox, MessageSquare, Users, Trophy, 
  Sparkles, Check, ArrowRight 
} from 'lucide-react';
import api, { apiError } from '../api/axios.js';
import { timeAgo, NOTIF_ICONS } from '../utils/format.js';
import { ListSkeleton } from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setItems(data.notifications || []);
    } catch (err) {
      toast.error(apiError(err, 'Could not load notifications.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (n) => {
    if (n.read) {
      if (n.link) navigate(n.link);
      return;
    }
    try {
      await api.put(`/notifications/${n._id}/read`);
      setItems((list) => list.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
    } catch {
      /* non-fatal */
    } finally {
      if (n.link) navigate(n.link);
    }
  };

  const markAll = async () => {
    const unreadIds = items.filter((n) => !n.read).map((n) => n._id);
    if (unreadIds.length === 0) return;
    setMarking(true);
    try {
      await Promise.all(unreadIds.map((id) => api.put(`/notifications/${id}/read`)));
      setItems((list) => list.map((x) => ({ ...x, read: true })));
      toast.success('All caught up! ✅');
    } catch {
      toast.error('Could not mark all as read.');
    } finally {
      setMarking(false);
    }
  };

  const unreadCount = items.filter((n) => !n.read).length;

  const filteredItems = items.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  return (
    <div className="page-shell py-8 max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Notifications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Stay updated with invitations, team messages, and event announcements.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAll}
            disabled={marking}
            className="gap-1.5 self-start sm:self-center"
          >
            <CheckCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{marking ? 'Marking...' : 'Mark all read'}</span>
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          All ({items.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            filter === 'unread'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
              filter === 'unread' ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'
            }`}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <ListSkeleton count={4} />
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          message="Team invites, hackathon announcements, and connection updates will appear here."
        />
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence>
            {filteredItems.map((n) => (
              <motion.button
                key={n._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onClick={() => markRead(n)}
                className={`w-full text-left bg-white dark:bg-slate-900 rounded-xl p-4 flex gap-4 items-start transition-all cursor-pointer border ${
                  n.read
                    ? 'border-slate-200/60 dark:border-slate-800/80 opacity-75'
                    : 'border-indigo-200 dark:border-indigo-800/80 shadow-xs ring-1 ring-indigo-500/10'
                } hover:border-indigo-300 dark:hover:border-indigo-700`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                  n.read ? 'bg-slate-100 dark:bg-slate-800' : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600'
                }`}>
                  {NOTIF_ICONS[n.type] || '🔔'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-xs sm:text-sm ${n.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                      {n.title}
                    </span>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                    )}
                  </div>

                  {n.body && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {n.body}
                    </p>
                  )}

                  <span className="inline-block mt-2 text-[11px] font-mono text-slate-400">
                    {timeAgo(n.createdAt)}
                  </span>
                </div>

                {n.link && (
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 self-center" />
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
