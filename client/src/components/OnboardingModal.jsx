import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Check, Sparkles, X } from 'lucide-react';
import api, { apiError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import SkillPicker from './SkillPicker';

const ROLES = ['Developer', 'Designer', 'Data Scientist', 'Researcher', 'Presenter'];
const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export default function OnboardingModal() {
  const { user, refreshMe } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form states
  const [selectedRoles, setSelectedRoles] = useState(user?.preferredRoles || ['Developer']);
  const [experienceLevel, setExperienceLevel] = useState(user?.experienceLevel || 'Beginner');
  const [skills, setSkills] = useState(user?.skills || []);
  const [interestInput, setInterestInput] = useState('');
  const [interests, setInterests] = useState(user?.interests || []);
  const [availability, setAvailability] = useState(user?.availability || 'available');

  if (!user || user.role !== 'student' || user.onboardingCompleted) {
    return null;
  }

  const toggleRole = (r) => {
    if (selectedRoles.includes(r)) {
      if (selectedRoles.length === 1) return;
      setSelectedRoles(selectedRoles.filter((item) => item !== r));
    } else {
      if (selectedRoles.length >= 5) return;
      setSelectedRoles([...selectedRoles, r]);
    }
  };

  const addInterest = () => {
    const val = interestInput.trim();
    if (!val) return;
    if (!interests.includes(val) && interests.length < 10) {
      setInterests([...interests, val]);
    }
    setInterestInput('');
  };

  const removeInterest = (item) => {
    setInterests(interests.filter((i) => i !== item));
  };

  const handleFinish = async (skip = false) => {
    setSaving(true);
    try {
      const payload = skip
        ? { onboardingCompleted: true }
        : {
            preferredRoles: selectedRoles,
            experienceLevel,
            skills,
            interests,
            availability,
            onboardingCompleted: true,
          };

      await api.put('/users/me', payload);
      await refreshMe();
      toast.success(skip ? 'Profile setup can be completed anytime in Profile.' : 'Welcome to DevSync! 🚀');
    } catch (err) {
      toast.error(apiError(err, 'Failed to save onboarding information.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.98, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-elevated relative overflow-hidden"
      >
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Step {step} of 3
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {step === 1 && 'What roles fit you best?'}
                {step === 2 && 'Highlight your skills & domains'}
                {step === 3 && 'Availability & visibility'}
              </h2>
            </div>
            <button
              onClick={() => handleFinish(true)}
              className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline cursor-pointer"
            >
              Skip
            </button>
          </div>

          {/* Progress track */}
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          {/* Step 1: Roles & Experience */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Select your primary team roles (1 to 5):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((role) => {
                    const active = selectedRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className={`p-3 rounded-xl text-xs font-medium text-left transition-all border ${
                          active
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-500 dark:text-indigo-300 shadow-sm'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{role}</span>
                          {active && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Experience level:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setExperienceLevel(lvl)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium transition-all border text-center ${
                        experienceLevel === lvl
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-500 dark:text-indigo-300 shadow-sm'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Skills & Interests */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <SkillPicker
                  label="Key technical & design skills"
                  value={skills}
                  onChange={setSkills}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Interests & Domains (e.g. AI, Fintech, HealthTech, Web3)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    className="input text-xs"
                    placeholder="Type an interest..."
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addInterest();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addInterest}
                    className="btn-primary btn-sm shrink-0"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {interests.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 text-xs px-2.5 py-1 rounded-lg"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeInterest(tag)}
                        className="hover:text-indigo-900 dark:hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Availability */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Are you currently looking for a hackathon team?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAvailability('available')}
                    className={`p-4 rounded-xl text-left border transition-all ${
                      availability === 'available'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-600 dark:text-emerald-300 shadow-sm'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-semibold text-sm">● Available</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Ready to team up and build something ambitious.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAvailability('busy')}
                    className={`p-4 rounded-xl text-left border transition-all ${
                      availability === 'busy'
                        ? 'bg-slate-100 border-slate-400 text-slate-800 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 shadow-sm'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-semibold text-sm">○ Busy / Browsing</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Just checking out projects and connecting.
                    </p>
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/40 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong>DevSync matching engine ready:</strong> We'll use your skills and interests to find compatible teammates with complementary superpowers.
                </span>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-5 mt-6 border-t border-slate-100 dark:border-slate-800">
            {step > 1 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              {step < 3 ? (
                <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                  Next Step →
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleFinish(false)}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Finish Setup'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
