import React, { useState, useEffect, useMemo } from 'react';
import type { Challenge, ChallengeProgress } from '../types';
import { IconTarget, IconUsers, IconTrophy, IconPlus, IconCheck, IconX, IconEdit, IconCalendar, IconStar, IconHeart, IconBrain, IconPalette, IconDumbbell } from '@tabler/icons-react';

const CHALLENGE_CATEGORIES = [
  { type: 'focus', name: 'Focus', icon: IconBrain, description: 'Improve concentration and productivity' },
  { type: 'habit', name: 'Habits', icon: IconCheck, description: 'Build positive daily routines' },
  { type: 'social', name: 'Social', icon: IconUsers, description: 'Enhance social connections' },
  { type: 'learning', name: 'Learning', icon: IconStar, description: 'Acquire new skills and knowledge' },
  { type: 'creative', name: 'Creative', icon: IconPalette, description: 'Express creativity and innovation' },
  { type: 'health', name: 'Health', icon: IconHeart, description: 'Improve physical and mental wellness' },
] as const;

const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard', 'expert'] as const;

const ChallengeSystem = ({ theme, themes, showToast }: { theme: any, themes: any, showToast: (message: string, type?: 'success' | 'error' | 'info') => void }) => {
  const [challenges, setChallenges] = useState<Challenge[]>(() => {
    const raw = localStorage.getItem('challenges');
    return raw ? JSON.parse(raw) : [];
  });

  const [challengeProgress, setChallengeProgress] = useState<ChallengeProgress[]>(() => {
    const raw = localStorage.getItem('challengeProgress');
    return raw ? JSON.parse(raw) : [];
  });

  const [challengeModal, setChallengeModal] = useState(false);
  const [progressModal, setProgressModal] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Challenge['category'] | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Challenge['difficulty'] | 'all'>('all');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const [form, setForm] = useState<Omit<Challenge, 'id' | 'createdAt'>>({
    name: '',
    description: '',
    category: 'focus',
    difficulty: 'medium',
    duration: 7,
    startDate: Date.now(),
    endDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
    rewards: [],
    supportSystem: [],
    isActive: true,
    participants: [],
    creator: 'You',
  });

  const [rewardInput, setRewardInput] = useState('');
  const [supportInput, setSupportInput] = useState('');

  useEffect(() => {
    localStorage.setItem('challenges', JSON.stringify(challenges));
  }, [challenges]);

  useEffect(() => {
    localStorage.setItem('challengeProgress', JSON.stringify(challengeProgress));
  }, [challengeProgress]);

  const handleChallengeSubmit = () => {
    if (!form.name.trim() || !form.description.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const newChallenge: Challenge = {
      ...form,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };

    setChallenges(prev => [newChallenge, ...prev]);
    setChallengeModal(false);
    showToast('Challenge created successfully!', 'success');

    // Reset form
    setForm({
      name: '',
      description: '',
      category: 'focus',
      difficulty: 'medium',
      duration: 7,
      startDate: Date.now(),
      endDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
      rewards: [],
      supportSystem: [],
      isActive: true,
      participants: [],
      creator: 'You',
    });
    setRewardInput('');
    setSupportInput('');
  };

  const joinChallenge = (challengeId: string) => {
    setChallenges(prev => prev.map(challenge =>
      challenge.id === challengeId
        ? { ...challenge, participants: [...challenge.participants, 'You'] }
        : challenge
    ));

    // Initialize progress
    const challenge = challenges.find(c => c.id === challengeId);
    if (challenge) {
      const newProgress: ChallengeProgress = {
        id: Date.now().toString(),
        challengeId,
        userId: 'You',
        currentValue: 0,
        targetValue: challenge.duration,
        lastUpdated: Date.now(),
        notes: '',
        mood: '',
        energy: 5,
      };
      setChallengeProgress(prev => [...prev, newProgress]);
    }

    showToast('Joined challenge!', 'success');
  };

  const leaveChallenge = (challengeId: string) => {
    setChallenges(prev => prev.map(challenge =>
      challenge.id === challengeId
        ? { ...challenge, participants: challenge.participants.filter(p => p !== 'You') }
        : challenge
    ));

    // Remove progress
    setChallengeProgress(prev => prev.filter(p => !(p.challengeId === challengeId && p.userId === 'You')));
    showToast('Left challenge', 'info');
  };

  const updateProgress = (challengeId: string, value: number, notes: string, mood: string, energy: number) => {
    setChallengeProgress(prev => prev.map(progress =>
      progress.challengeId === challengeId && progress.userId === 'You'
        ? { ...progress, currentValue: progress.currentValue + value, lastUpdated: Date.now(), notes, mood, energy }
        : progress
    ));
    setProgressModal(null);
    showToast('Progress updated!', 'success');
  };

  const addReward = () => {
    if (rewardInput.trim()) {
      setForm(f => ({ ...f, rewards: [...f.rewards, rewardInput.trim()] }));
      setRewardInput('');
    }
  };

  const addSupport = () => {
    if (supportInput.trim()) {
      setForm(f => ({ ...f, supportSystem: [...f.supportSystem, supportInput.trim()] }));
      setSupportInput('');
    }
  };

  const getDifficultyColor = (difficulty: Challenge['difficulty']) => {
    switch (difficulty) {
      case 'expert': return '#dc3545';
      case 'hard': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'easy': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getDifficultyIcon = (difficulty: Challenge['difficulty']) => {
    switch (difficulty) {
      case 'expert': return <IconTrophy size={16} />;
      case 'hard': return <IconStar size={16} />;
      case 'medium': return <IconTarget size={16} />;
      case 'easy': return <IconCheck size={16} />;
      default: return <IconTarget size={16} />;
    }
  };

  const getCategoryIcon = (category: Challenge['category']) => {
    const cat = CHALLENGE_CATEGORIES.find(c => c.type === category);
    return cat?.icon || IconTarget;
  };

  const getProgressPercentage = (challengeId: string) => {
    const progress = challengeProgress.find(p => p.challengeId === challengeId && p.userId === 'You');
    if (!progress) return 0;
    return Math.min((progress.currentValue / progress.targetValue) * 100, 100);
  };

  const getDaysRemaining = (endDate: number) => {
    const diff = endDate - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const isParticipating = (challengeId: string) => {
    return challengeProgress.some(p => p.challengeId === challengeId && p.userId === 'You');
  };

  const filteredChallenges = useMemo(() => {
    let filtered = challenges;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }
    
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(c => c.difficulty === selectedDifficulty);
    }
    
    if (showActiveOnly) {
      filtered = filtered.filter(c => c.isActive && c.endDate > Date.now());
    }
    
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  }, [challenges, selectedCategory, selectedDifficulty, showActiveOnly]);

  const activeChallenges = challenges.filter(c => c.isActive && c.endDate > Date.now());
  const completedChallenges = challenges.filter(c => c.endDate <= Date.now());
  const myChallenges = challengeProgress.filter(p => p.userId === 'You');

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12, color: themes[theme].primary }}>
        <IconTarget style={{ marginRight: 8 }} />
        Challenge System
      </h2>

      {/* Stats */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 4px #0001', minWidth: 120 }}>
          <div style={{ fontSize: '1.2em', fontWeight: 700, color: themes[theme].primary }}>{activeChallenges.length}</div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>Active Challenges</div>
        </div>
        <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 4px #0001', minWidth: 120 }}>
          <div style={{ fontSize: '1.2em', fontWeight: 700, color: '#28a745' }}>{myChallenges.length}</div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>My Challenges</div>
        </div>
        <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 4px #0001', minWidth: 120 }}>
          <div style={{ fontSize: '1.2em', fontWeight: 700, color: '#ffc107' }}>{completedChallenges.length}</div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>Completed</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['all', ...CHALLENGE_CATEGORIES.map(c => c.type)] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              background: selectedCategory === cat ? themes[theme].primary : '#f0f0f0',
              color: selectedCategory === cat ? '#fff' : '#333',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: '0.9em',
              fontWeight: 600
            }}
          >
            {cat === 'all' ? 'All' : CHALLENGE_CATEGORIES.find(c => c.type === cat)?.name || cat}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['all', ...DIFFICULTY_LEVELS] as const).map(difficulty => (
          <button
            key={difficulty}
            onClick={() => setSelectedDifficulty(difficulty)}
            style={{
              background: selectedDifficulty === difficulty ? getDifficultyColor(difficulty) : '#f0f0f0',
              color: selectedDifficulty === difficulty ? '#fff' : '#333',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: '0.9em',
              fontWeight: 600
            }}
          >
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </button>
        ))}
        <label style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="checkbox"
            checked={showActiveOnly}
            onChange={e => setShowActiveOnly(e.target.checked)}
          />
          <span style={{ fontSize: '0.9em' }}>Active Only</span>
        </label>
      </div>

      {/* Create Challenge Button */}
      <button
        onClick={() => setChallengeModal(true)}
        style={{
          background: themes[theme].primary,
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '0.7em 1.5em',
          fontWeight: 600,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}
      >
        <IconPlus size={16} />
        Create Challenge
      </button>

      {/* Challenges List */}
      {filteredChallenges.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          <IconTarget size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <p>No challenges found. Create your first challenge to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredChallenges.map(challenge => {
            const IconComponent = getCategoryIcon(challenge.category);
            const progressPercentage = getProgressPercentage(challenge.id);
            const daysRemaining = getDaysRemaining(challenge.endDate);
            const participating = isParticipating(challenge.id);
            
            return (
              <div key={challenge.id} style={{
                background: '#fff',
                borderRadius: 12,
                padding: 20,
                boxShadow: '0 2px 8px #0001',
                borderLeft: `4px solid ${getDifficultyColor(challenge.difficulty)}`
              }}>
                {/* Challenge Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      background: getDifficultyColor(challenge.difficulty),
                      color: '#fff',
                      borderRadius: 8,
                      padding: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1em', fontWeight: 700, color: '#333' }}>
                        {challenge.name}
                      </h3>
                      <div style={{ fontSize: '0.9em', color: '#666', marginTop: 4 }}>
                        {challenge.category} • {challenge.difficulty} • {challenge.duration} days
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      background: getDifficultyColor(challenge.difficulty),
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: '0.8em',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      {getDifficultyIcon(challenge.difficulty)}
                      {challenge.difficulty.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p style={{ margin: '0 0 12px 0', fontSize: '0.95em', color: '#555', lineHeight: 1.5 }}>
                  {challenge.description}
                </p>

                {/* Progress Bar */}
                {participating && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ 
                      background: '#f0f0f0', 
                      borderRadius: 8, 
                      height: 12, 
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div style={{
                        background: getDifficultyColor(challenge.difficulty),
                        height: '100%',
                        width: `${progressPercentage}%`,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '0.9em', 
                      color: '#666', 
                      marginTop: 4 
                    }}>
                      <span>{progressPercentage.toFixed(1)}% Complete</span>
                      <span>{daysRemaining} days left</span>
                    </div>
                  </div>
                )}

                {/* Rewards and Support */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {challenge.rewards.slice(0, 3).map((reward, idx) => (
                    <span key={idx} style={{
                      background: '#e3f2fd',
                      color: '#1976d2',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: '0.8em'
                    }}>
                      🎁 {reward}
                    </span>
                  ))}
                  {challenge.supportSystem.slice(0, 2).map((support, idx) => (
                    <span key={idx} style={{
                      background: '#f3e5f5',
                      color: '#7b1fa2',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: '0.8em'
                    }}>
                      💪 {support}
                    </span>
                  ))}
                </div>

                {/* Participants */}
                <div style={{ fontSize: '0.85em', color: '#666', marginBottom: 12 }}>
                  <IconUsers size={14} style={{ marginRight: 4 }} />
                  {challenge.participants.length} participants • Created by {challenge.creator}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {participating ? (
                    <>
                      <button
                        onClick={() => setProgressModal(challenge.id)}
                        style={{
                          background: themes[theme].primary,
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: '0.9em',
                          fontWeight: 600
                        }}
                      >
                        Update Progress
                      </button>
                      <button
                        onClick={() => leaveChallenge(challenge.id)}
                        style={{
                          background: '#dc3545',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: '0.9em',
                          fontWeight: 600
                        }}
                      >
                        Leave
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => joinChallenge(challenge.id)}
                      style={{
                        background: '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: '0.9em',
                        fontWeight: 600
                      }}
                    >
                      Join Challenge
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Challenge Creation Modal */}
      {challengeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>Create New Challenge</h3>
            <form onSubmit={e => { e.preventDefault(); handleChallengeSubmit(); }}>
              <label>Challenge Name: *
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="e.g., 30-Day Focus Challenge"
                />
              </label>

              <label>Description: *
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="Describe what participants need to do..."
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label>Category:
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as Challenge['category'] }))}
                    style={{ width: '100%', marginTop: 4 }}
                  >
                    {CHALLENGE_CATEGORIES.map(cat => (
                      <option key={cat.type} value={cat.type}>{cat.name}</option>
                    ))}
                  </select>
                </label>

                <label>Difficulty:
                  <select
                    value={form.difficulty}
                    onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as Challenge['difficulty'] }))}
                    style={{ width: '100%', marginTop: 4 }}
                  >
                    {DIFFICULTY_LEVELS.map(difficulty => (
                      <option key={difficulty} value={difficulty}>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label>Duration (days):
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={form.duration}
                  onChange={e => {
                    const days = Number(e.target.value);
                    setForm(f => ({ 
                      ...f, 
                      duration: days,
                      endDate: f.startDate + (days * 24 * 60 * 60 * 1000)
                    }));
                  }}
                  style={{ width: '100%', marginTop: 4 }}
                />
              </label>

              {/* Rewards */}
              <div style={{ margin: '12px 0' }}>
                <label>Rewards:
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <input
                      type="text"
                      value={rewardInput}
                      onChange={e => setRewardInput(e.target.value)}
                      style={{ flex: 1 }}
                      placeholder="e.g., Sense of accomplishment"
                    />
                    <button type="button" onClick={addReward} style={{ background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px' }}>
                      Add
                    </button>
                  </div>
                </label>
                {form.rewards.length > 0 && (
                  <div style={{ fontSize: '0.9em', color: '#666', marginTop: 4 }}>
                    {form.rewards.join(', ')}
                  </div>
                )}
              </div>

              {/* Support System */}
              <div style={{ margin: '12px 0' }}>
                <label>Support System:
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <input
                      type="text"
                      value={supportInput}
                      onChange={e => setSupportInput(e.target.value)}
                      style={{ flex: 1 }}
                      placeholder="e.g., Daily check-ins"
                    />
                    <button type="button" onClick={addSupport} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px' }}>
                      Add
                    </button>
                  </div>
                </label>
                {form.supportSystem.length > 0 && (
                  <div style={{ fontSize: '0.9em', color: '#666', marginTop: 4 }}>
                    {form.supportSystem.join(', ')}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setChallengeModal(false)} style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>
                  Create Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Update Modal */}
      {progressModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320 }}>
            <h3>Update Progress</h3>
            <form onSubmit={e => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              updateProgress(
                progressModal,
                Number(formData.get('value')),
                formData.get('notes') as string,
                formData.get('mood') as string,
                Number(formData.get('energy'))
              );
            }}>
              <label>Progress Value:
                <input type="number" name="value" min={0} required style={{ width: '100%', marginTop: 4 }} />
              </label>
              <label>Notes:
                <textarea name="notes" style={{ width: '100%', marginTop: 4 }} />
              </label>
              <label>Mood:
                <input type="text" name="mood" style={{ width: '100%', marginTop: 4 }} placeholder="e.g., motivated, tired" />
              </label>
              <label>Energy Level (1-10):
                <input type="number" name="energy" min={1} max={10} style={{ width: '100%', marginTop: 4 }} />
              </label>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setProgressModal(null)} style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>
                  Update Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeSystem; 