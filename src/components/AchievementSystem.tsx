import React, { useState, useEffect, useMemo } from 'react';
import type { Achievement, AchievementProgress } from '../types';
import { IconTrophy, IconStar, IconTarget, IconBrain, IconUsers, IconFocus, IconRefresh, IconCrown, IconGem, IconAward } from '@tabler/icons-react';

const ACHIEVEMENTS: Omit<Achievement, 'id' | 'isUnlocked' | 'unlockedAt'>[] = [
  // Streak Achievements
  {
    name: 'Getting Started',
    description: 'Complete your first focus session',
    category: 'streak',
    icon: '🎯',
    criteria: { type: 'focus_sessions', count: 1 },
    points: 10,
    rarity: 'common'
  },
  {
    name: 'Focus Warrior',
    description: 'Complete 7 focus sessions in a week',
    category: 'streak',
    icon: '⚔️',
    criteria: { type: 'focus_sessions', count: 7, timeframe: 'week' },
    points: 50,
    rarity: 'rare'
  },
  {
    name: 'Unstoppable',
    description: 'Maintain a 30-day focus streak',
    category: 'streak',
    icon: '🔥',
    criteria: { type: 'focus_sessions', count: 30, timeframe: 'consecutive' },
    points: 200,
    rarity: 'epic'
  },
  {
    name: 'Legendary Focus',
    description: 'Complete 100 focus sessions',
    category: 'streak',
    icon: '👑',
    criteria: { type: 'focus_sessions', count: 100 },
    points: 500,
    rarity: 'legendary'
  },

  // Milestone Achievements
  {
    name: 'Goal Setter',
    description: 'Create your first goal',
    category: 'milestone',
    icon: '🎯',
    criteria: { type: 'goals_created', count: 1 },
    points: 15,
    rarity: 'common'
  },
  {
    name: 'Goal Crusher',
    description: 'Complete 5 goals',
    category: 'milestone',
    icon: '🏆',
    criteria: { type: 'goals_completed', count: 5 },
    points: 100,
    rarity: 'rare'
  },
  {
    name: 'Master Achiever',
    description: 'Complete 25 goals',
    category: 'milestone',
    icon: '💎',
    criteria: { type: 'goals_completed', count: 25 },
    points: 300,
    rarity: 'epic'
  },

  // Pattern Recognition
  {
    name: 'Self-Aware',
    description: 'Log 10 mood entries',
    category: 'pattern',
    icon: '🧠',
    criteria: { type: 'mood_entries', count: 10 },
    points: 25,
    rarity: 'common'
  },
  {
    name: 'Pattern Master',
    description: 'Discover 5 patterns',
    category: 'pattern',
    icon: '🔍',
    criteria: { type: 'patterns_discovered', count: 5 },
    points: 150,
    rarity: 'rare'
  },
  {
    name: 'Mind Reader',
    description: 'Log 100 mood entries',
    category: 'pattern',
    icon: '🔮',
    criteria: { type: 'mood_entries', count: 100 },
    points: 400,
    rarity: 'epic'
  },

  // Social Achievements
  {
    name: 'Social Butterfly',
    description: 'Log 5 social interactions',
    category: 'social',
    icon: '🦋',
    criteria: { type: 'social_entries', count: 5 },
    points: 30,
    rarity: 'common'
  },
  {
    name: 'Connection Builder',
    description: 'Log 25 social interactions',
    category: 'social',
    icon: '🤝',
    criteria: { type: 'social_entries', count: 25 },
    points: 120,
    rarity: 'rare'
  },

  // Focus Achievements
  {
    name: 'Deep Diver',
    description: 'Complete a 60-minute focus session',
    category: 'focus',
    icon: '🌊',
    criteria: { type: 'focus_duration', minutes: 60 },
    points: 75,
    rarity: 'rare'
  },
  {
    name: 'Flow Master',
    description: 'Complete 10 deep focus sessions',
    category: 'focus',
    icon: '🌀',
    criteria: { type: 'deep_focus_sessions', count: 10 },
    points: 250,
    rarity: 'epic'
  },

  // Habit Achievements
  {
    name: 'Habit Former',
    description: 'Complete 7 days of any habit',
    category: 'habit',
    icon: '📅',
    criteria: { type: 'habit_streak', days: 7 },
    points: 40,
    rarity: 'common'
  },
  {
    name: 'Habit Master',
    description: 'Maintain a 21-day habit streak',
    category: 'habit',
    icon: '🎖️',
    criteria: { type: 'habit_streak', days: 21 },
    points: 180,
    rarity: 'rare'
  }
];

const AchievementSystem = ({ theme, themes, showToast }: { theme: any, themes: any, showToast: (message: string, type?: 'success' | 'error' | 'info') => void }) => {
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const raw = localStorage.getItem('achievements');
    return raw ? JSON.parse(raw) : ACHIEVEMENTS.map(a => ({ ...a, id: Date.now().toString() + Math.random(), isUnlocked: false }));
  });

  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress[]>(() => {
    const raw = localStorage.getItem('achievementProgress');
    return raw ? JSON.parse(raw) : [];
  });

  const [selectedCategory, setSelectedCategory] = useState<Achievement['category'] | 'all'>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [celebrationModal, setCelebrationModal] = useState<Achievement | null>(null);

  useEffect(() => {
    localStorage.setItem('achievements', JSON.stringify(achievements));
  }, [achievements]);

  useEffect(() => {
    localStorage.setItem('achievementProgress', JSON.stringify(achievementProgress));
  }, [achievementProgress]);

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'legendary': return '#ffd700';
      case 'epic': return '#9932cc';
      case 'rare': return '#4169e1';
      case 'common': return '#808080';
      default: return '#666';
    }
  };

  const getRarityIcon = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'legendary': return <IconCrown size={16} />;
      case 'epic': return <IconGem size={16} />;
      case 'rare': return <IconStar size={16} />;
      case 'common': return <IconAward size={16} />;
      default: return <IconAward size={16} />;
    }
  };

  const unlockAchievement = (achievementId: string) => {
    setAchievements(prev => prev.map(achievement =>
      achievement.id === achievementId
        ? { ...achievement, isUnlocked: true, unlockedAt: Date.now() }
        : achievement
    ));

    const achievement = achievements.find(a => a.id === achievementId);
    if (achievement) {
      setCelebrationModal(achievement);
      showToast(`🎉 Achievement Unlocked: ${achievement.name}!`, 'success');
    }
  };

  const updateProgress = (achievementId: string, currentValue: number) => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) return;

    const existingProgress = achievementProgress.find(p => p.achievementId === achievementId);
    
    if (existingProgress) {
      setAchievementProgress(prev => prev.map(p =>
        p.achievementId === achievementId
          ? { ...p, currentValue, lastUpdated: Date.now() }
          : p
      ));
    } else {
      const newProgress: AchievementProgress = {
        id: Date.now().toString(),
        achievementId,
        currentValue,
        targetValue: achievement.criteria.count || achievement.criteria.days || achievement.criteria.minutes || 1,
        lastUpdated: Date.now(),
      };
      setAchievementProgress(prev => [...prev, newProgress]);
    }

    // Check if achievement should be unlocked
    const targetValue = achievement.criteria.count || achievement.criteria.days || achievement.criteria.minutes || 1;
    if (currentValue >= targetValue && !achievement.isUnlocked) {
      unlockAchievement(achievementId);
    }
  };

  const getProgressPercentage = (achievementId: string) => {
    const progress = achievementProgress.find(p => p.achievementId === achievementId);
    if (!progress) return 0;
    return Math.min((progress.currentValue / progress.targetValue) * 100, 100);
  };

  const getProgressText = (achievementId: string) => {
    const progress = achievementProgress.find(p => p.achievementId === achievementId);
    if (!progress) return '0%';
    return `${Math.min(progress.currentValue, progress.targetValue)}/${progress.targetValue}`;
  };

  const filteredAchievements = useMemo(() => {
    let filtered = achievements;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }
    
    if (showUnlockedOnly) {
      filtered = filtered.filter(a => a.isUnlocked);
    }
    
    return filtered.sort((a, b) => {
      // Sort by rarity first, then by points
      const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
      const rarityDiff = rarityOrder[a.rarity] - rarityOrder[b.rarity];
      if (rarityDiff !== 0) return rarityDiff;
      return b.points - a.points;
    });
  }, [achievements, selectedCategory, showUnlockedOnly]);

  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const totalPoints = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);
  const totalAchievements = achievements.length;
  const unlockedCount = unlockedAchievements.length;

  const categories: Achievement['category'][] = ['streak', 'milestone', 'pattern', 'social', 'focus', 'habit'];

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12, color: themes[theme].primary }}>
        <IconTrophy style={{ marginRight: 8 }} />
        Achievement System
      </h2>

      {/* Stats */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 4px #0001', minWidth: 120 }}>
          <div style={{ fontSize: '1.2em', fontWeight: 700, color: themes[theme].primary }}>{unlockedCount}/{totalAchievements}</div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>Achievements</div>
        </div>
        <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 4px #0001', minWidth: 120 }}>
          <div style={{ fontSize: '1.2em', fontWeight: 700, color: '#ffd700' }}>{totalPoints}</div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>Total Points</div>
        </div>
        <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 4px #0001', minWidth: 120 }}>
          <div style={{ fontSize: '1.2em', fontWeight: 700, color: '#9932cc' }}>{Math.round((unlockedCount / totalAchievements) * 100)}%</div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>Completion</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['all', ...categories] as const).map(cat => (
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
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
        <label style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="checkbox"
            checked={showUnlockedOnly}
            onChange={e => setShowUnlockedOnly(e.target.checked)}
          />
          <span style={{ fontSize: '0.9em' }}>Show Unlocked Only</span>
        </label>
      </div>

      {/* Achievements Grid */}
      {filteredAchievements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          <IconTrophy size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <p>No achievements found. Try changing your filters!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filteredAchievements.map(achievement => {
            const progressPercentage = getProgressPercentage(achievement.id);
            const progressText = getProgressText(achievement.id);
            
            return (
              <div key={achievement.id} style={{
                background: '#fff',
                borderRadius: 12,
                padding: 20,
                boxShadow: '0 2px 8px #0001',
                border: achievement.isUnlocked ? `3px solid ${getRarityColor(achievement.rarity)}` : '2px solid #f0f0f0',
                opacity: achievement.isUnlocked ? 1 : 0.8,
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Rarity Badge */}
                <div style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: getRarityColor(achievement.rarity),
                  fontSize: '0.8em',
                  fontWeight: 600
                }}>
                  {getRarityIcon(achievement.rarity)}
                  {achievement.rarity.toUpperCase()}
                </div>

                {/* Achievement Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    fontSize: '2em',
                    filter: achievement.isUnlocked ? 'none' : 'grayscale(100%)'
                  }}>
                    {achievement.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: '1.1em', 
                      fontWeight: 700, 
                      color: achievement.isUnlocked ? '#333' : '#666',
                      textDecoration: achievement.isUnlocked ? 'none' : 'line-through'
                    }}>
                      {achievement.name}
                    </h3>
                    <div style={{ fontSize: '0.9em', color: '#666', marginTop: 4 }}>
                      {achievement.description}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {!achievement.isUnlocked && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ 
                      background: '#f0f0f0', 
                      borderRadius: 8, 
                      height: 8, 
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div style={{
                        background: getRarityColor(achievement.rarity),
                        height: '100%',
                        width: `${progressPercentage}%`,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '0.85em', 
                      color: '#666', 
                      marginTop: 4 
                    }}>
                      <span>{progressText}</span>
                      <span>{progressPercentage.toFixed(0)}%</span>
                    </div>
                  </div>
                )}

                {/* Points and Category */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    background: getRarityColor(achievement.rarity),
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: '0.8em',
                    fontWeight: 600
                  }}>
                    {achievement.points} pts
                  </div>
                  <div style={{ fontSize: '0.85em', color: '#666' }}>
                    {achievement.category}
                  </div>
                </div>

                {/* Unlocked Date */}
                {achievement.isUnlocked && achievement.unlockedAt && (
                  <div style={{ 
                    fontSize: '0.8em', 
                    color: '#28a745', 
                    marginTop: 8,
                    fontWeight: 600
                  }}>
                    ✓ Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Celebration Modal */}
      {celebrationModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.8)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ 
            background: '#fff', 
            borderRadius: 20, 
            padding: 40, 
            textAlign: 'center',
            maxWidth: 400,
            animation: 'scaleIn 0.5s ease'
          }}>
            <div style={{ fontSize: '4em', marginBottom: 16 }}>
              {celebrationModal.icon}
            </div>
            <h2 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '1.5em', 
              fontWeight: 700, 
              color: getRarityColor(celebrationModal.rarity)
            }}>
              🎉 Achievement Unlocked! 🎉
            </h2>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2em', fontWeight: 600 }}>
              {celebrationModal.name}
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '1em', color: '#666', lineHeight: 1.5 }}>
              {celebrationModal.description}
            </p>
            <div style={{
              background: getRarityColor(celebrationModal.rarity),
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: '1.1em',
              fontWeight: 600,
              display: 'inline-block'
            }}>
              +{celebrationModal.points} Points!
            </div>
            <button
              onClick={() => setCelebrationModal(null)}
              style={{
                background: themes[theme].primary,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 24px',
                fontSize: '1em',
                fontWeight: 600,
                marginTop: 20,
                cursor: 'pointer'
              }}
            >
              Awesome!
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.8); }
          to { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default AchievementSystem; 