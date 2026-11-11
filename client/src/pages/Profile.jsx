import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  User, Mail, Building2, GraduationCap, Award, Compass, 
  Sparkles, Check, AlertTriangle, ShieldCheck, 
  Globe, Eye, EyeOff, Save, Trash2
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../components/SocialIcons.jsx';
import api, { apiError } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isValidEmail } from '../utils/format.js';
import { YEAR_OPTIONS } from '../utils/years.js';
import SkillPicker from '../components/SkillPicker.jsx';
import { PageSpinner } from '../components/ProtectedRoute.jsx';
import { calculateProfileCompletion } from '../utils/profileCompletion.js';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';

const PREFERRED_ROLES = ['Developer', 'Designer', 'Data Scientist', 'Researcher', 'Presenter'];
const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export default function Profile() {
  const { user, refreshMe, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [interestInput, setInterestInput] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) return;
    setDeleting(true);
    try {
      await api.delete('/safety/account', { data: { password: deletePassword } });
      toast.success('Your account has been deleted.');
      logout();
      navigate('/');
    } catch (err) {
      toast.error(apiError(err, 'Failed to delete account. Check password.'));
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/users/me');
        const u = data.user;
        setForm({
          name: u.name || '',
          email: u.email || '',
          avatarUrl: u.avatarUrl || '',
          college: u.college || '',
          university: u.university || '',
          branch: u.branch || '',
          year: u.year || '',
          skills: u.skills || [],
          interests: Array.isArray(u.interests) ? u.interests : [],
          preferredRoles: Array.isArray(u.preferredRoles) && u.preferredRoles.length > 0 ? u.preferredRoles : ['Developer'],
          experienceLevel: u.experienceLevel || 'Beginner',
          availability: u.availability || 'available',
          profileVisibility: u.profileVisibility || 'public',
          github: u.github || '',
          linkedin: u.linkedin || '',
          bio: u.bio || '',
          organization: u.organization || '',
        });
      } catch (err) {
        toast.error(apiError(err, 'Could not load profile.'));
      }
    })();
  }, []);

  if (!form) return <PageSpinner />;

  const isHost = user?.role === 'host';
  const completionPercentage = isHost ? 100 : calculateProfileCompletion(form);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const toggleRole = (r) => {
    const current = form.preferredRoles || [];
    if (current.includes(r)) {
      if (current.length === 1) return; // Keep at least one role
      set('preferredRoles', current.filter((item) => item !== r));
    } else {
      if (current.length >= 5) return;
      set('preferredRoles', [...current, r]);
    }
  };

  const addInterest = () => {
    const val = interestInput.trim();
    if (!val) return;
    const current = form.interests || [];
    if (!current.includes(val) && current.length < 20) {
      set('interests', [...current, val]);
    }
    setInterestInput('');
  };

  const removeInterest = (tag) => {
    set('interests', (form.interests || []).filter((i) => i !== tag));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!isValidEmail(form.email)) e.email = 'Enter a valid email address.';
    if (form.avatarUrl && form.avatarUrl.trim()) {
      if (!/^https:\/\/[^ "]+$/.test(form.avatarUrl.trim())) {
        e.avatarUrl = 'Avatar URL must start with https://';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = isHost
        ? { name: form.name.trim(), organization: form.organization.trim() }
        : {
            name: form.name.trim(),
            avatarUrl: form.avatarUrl.trim(),
            college: form.college.trim(),
            university: form.university.trim() || form.college.trim(),
            branch: form.branch.trim(),
            year: form.year === '' ? undefined : Number(form.year),
            skills: form.skills,
            interests: form.interests,
            preferredRoles: form.preferredRoles,
            experienceLevel: form.experienceLevel,
            availability: form.availability,
            profileVisibility: form.profileVisibility,
            github: form.github.trim(),
            linkedin: form.linkedin.trim(),
            bio: form.bio.trim(),
          };
      await api.put('/users/me', payload);
      await refreshMe();
      toast.success('Profile updated successfully ✨');
    } catch (err) {
      toast.error(apiError(err, 'Could not save profile.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell py-8 max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Student Profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Keep your skills and info up to date for smart teammate recommendations.
          </p>
        </div>

        {!isHost && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-3 shadow-card flex flex-col justify-center min-w-[200px]">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-500 dark:text-slate-400">Profile Strength</span>
              <span className={`font-mono ${completionPercentage >= 80 ? 'text-emerald-600 dark:text-emerald-400' : completionPercentage >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                {completionPercentage}%
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  completionPercentage >= 80 ? 'bg-emerald-500' : completionPercentage >= 50 ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={save}
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-card space-y-8"
        noValidate
      >
        {/* Header Preview & Identity */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-100 dark:border-slate-800">
          {form.avatarUrl ? (
            <img
              src={form.avatarUrl}
              alt={form.name}
              className="w-20 h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-subtle shrink-0"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white text-3xl font-bold shadow-subtle shrink-0">
              {(form.name || '?').charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-xl text-slate-900 dark:text-white">{form.name || 'Your Name'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{form.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge variant="purple" className="capitalize text-xs">
                {user?.role}
              </Badge>
              {user?.emailVerified ? (
                <Badge variant="emerald" className="text-xs">
                  <ShieldCheck className="w-3 h-3 inline mr-1" />
                  Verified Student
                </Badge>
              ) : (
                <Link to="/verify-email">
                  <Badge variant="amber" className="text-xs hover:bg-amber-100 cursor-pointer">
                    Verify Student Email →
                  </Badge>
                </Link>
              )}
              {!isHost && (
                <>
                  <Badge variant={form.availability === 'available' ? 'emerald' : 'slate'} className="text-xs">
                    {form.availability === 'available' ? '● Available for squads' : '○ Busy'}
                  </Badge>
                  <Badge variant={form.profileVisibility === 'public' ? 'cyan' : 'rose'} className="text-xs">
                    {form.profileVisibility === 'public' ? 'Public' : 'Hidden'}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Basic Information</h3>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input
                className="input"
                placeholder="Ada Lovelace"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
              {errors.name && <p className="error-text">{errors.name}</p>}
            </div>

            <div>
              <label className="label">Email Address</label>
              <input
                className="input bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed opacity-75"
                value={form.email}
                disabled
                title="Email is managed through your login credentials"
              />
            </div>

            {isHost ? (
              <div className="sm:col-span-2">
                <label className="label">Organization / Club</label>
                <input
                  className="input"
                  placeholder="e.g. Stanford ACM"
                  value={form.organization}
                  onChange={(e) => set('organization', e.target.value)}
                />
              </div>
            ) : (
              <>
                <div className="sm:col-span-2">
                  <label className="label">Avatar Image URL (HTTPS)</label>
                  <input
                    className="input font-mono text-xs"
                    placeholder="https://images.unsplash.com/... or https://github.com/username.png"
                    value={form.avatarUrl}
                    onChange={(e) => set('avatarUrl', e.target.value)}
                  />
                  {errors.avatarUrl && <p className="error-text">{errors.avatarUrl}</p>}
                  <p className="text-[11px] text-slate-500 mt-1">Direct HTTPS image link. Cloudinary and GitHub profile photos work best.</p>
                </div>

                <div>
                  <label className="label">College / University</label>
                  <input
                    className="input"
                    placeholder="e.g. Stanford University"
                    value={form.college}
                    onChange={(e) => set('college', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Branch / Major</label>
                  <input
                    className="input"
                    placeholder="e.g. Computer Science"
                    value={form.branch}
                    onChange={(e) => set('branch', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Academic Year</label>
                  <select
                    className="input"
                    value={form.year}
                    onChange={(e) => set('year', e.target.value)}
                  >
                    <option value="">Select year</option>
                    {YEAR_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Experience Level</label>
                  <select
                    className="input"
                    value={form.experienceLevel}
                    onChange={(e) => set('experienceLevel', e.target.value)}
                  >
                    {EXPERIENCE_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Roles & Skills (Student only) */}
        {!isHost && (
          <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Roles & Expertise</h3>

            {/* Preferred Roles */}
            <div>
              <label className="label">Preferred Roles</label>
              <p className="text-xs text-slate-500 mb-2.5">Select the team roles you enjoy taking on:</p>
              <div className="flex flex-wrap gap-2">
                {PREFERRED_ROLES.map((role) => {
                  const active = (form.preferredRoles || []).includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        active
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5" />}
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skills */}
            <div>
              <SkillPicker label="Technical & Creative Skills" value={form.skills} onChange={(v) => set('skills', v)} />
            </div>

            {/* Interests */}
            <div>
              <label className="label">Passion Interests (e.g. AI, ClimateTech, Web3, FinTech)</label>
              <div className="flex gap-2 mb-2.5">
                <input
                  className="input text-xs"
                  placeholder="Type an interest and press Add..."
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addInterest();
                    }
                  }}
                />
                <Button type="button" variant="secondary" size="sm" onClick={addInterest} className="shrink-0">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(form.interests || []).map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs px-2.5 py-1 rounded-md"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => removeInterest(interest)}
                      className="hover:text-indigo-950 dark:hover:text-white font-bold cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Availability & Discovery Visibility */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Teammate Availability</label>
                <select className="input" value={form.availability} onChange={(e) => set('availability', e.target.value)}>
                  <option value="available">Available (Looking for a squad)</option>
                  <option value="busy">Busy (Not currently seeking a squad)</option>
                </select>
              </div>

              <div>
                <label className="label">Profile Visibility in Discovery</label>
                <select className="input" value={form.profileVisibility} onChange={(e) => set('profileVisibility', e.target.value)}>
                  <option value="public">Public (Visible in student directory)</option>
                  <option value="hidden">Hidden (Stealth mode)</option>
                </select>
              </div>
            </div>

            {/* Social links */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">GitHub Profile</label>
                <div className="relative">
                  <GithubIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    className="input pl-9 font-mono text-xs"
                    value={form.github}
                    onChange={(e) => set('github', e.target.value)}
                    placeholder="https://github.com/username"
                  />
                </div>
              </div>

              <div>
                <label className="label">LinkedIn Profile</label>
                <div className="relative">
                  <LinkedinIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    className="input pl-9 font-mono text-xs"
                    value={form.linkedin}
                    onChange={(e) => set('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="label">Bio & Pitch</label>
              <textarea
                className="input resize-none"
                rows={3}
                maxLength={1000}
                placeholder="Tell teammates about your background, what you love building, and dream hackathon projects..."
                value={form.bio}
                onChange={(e) => set('bio', e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="submit" variant="primary" disabled={saving} className="w-full sm:w-auto px-8 gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saving Changes...' : 'Save Profile Changes'}
          </Button>
        </div>
      </motion.form>

      {/* Danger Zone: Account Deletion */}
      <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-sm text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Danger Zone: Delete Account
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Permanently remove your student profile, match history, and team memberships.
          </p>
        </div>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => setDeleteModalOpen(true)}
          className="gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Account
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl p-6 border border-rose-300 dark:border-rose-900/80 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Account?</h3>
                  <p className="text-xs text-slate-500">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                All your profile details, squad associations, invitations, and chat history will be permanently deleted from DevSync.
              </p>

              <form onSubmit={handleDeleteAccount} className="space-y-4 pt-2">
                <div>
                  <label className="label">
                    Confirm your account password:
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter password..."
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="input"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="danger"
                    size="sm"
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Delete Permanently'}
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