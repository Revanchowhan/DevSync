import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users,
  Plus,
  Link as LinkIcon,
  CheckSquare,
  ExternalLink,
  ShieldAlert,
  Crown,
  LogOut,
  X,
  Trash2,
  CheckCircle2,
  Clock,
  Circle,
  Sparkles,
} from 'lucide-react';
import api, { apiError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import EmptyState from '../components/EmptyState';
import { ListSkeleton } from '../components/Skeleton';

export default function MyTeams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  // Modals
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskStatus, setTaskStatus] = useState('todo');

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [newLeaderId, setNewLeaderId] = useState('');

  const fetchMyTeams = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/teams/my');
      setTeams(data.teams || []);
      if (data.teams && data.teams.length > 0 && !selectedTeam) {
        setSelectedTeam(data.teams[0]);
      }
    } catch (err) {
      toast.error(apiError(err, 'Failed to fetch your teams.'));
    } finally {
      setLoading(false);
    }
  }, [selectedTeam]);

  useEffect(() => {
    fetchMyTeams();
  }, [fetchMyTeams]);

  const fetchWorkspace = useCallback(async (teamId) => {
    setWorkspaceLoading(true);
    try {
      const { data } = await api.get(`/teams/${teamId}/workspace`);
      setWorkspace(data.workspace);
    } catch (err) {
      toast.error(apiError(err, 'Could not load workspace.'));
    } finally {
      setWorkspaceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTeam?._id) {
      fetchWorkspace(selectedTeam._id);
    }
  }, [selectedTeam, fetchWorkspace]);

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!linkTitle.trim() || !linkUrl.trim()) return;
    try {
      await api.post(`/teams/${selectedTeam._id}/links`, {
        title: linkTitle.trim(),
        url: linkUrl.trim(),
      });
      toast.success('Link added to team workspace!');
      setLinkModalOpen(false);
      setLinkTitle('');
      setLinkUrl('');
      fetchWorkspace(selectedTeam._id);
    } catch (err) {
      toast.error(apiError(err, 'Failed to add link.'));
    }
  };

  const handleDeleteLink = async (linkId) => {
    try {
      await api.delete(`/teams/${selectedTeam._id}/links/${linkId}`);
      toast.success('Link removed.');
      fetchWorkspace(selectedTeam._id);
    } catch (err) {
      toast.error(apiError(err, 'Failed to remove link.'));
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    try {
      await api.post(`/teams/${selectedTeam._id}/tasks`, {
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        assignee: taskAssignee || null,
        status: taskStatus,
      });
      toast.success('Task created!');
      setTaskModalOpen(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskAssignee('');
      fetchWorkspace(selectedTeam._id);
    } catch (err) {
      toast.error(apiError(err, 'Failed to create task.'));
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/teams/${selectedTeam._id}/tasks/${taskId}`, {
        status: newStatus,
      });
      fetchWorkspace(selectedTeam._id);
    } catch (err) {
      toast.error(apiError(err, 'Failed to update task.'));
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/teams/${selectedTeam._id}/tasks/${taskId}`);
      toast.success('Task deleted.');
      fetchWorkspace(selectedTeam._id);
    } catch (err) {
      toast.error(apiError(err, 'Failed to delete task.'));
    }
  };

  const handleTransferLeadership = async (e) => {
    e.preventDefault();
    if (!newLeaderId) return;
    try {
      await api.put(`/teams/${selectedTeam._id}/transfer`, { newLeaderId });
      toast.success('Leadership transferred successfully.');
      setTransferModalOpen(false);
      fetchMyTeams();
      fetchWorkspace(selectedTeam._id);
    } catch (err) {
      toast.error(apiError(err, 'Failed to transfer leadership.'));
    }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm('Are you sure you want to leave this team?')) return;
    try {
      await api.post(`/teams/${selectedTeam._id}/leave`);
      toast.success('You left the team.');
      setSelectedTeam(null);
      setWorkspace(null);
      fetchMyTeams();
    } catch (err) {
      toast.error(apiError(err, 'Could not leave team.'));
    }
  };

  const isOwner = selectedTeam && String(selectedTeam.owner?._id || selectedTeam.owner) === String(user?._id || user?.id);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Team Workspace
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Coordinate hackathon squad tasks, share repository & design links, and track sprint deliverables.
        </p>
      </div>

      {loading ? (
        <ListSkeleton count={3} />
      ) : teams.length === 0 ? (
        <EmptyState
          title="You are not part of any teams yet"
          message="Find teammates in Discover, pitch a concept in Ideas Hub, or join an upcoming hackathon squad."
          actionLabel="Discover Builders"
          actionTo="/discover"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Teams Selector Sidebar */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
              Your Squads ({teams.length})
            </h2>
            <div className="space-y-2">
              {teams.map((t) => {
                const active = selectedTeam?._id === t._id;
                return (
                  <button
                    key={t._id}
                    onClick={() => setSelectedTeam(t)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                      active
                        ? 'bg-indigo-50/70 border-indigo-500/80 shadow-subtle dark:bg-indigo-950/40 dark:border-indigo-600'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-card'
                    }`}
                  >
                    <p className={`font-semibold text-sm ${active ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-900 dark:text-white'}`}>
                      {t.name}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span>{(t.members || []).length} Members</span>
                      <span className={`text-[10px] font-medium px-2 py-0.2 rounded-full border ${
                        t.isOpen
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                      }`}>
                        {t.isOpen ? 'Recruiting' : 'Full'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Workspace Area */}
          <div className="lg:col-span-3 space-y-6">
            {workspaceLoading || !workspace ? (
              <ListSkeleton count={2} />
            ) : (
              <>
                {/* Team Info Banner */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                          {workspace.team.name}
                        </h2>
                        {isOwner && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                            <Crown className="w-3 h-3 text-indigo-600" /> Leader
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {workspace.team.description || 'No squad description provided yet.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOwner && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setTransferModalOpen(true)}
                        >
                          Transfer Lead
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-600 dark:text-rose-400 hover:bg-rose-50"
                        onClick={handleLeaveTeam}
                      >
                        <LogOut className="w-3.5 h-3.5 mr-1" /> Leave Squad
                      </Button>
                    </div>
                  </div>

                  {/* Members Avatars Bar */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold mr-1">
                      Members:
                    </span>
                    {(workspace.members || []).map((m) => (
                      <div
                        key={m._id}
                        className="inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-3 py-1 rounded-xl text-xs text-slate-700 dark:text-slate-200 font-medium"
                      >
                        <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-[10px] font-bold text-white">
                          {(m.name || '?').charAt(0).toUpperCase()}
                        </span>
                        <span>{m.name}</span>
                        {String(m._id) === String(workspace.team.owner?._id || workspace.team.owner) && (
                          <Crown className="w-3 h-3 text-amber-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shared Resources & Links */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                      <LinkIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Shared Project Resources</span>
                    </h3>
                    <Button size="sm" onClick={() => setLinkModalOpen(true)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Link
                    </Button>
                  </div>

                  {(workspace.links || []).length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-center">
                      <p className="text-xs text-slate-500 italic">
                        No shared resources added yet. Add GitHub repos, Figma files, or documentation links.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {workspace.links.map((link) => (
                        <div
                          key={link._id}
                          className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3 shadow-subtle hover:border-indigo-300 transition-colors"
                        >
                          <div className="min-w-0">
                            <a
                              href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
                            >
                              {link.title}
                            </a>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{link.url}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteLink(link._id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                            title="Remove link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Interactive Sprint Task Board */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                      <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Sprint Task Board</span>
                    </h3>
                    <Button size="sm" onClick={() => setTaskModalOpen(true)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> New Task
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Column: To Do */}
                    <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-3 border border-slate-200/70 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 px-1">
                        <span className="flex items-center gap-1.5">
                          <Circle className="w-3 h-3 text-slate-400" />
                          <span>TO DO</span>
                        </span>
                        <span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {(workspace.tasks || []).filter((t) => t.status === 'todo').length}
                        </span>
                      </div>
                      <div className="space-y-2 min-h-[5rem]">
                        {(workspace.tasks || [])
                          .filter((t) => t.status === 'todo')
                          .map((task) => (
                            <TaskCard
                              key={task._id}
                              task={task}
                              onStatusChange={handleUpdateTaskStatus}
                              onDelete={handleDeleteTask}
                            />
                          ))}
                      </div>
                    </div>

                    {/* Column: In Progress */}
                    <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-3 border border-slate-200/70 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 px-1">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          <span>IN PROGRESS</span>
                        </span>
                        <span className="bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded-full text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                          {(workspace.tasks || []).filter((t) => t.status === 'in_progress').length}
                        </span>
                      </div>
                      <div className="space-y-2 min-h-[5rem]">
                        {(workspace.tasks || [])
                          .filter((t) => t.status === 'in_progress')
                          .map((task) => (
                            <TaskCard
                              key={task._id}
                              task={task}
                              onStatusChange={handleUpdateTaskStatus}
                              onDelete={handleDeleteTask}
                            />
                          ))}
                      </div>
                    </div>

                    {/* Column: Done */}
                    <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-3 border border-slate-200/70 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-1">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>DONE</span>
                        </span>
                        <span className="bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          {(workspace.tasks || []).filter((t) => t.status === 'done').length}
                        </span>
                      </div>
                      <div className="space-y-2 min-h-[5rem]">
                        {(workspace.tasks || [])
                          .filter((t) => t.status === 'done')
                          .map((task) => (
                            <TaskCard
                              key={task._id}
                              task={task}
                              onStatusChange={handleUpdateTaskStatus}
                              onDelete={handleDeleteTask}
                            />
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Link Modal */}
      <AnimatePresence>
        {linkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-elevated space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Add Shared Resource Link
                </h3>
                <button
                  onClick={() => setLinkModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddLink} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Resource Title
                  </label>
                  <Input
                    placeholder="e.g. Frontend GitHub Repo"
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    URL (HTTPS)
                  </label>
                  <Input
                    placeholder="https://github.com/..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setLinkModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">Save Resource</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Task Modal */}
      <AnimatePresence>
        {taskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-elevated space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Create Squad Task
                </h3>
                <button
                  onClick={() => setTaskModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Task Title *
                  </label>
                  <Input
                    placeholder="e.g. Design Landing Page & Deck"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    className="input text-xs resize-none"
                    placeholder="Brief task scope or acceptance criteria..."
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Assignee
                  </label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15"
                  >
                    <option value="">Unassigned</option>
                    {(workspace?.members || []).map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Initial Status
                  </label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setTaskModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">Create Task</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transfer Leadership Modal */}
      <AnimatePresence>
        {transferModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-elevated space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Transfer Team Leadership
                </h3>
                <button
                  onClick={() => setTransferModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Select a team member to take over as squad leader. They will manage team settings and membership.
              </p>

              <form onSubmit={handleTransferLeadership} className="space-y-4">
                <select
                  value={newLeaderId}
                  onChange={(e) => setNewLeaderId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15"
                >
                  <option value="">Select a new leader...</option>
                  {(workspace?.members || [])
                    .filter((m) => String(m._id) !== String(user?._id || user?.id))
                    .map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name}
                      </option>
                    ))}
                </select>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setTransferModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={!newLeaderId}>
                    Confirm Transfer
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TaskCard({ task, onStatusChange, onDelete }) {
  return (
    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-2 shadow-card hover:shadow-card-hover transition-all">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-xs text-slate-900 dark:text-white leading-tight">
          {task.title}
        </h4>
        <button
          onClick={() => onDelete(task._id)}
          className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
          title="Delete task"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {task.description && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
        <span className="text-slate-500 dark:text-slate-400 font-medium">
          {task.assignee?.name ? `${task.assignee.name.split(' ')[0]}` : 'Unassigned'}
        </span>

        <select
          value={task.status}
          onChange={(e) => onStatusChange(task._id, e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded px-1.5 py-0.5 outline-none font-medium"
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>
    </div>
  );
}
