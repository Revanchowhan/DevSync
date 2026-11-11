import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  UserPlus, Users, Check, X, Clock, Inbox, Send, Trash2, 
  Building2, MessageSquare, ArrowRight, ShieldAlert 
} from 'lucide-react';
import api, { apiError, toQuery } from '../api/axios.js';
import { timeAgo } from '../utils/format.js';
import { ListSkeleton } from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';

const statusBadge = (status) => {
  switch (status) {
    case 'accepted':
      return <Badge variant="emerald" className="text-[10px]">Connected</Badge>;
    case 'declined':
      return <Badge variant="rose" className="text-[10px]">Declined</Badge>;
    case 'cancelled':
      return <Badge variant="slate" className="text-[10px]">Cancelled</Badge>;
    default:
      return <Badge variant="amber" className="text-[10px]">Pending</Badge>;
  }
};

function ConnectionCard({ c, subTab, onAction }) {
  const [busy, setBusy] = useState(false);
  const isReceived = subTab === 'received';
  const isAccepted = subTab === 'accepted';
  const other = isReceived ? c.requester : c.recipient;

  const act = async (fn, okMsg) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMsg);
      onAction();
    } catch (err) {
      toast.error(apiError(err, 'Action failed.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card hover:shadow-subtle transition-all flex flex-col sm:flex-row gap-4 items-start justify-between"
    >
      <div className="flex gap-3.5 items-start flex-1 min-w-0">
        {other?.avatarUrl ? (
          <img
            src={other.avatarUrl}
            alt={other?.name}
            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white font-semibold text-base shrink-0 shadow-xs">
            {(other?.name || '?').charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              {isAccepted ? (
                <>Connected with <span className="text-indigo-600 dark:text-indigo-400 font-bold">{other?.name}</span></>
              ) : isReceived ? (
                <><span className="text-indigo-600 dark:text-indigo-400 font-bold">{other?.name}</span> wants to connect</>
              ) : (
                <>Sent connection request to <span className="text-indigo-600 dark:text-indigo-400 font-bold">{other?.name}</span></>
              )}
            </h3>
            {statusBadge(c.status)}
          </div>

          {other?.college && (
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{other.college}{other.branch ? ` · ${other.branch}` : ''}</span>
            </p>
          )}

          {c.message && (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-lg p-2.5 italic">
              "{c.message}"
            </p>
          )}

          <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3" />
            {timeAgo(c.createdAt)}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {c.status === 'pending' && (
          isReceived ? (
            <>
              <Button
                size="sm"
                variant="primary"
                disabled={busy}
                onClick={() => act(() => api.put(`/connections/${c._id}/accept`), `Connected with ${other?.name || 'student'}!`)}
                className="gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => act(() => api.put(`/connections/${c._id}/decline`), 'Connection request declined.')}
                className="gap-1.5 text-slate-600 dark:text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
                Decline
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => act(() => api.delete(`/connections/${c._id}`), 'Connection request cancelled.')}
              className="text-slate-500 hover:text-rose-600"
            >
              Cancel
            </Button>
          )
        )}

        {c.status === 'accepted' && (
          <div className="flex items-center gap-2">
            <Link to="/messages">
              <Button size="sm" variant="outline" className="gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Message
              </Button>
            </Link>
            <button
              disabled={busy}
              onClick={() => act(() => api.delete(`/connections/${c._id}`), 'Connection removed.')}
              className="text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-2 transition-colors cursor-pointer"
              title="Remove Connection"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function RequestCard({ r, tab, onAction }) {
  const [busy, setBusy] = useState(false);
  const other = tab === 'received' ? r.fromUser : r.toUser;
  const teamName = r.team?.name || 'a squad';
  const isJoin = r.kind === 'join';

  const act = async (fn, okMsg) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMsg);
      onAction();
    } catch (err) {
      toast.error(apiError(err, 'Action failed.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card hover:shadow-subtle transition-all flex flex-col sm:flex-row gap-4 items-start justify-between"
    >
      <div className="flex gap-3.5 items-start flex-1 min-w-0">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white font-semibold text-base shrink-0 shadow-xs">
          {(other?.name || '?').charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              {tab === 'received' ? (
                <><span className="text-indigo-600 dark:text-indigo-400 font-bold">{other?.name}</span> wants to join <Link to={`/teams/${r.team?._id}`} className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2">{teamName}</Link></>
              ) : isJoin ? (
                <>You requested to join <Link to={`/teams/${r.team?._id}`} className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2">{teamName}</Link></>
              ) : (
                <>You invited <span className="text-indigo-600 dark:text-indigo-400 font-bold">{other?.name}</span> to <Link to={`/teams/${r.team?._id}`} className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2">{teamName}</Link></>
              )}
            </h3>
            <Badge variant={isJoin ? 'cyan' : 'purple'} className="text-[10px]">
              {isJoin ? 'Join Request' : 'Squad Invitation'}
            </Badge>
            {statusBadge(r.status)}
          </div>

          {other?.college && (
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{other.college}{other.branch ? ` · ${other.branch}` : ''}</span>
            </p>
          )}

          {r.message && (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-lg p-2.5 italic">
              "{r.message}"
            </p>
          )}

          <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3" />
            {timeAgo(r.createdAt)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {r.status === 'pending' && (
          tab === 'received' ? (
            <>
              <Button
                size="sm"
                variant="primary"
                disabled={busy}
                onClick={() => act(() => api.put(`/requests/${r._id}/accept`), `Welcome aboard, ${other?.name?.split(' ')[0]}!`)}
                className="gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => act(() => api.put(`/requests/${r._id}/decline`), 'Request declined.')}
                className="gap-1.5 text-slate-600 dark:text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
                Decline
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => act(() => api.delete(`/requests/${r._id}`), 'Request cancelled.')}
              className="text-slate-500 hover:text-rose-600"
            >
              Cancel
            </Button>
          )
        )}
      </div>
    </motion.div>
  );
}

export default function Requests() {
  const [section, setSection] = useState('connections'); // 'connections' | 'teams'
  const [connSubTab, setConnSubTab] = useState('received'); // 'received' | 'sent' | 'accepted'
  const [teamTab, setTeamTab] = useState('received'); // 'received' | 'sent'

  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (section === 'connections') {
        let statusParam = 'pending';
        let typeParam = connSubTab;
        if (connSubTab === 'accepted') {
          statusParam = 'accepted';
          typeParam = '';
        }
        const query = toQuery({ status: statusParam, type: typeParam });
        const { data } = await api.get(`/connections${query ? `?${query}` : ''}`);
        setConnections(data.connections || []);
      } else {
        const { data } = await api.get(`/requests?${toQuery({ tab: teamTab })}`);
        setRequests(data.requests || []);
      }
    } catch (err) {
      toast.error(apiError(err, 'Could not load requests.'));
    } finally {
      setLoading(false);
    }
  }, [section, connSubTab, teamTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="page-shell py-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Collaboration Inbox</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review peer connection requests and manage hackathon team invitations.
        </p>
      </div>

      {/* Main Section Switcher */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6 max-w-md">
        <button
          onClick={() => setSection('connections')}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
            section === 'connections'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          Peer Connections
        </button>
        <button
          onClick={() => setSection('teams')}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
            section === 'teams'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          Squad Requests
        </button>
      </div>

      {/* Subtabs */}
      {section === 'connections' ? (
        <div className="flex gap-1.5 mb-6">
          {[
            { id: 'received', label: 'Received' },
            { id: 'sent', label: 'Sent' },
            { id: 'accepted', label: 'Connected' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setConnSubTab(t.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                connSubTab === t.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex gap-1.5 mb-6">
          {[
            { id: 'received', label: 'Received' },
            { id: 'sent', label: 'Sent' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTeamTab(t.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                teamTab === t.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* List / Empty States */}
      {loading ? (
        <div className="space-y-3">
          <ListSkeleton count={3} />
        </div>
      ) : section === 'connections' ? (
        connections.length === 0 ? (
          <EmptyState
            icon={<Inbox className="w-8 h-8 text-indigo-500" />}
            title={
              connSubTab === 'received'
                ? 'No incoming connection requests'
                : connSubTab === 'sent'
                ? 'No pending sent connection requests'
                : 'No connections yet'
            }
            message="Discover talented student builders and send requests to build your dream squad."
            actionLabel="Discover Students"
            actionTo="/discover"
          />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {connections.map((c) => (
                <ConnectionCard key={c._id} c={c} subTab={connSubTab} onAction={loadData} />
              ))}
            </AnimatePresence>
          </div>
        )
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-indigo-500" />}
          title={teamTab === 'received' ? 'No incoming squad requests' : 'No outgoing squad requests'}
          message={
            teamTab === 'received'
              ? 'When builders ask to join your hackathon squad, their invites appear here.'
              : 'Head to Hackathons and recruit top teammates for your squad.'
          }
          actionLabel="Explore Hackathons"
          actionTo="/hackathons"
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {requests.map((r) => (
              <RequestCard key={r._id} r={r} tab={teamTab} onAction={loadData} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}