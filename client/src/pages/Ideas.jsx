import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Lightbulb,
  Plus,
  Search,
  Filter,
  Users,
  Sparkles,
  ArrowRight,
  X,
  Rocket,
  CheckCircle2,
} from 'lucide-react';
import api, { apiError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import EmptyState from '../components/EmptyState';
import { ListSkeleton } from '../components/Skeleton';
import SkillPicker from '../components/SkillPicker';

const DOMAINS = [
  'All Domains',
  'AI / Machine Learning',
  'Sustainability & CleanTech',
  'HealthTech & Biotech',
  'FinTech & Web3',
  'EdTech',
  'Social & Community',
  'Developer Tools',
  'Cybersecurity',
  'Hardware / IoT',
];

const ROLES = ['Developer', 'Designer', 'Data Scientist', 'Researcher', 'Presenter'];

export default function Ideas() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All Domains');
  const [skillFilter, setSkillFilter] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [interestModalIdea, setInterestModalIdea] = useState(null);
  const [interestMessage, setInterestMessage] = useState('');
  const [submittingInterest, setSubmittingInterest] = useState(false);
  const [appliedIdeaIds, setAppliedIdeaIds] = useState(new Set());

  // Create form state
  const [formTitle, setFormTitle] = useState('');
  const [formDomain, setFormDomain] = useState('AI / Machine Learning');
  const [formDesc, setFormDesc] = useState('');
  const [formSkills, setFormSkills] = useState([]);
  const [formRoles, setFormRoles] = useState(['Developer']);
  const [formTeamSize, setFormTeamSize] = useState(4);
  const [creating, setCreating] = useState(false);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedDomain !== 'All Domains') params.append('domain', selectedDomain);
      if (skillFilter.trim()) params.append('skill', skillFilter.trim());
      params.append('status', 'open');

      const { data } = await api.get(`/ideas?${params.toString()}`);
      setIdeas(data.ideas || []);
    } catch (err) {
      toast.error(apiError(err, 'Failed to load project ideas.'));
    } finally {
      setLoading(false);
    }
  }, [search, selectedDomain, skillFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchIdeas, 300);
    return () => clearTimeout(timer);
  }, [fetchIdeas]);

  const handleCreateIdea = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDesc.trim()) {
      return toast.error('Please fill in title and description.');
    }
    setCreating(true);
    try {
      await api.post('/ideas', {
        title: formTitle.trim(),
        domain: formDomain,
        description: formDesc.trim(),
        requiredSkills: formSkills,
        preferredRoles: formRoles,
        teamSize: formTeamSize,
      });
      toast.success('Project idea published to DevSync Hub! 🚀');
      setCreateModalOpen(false);
      setFormTitle('');
      setFormDesc('');
      setFormSkills([]);
      fetchIdeas();
    } catch (err) {
      toast.error(apiError(err, 'Failed to create idea.'));
    } finally {
      setCreating(false);
    }
  };

  const handleExpressInterest = async (e) => {
    e.preventDefault();
    if (!interestModalIdea) return;
    setSubmittingInterest(true);
    try {
      await api.post(`/ideas/${interestModalIdea._id}/interest`, {
        message: interestMessage.trim(),
      });
      toast.success(`Interest sent to ${interestModalIdea.owner?.name || 'idea owner'}! 🎉`);
      setAppliedIdeaIds((prev) => new Set(prev).add(interestModalIdea._id));
      setInterestModalIdea(null);
      setInterestMessage('');
    } catch (err) {
      toast.error(apiError(err, 'Could not express interest.'));
    } finally {
      setSubmittingInterest(false);
    }
  };

  const handleConvertToTeam = async (ideaId) => {
    try {
      const { data } = await api.post(`/ideas/${ideaId}/convert`);
      toast.success('Successfully converted idea into an official Team Workspace! 🚀');
      fetchIdeas();
    } catch (err) {
      toast.error(apiError(err, 'Failed to convert idea to team.'));
    }
  };

  const toggleRole = (r) => {
    if (formRoles.includes(r)) {
      if (formRoles.length === 1) return;
      setFormRoles(formRoles.filter((item) => item !== r));
    } else {
      setFormRoles([...formRoles, r]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Pitch CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Ideas Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Browse project concepts from students looking for teammates, or pitch your own hackathon vision.
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="shadow-subtle">
          <Plus className="w-4 h-4 mr-1.5" /> Pitch New Idea
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-card grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Input
            placeholder="Search ideas by keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15"
          >
            {DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Input
            placeholder="Filter by required skill (e.g. React, PyTorch)..."
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Ideas Grid */}
      {loading ? (
        <ListSkeleton count={4} />
      ) : ideas.length === 0 ? (
        <EmptyState
          title="No open ideas found"
          message="Be the first to pitch a hackathon project concept and gather a complementary squad!"
          actionLabel="Pitch an Idea"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ideas.map((idea) => {
            const isOwner = String(idea.owner?._id || idea.owner) === String(user?._id || user?.id);
            const isApplied = appliedIdeaIds.has(idea._id);
            const memberCount = (idea.members || []).length;
            const targetSize = idea.teamSize || 4;

            return (
              <motion.div
                key={idea._id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 px-2 py-0.5 rounded-full">
                      {idea.domain}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {memberCount}/{targetSize} Builders
                    </span>
                  </div>

                  <h3 className="font-semibold text-base text-slate-900 dark:text-white leading-snug">
                    {idea.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                    {idea.description}
                  </p>

                  {/* Required Skills */}
                  {(idea.requiredSkills || []).length > 0 && (
                    <div className="mt-4">
                      <p className="text-[11px] font-semibold text-slate-400 mb-1">
                        Looking for skills:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {idea.requiredSkills.map((s, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 px-2 py-0.5 rounded font-medium"
                          >
                            {typeof s === 'string' ? s : s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred Roles */}
                  {(idea.preferredRoles || []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {idea.preferredRoles.map((r) => (
                        <span
                          key={r}
                          className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 px-2 py-0.5 rounded-md"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    By <span className="text-slate-900 dark:text-white font-medium">{idea.owner?.name || 'Student Builder'}</span>
                  </div>

                  {isOwner ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleConvertToTeam(idea._id)}
                    >
                      <Rocket className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Convert to Squad
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={isApplied}
                      onClick={() => setInterestModalIdea(idea)}
                    >
                      {isApplied ? '✓ Applied' : 'Join Idea'}
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pitch New Idea Modal */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white dark:bg-slate-900 max-w-xl w-full rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-elevated space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Pitch a Project Idea
                  </h3>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateIdea} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Project Title *
                  </label>
                  <Input
                    placeholder="e.g. MedAssist AI: Real-Time Triage Copilot"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Domain / Track *
                    </label>
                    <select
                      value={formDomain}
                      onChange={(e) => setFormDomain(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15"
                    >
                      {DOMAINS.filter((d) => d !== 'All Domains').map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Target Team Size (2-10)
                    </label>
                    <Input
                      type="number"
                      min={2}
                      max={10}
                      value={formTeamSize}
                      onChange={(e) => setFormTeamSize(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Concept Pitch & Problem Statement *
                  </label>
                  <textarea
                    rows={4}
                    maxLength={2000}
                    placeholder="Describe what you plan to build, the problem it solves, and the impact you aim for..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="input text-xs resize-none"
                  />
                </div>

                <div>
                  <SkillPicker
                    label="Desired Complementary Skills"
                    value={formSkills}
                    onChange={setFormSkills}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Roles Needed:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLES.map((role) => {
                      const active = formRoles.includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggleRole(role)}
                          className={`px-3 py-1 rounded-xl text-xs font-medium border transition-colors ${
                            active
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-500 dark:text-indigo-300 font-semibold'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          {active ? `✓ ${role}` : role}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={creating}>
                    {creating ? 'Publishing...' : 'Publish Idea 🚀'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Express Interest Modal */}
      <AnimatePresence>
        {interestModalIdea && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-elevated space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Join Project: {interestModalIdea.title}
                </h3>
                <button
                  onClick={() => setInterestModalIdea(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Explain the complementary skills you bring and how you'd like to contribute.
              </p>

              <form onSubmit={handleExpressInterest} className="space-y-4">
                <textarea
                  rows={4}
                  maxLength={500}
                  value={interestMessage}
                  onChange={(e) => setInterestMessage(e.target.value)}
                  placeholder="Hey! Loved this idea. I have strong experience in React and UI/UX design and can help build the frontend..."
                  className="input text-xs resize-none"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setInterestModalIdea(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={submittingInterest}>
                    {submittingInterest ? 'Submitting...' : 'Send Interest'}
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
