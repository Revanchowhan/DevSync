import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Send,
  X,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../components/SocialIcons';
import api, { apiError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import EmptyState from '../components/EmptyState';
import { ListSkeleton } from '../components/Skeleton';
import MatchRing from '../components/MatchRing';

const ROLES = ['Developer', 'Designer', 'Data Scientist', 'Researcher', 'Presenter'];
const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export default function Discover() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  // Filters state
  const [search, setSearch] = useState('');
  const [skill, setSkill] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState('');
  const [availability, setAvailability] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Connect modal state
  const [connectModalStudent, setConnectModalStudent] = useState(null);
  const [connectMessage, setConnectMessage] = useState('');
  const [sendingConnect, setSendingConnect] = useState(false);
  const [sentConnections, setSentConnections] = useState(new Set());

  // Breakdown modal state
  const [breakdownStudent, setBreakdownStudent] = useState(null);

  const fetchStudents = useCallback(
    async (isCursor = false, cursorValue = null) => {
      try {
        if (isCursor) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const params = new URLSearchParams();
        if (search.trim()) params.append('search', search.trim());
        if (skill.trim()) params.append('skills', skill.trim());
        if (college.trim()) params.append('college', college.trim());
        if (branch.trim()) params.append('branch', branch.trim());
        if (year) params.append('year', year);
        if (role) params.append('role', role);
        if (experience) params.append('experience', experience);
        if (availability) params.append('availability', availability);
        if (cursorValue) params.append('cursor', cursorValue);
        params.append('limit', '12');

        const { data } = await api.get(`/students?${params.toString()}`);
        if (isCursor) {
          setStudents((prev) => [...prev, ...(data.students || [])]);
        } else {
          setStudents(data.students || []);
        }
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (err) {
        toast.error(apiError(err, 'Failed to fetch students.'));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, skill, college, branch, year, role, experience, availability]
  );

  // Debounced search/filter trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchStudents(false, null);
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchStudents]);

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      fetchStudents(true, nextCursor);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!connectModalStudent) return;
    setSendingConnect(true);
    try {
      await api.post('/connections', {
        recipientId: connectModalStudent._id,
        message: connectMessage.trim(),
      });
      toast.success(`Connection request sent to ${connectModalStudent.name}!`);
      setSentConnections((prev) => new Set(prev).add(connectModalStudent._id));
      setConnectModalStudent(null);
      setConnectMessage('');
    } catch (err) {
      toast.error(apiError(err, 'Failed to send connection request.'));
    } finally {
      setSendingConnect(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSkill('');
    setCollege('');
    setBranch('');
    setYear('');
    setRole('');
    setExperience('');
    setAvailability('');
  };

  const getScoreVariant = (score) => {
    if (score >= 75) return 'emerald';
    if (score >= 50) return 'amber';
    return 'purple';
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Mobile Filter Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Discover Teammates
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Connect with ambitious university students based on skill complementarity.
          </p>
        </div>

        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="md:hidden inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-subtle text-slate-700 dark:text-slate-200"
        >
          <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
          <span>{showMobileFilters ? 'Hide Filters' : 'Filter Directory'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Filters Sidebar */}
        <div className={`md:block ${showMobileFilters ? 'block' : 'hidden'} md:col-span-1 space-y-4 md:sticky md:top-20`}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Filters</span>
              </h2>
              <button
                onClick={resetFilters}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Search Name or Bio
              </label>
              <Input
                placeholder="e.g. Alice, Machine Learning..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Required Skill
              </label>
              <Input
                placeholder="e.g. React, Python, UI/UX..."
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                University / College
              </label>
              <Input
                placeholder="e.g. Stanford, MIT, Harvard..."
                value={college}
                onChange={(e) => setCollege(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Preferred Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15"
              >
                <option value="">All Roles</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Experience Level
              </label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15"
              >
                <option value="">All Levels</option>
                {EXPERIENCE_LEVELS.map((exp) => (
                  <option key={exp} value={exp}>
                    {exp}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Availability
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15"
              >
                <option value="">Any</option>
                <option value="available">Available now</option>
                <option value="busy">Busy / Browsing</option>
              </select>
            </div>
          </div>
        </div>

        {/* Candidate Profile Cards Grid */}
        <div className="md:col-span-3 space-y-4">
          {loading ? (
            <ListSkeleton count={4} />
          ) : students.length === 0 ? (
            <EmptyState
              title="No students match your filter criteria"
              message="Try clearing or broadening your search keywords to view more candidates."
              actionLabel="Clear All Filters"
              onAction={resetFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {students.map((student) => {
                  const match = student.match || { score: 50, breakdown: {}, reason: '' };
                  const score = match.score || 0;
                  const isSent = sentConnections.has(student._id);

                  return (
                    <motion.div
                      key={student._id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Avatar, Name, Match Score */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {student.avatarUrl ? (
                              <img
                                src={student.avatarUrl}
                                alt={student.name}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white font-bold text-base shadow-subtle shrink-0">
                                {(student.name || '?').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-sm text-slate-900 dark:text-white leading-tight">
                                {student.name}
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {student.college || student.university || 'University Student'}
                                {student.branch ? ` · ${student.branch}` : ''}
                                {student.year ? ` (Yr ${student.year})` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Match score badge with click for breakdown */}
                          <button
                            onClick={() => setBreakdownStudent(student)}
                            title="Click for matching breakdown"
                            className="group flex flex-col items-end cursor-pointer"
                          >
                            <Badge
                              variant={getScoreVariant(score)}
                              className="text-xs px-2.5 py-0.5 font-semibold group-hover:scale-105 transition-transform"
                            >
                              ⚡ {score}% Fit
                            </Badge>
                          </button>
                        </div>

                        {/* Explainable match reason snippet */}
                        {match.reason && (
                          <div className="mt-3 text-xs bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-300 rounded-xl p-2.5 flex items-start gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 leading-relaxed">{match.reason}</span>
                          </div>
                        )}

                        {/* Bio */}
                        {student.bio && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                            {student.bio}
                          </p>
                        )}

                        {/* Roles & Availability */}
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          {(student.preferredRoles || []).map((r) => (
                            <span
                              key={r}
                              className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 px-2 py-0.5 rounded-md"
                            >
                              {r}
                            </span>
                          ))}
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                              student.availability === 'available'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                            }`}
                          >
                            {student.availability === 'available' ? '● Available' : '○ Busy'}
                          </span>
                        </div>

                        {/* Skills */}
                        <div className="mt-3">
                          <p className="text-[11px] font-semibold text-slate-400 mb-1">
                            Skills:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {(student.skills || []).slice(0, 5).map((s, idx) => {
                              const sName = typeof s === 'string' ? s : s.name;
                              return (
                                <span
                                  key={idx}
                                  className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 px-2 py-0.5 rounded font-medium"
                                >
                                  {sName}
                                </span>
                              );
                            })}
                            {(student.skills || []).length > 5 && (
                              <span className="text-[10px] text-slate-400 py-0.5 px-1 font-medium">
                                +{student.skills.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          {student.github && (
                            <a
                              href={student.github.startsWith('http') ? student.github : `https://${student.github}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                              title="GitHub Profile"
                            >
                              <GithubIcon className="w-4 h-4" />
                            </a>
                          )}
                          {student.linkedin && (
                            <a
                              href={student.linkedin.startsWith('http') ? student.linkedin : `https://${student.linkedin}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-indigo-600 transition-colors"
                              title="LinkedIn Profile"
                            >
                              <LinkedinIcon className="w-4 h-4" />
                            </a>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant={isSent ? 'secondary' : 'primary'}
                          disabled={isSent}
                          onClick={() => setConnectModalStudent(student)}
                        >
                          {isSent ? '✓ Requested' : 'Connect'}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="secondary"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading Builders...' : 'Load More Candidates'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Connection Request Modal */}
      <AnimatePresence>
        {connectModalStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-elevated space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Connect with {connectModalStudent.name}
                </h3>
                <button
                  onClick={() => setConnectModalStudent(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Send a personalized introduction note. Mention the hackathon or problem space you'd like to tackle together.
              </p>

              <form onSubmit={handleConnect} className="space-y-4">
                <textarea
                  rows={4}
                  maxLength={500}
                  value={connectMessage}
                  onChange={(e) => setConnectMessage(e.target.value)}
                  placeholder={`Hi ${connectModalStudent.name}, I noticed your skills in ${
                    (connectModalStudent.skills || [])[0]?.name || 'tech'
                  } and would love to form a hackathon team with you!`}
                  className="input text-xs resize-none"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConnectModalStudent(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={sendingConnect}>
                    {sendingConnect ? 'Sending...' : 'Send Request'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Match Breakdown Modal */}
      <AnimatePresence>
        {breakdownStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-elevated space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Match Explanation · {breakdownStudent.name}
                  </h3>
                </div>
                <button
                  onClick={() => setBreakdownStudent(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-3 text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed">
                {breakdownStudent.match?.reason || 'Calculated based on skill gap complementarity and role fit.'}
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Score Breakdown (100 pts total)
                </p>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                      <span>Skill Complementarity</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {breakdownStudent.match?.breakdown?.complementarity || 0} / 40
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{
                          width: `${((breakdownStudent.match?.breakdown?.complementarity || 0) / 40) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                      <span>Shared Interests</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {breakdownStudent.match?.breakdown?.interests || 0} / 20
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{
                          width: `${((breakdownStudent.match?.breakdown?.interests || 0) / 20) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                      <span>Role Alignment</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {breakdownStudent.match?.breakdown?.roleFit || 0} / 20
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${((breakdownStudent.match?.breakdown?.roleFit || 0) / 20) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                      <span>Availability</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {breakdownStudent.match?.breakdown?.availability || 0} / 10
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{
                          width: `${((breakdownStudent.match?.breakdown?.availability || 0) / 10) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                      <span>Experience Fit</span>
                      <span className="font-semibold text-sky-600 dark:text-sky-400">
                        {breakdownStudent.match?.breakdown?.experience || 0} / 10
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{
                          width: `${((breakdownStudent.match?.breakdown?.experience || 0) / 10) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setBreakdownStudent(null)}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
