import React, { useState, useEffect, useMemo } from 'react';
import type { Goal, Milestone, GoalProgress } from '../types';
import { IconTrophy, IconTarget, IconFlag, IconPlus, IconEdit, IconCheck, IconX } from '@tabler/icons-react';

const GOAL_CATEGORIES = ['personal', 'work', 'health', 'learning', 'creative'] as const;

const GoalTracker = ({ theme, themes, showToast }: { theme: any, themes: any, showToast: (message: string, type?: 'success' | 'error' | 'info') => void }) => {
  const [goals, setGoals] = useState<Goal[]>(() => {
    const raw = localStorage.getItem('goals');
    return raw ? JSON.parse(raw) : [];
  });
  
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>(() => {
    const raw = localStorage.getItem('goalProgress');
    return raw ? JSON.parse(raw) : [];
  });
  
  const [goalModal, setGoalModal] = useState(false);
  const [progressModal, setProgressModal] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Goal['category'] | 'all'>('all');
  
  const [form, setForm] = useState<Omit<Goal, 'id' | 'createdAt'>>({
    name: '',
    description: '',
    category: 'personal',
    targetValue: 0,
    currentValue: 0,
    unit: '',
    deadline: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
    milestones: [],
    obstacles: [],
    strategies: [],
    isActive: true,
  });

  const [milestoneInput, setMilestoneInput] = useState('');
  const [obstacleInput, setObstacleInput] = useState('');
  const [strategyInput, setStrategyInput] = useState('');

  useEffect(() => {
    localStorage.setItem('goals', JSON.stringify(goals));
  }, [goals]);
  
  useEffect(() => {
    localStorage.setItem('goalProgress', JSON.stringify(goalProgress));
  }, [goalProgress]);

  const handleGoalSubmit = () => {
    if (!form.name.trim() || !form.unit.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const newGoal: Goal = {
      ...form,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    
    setGoals(prev => [newGoal, ...prev]);
    setGoalModal(false);
    showToast('Goal created successfully!', 'success');
    
    // Reset form
    setForm({
      name: '',
      description: '',
      category: 'personal',
      targetValue: 0,
      currentValue: 0,
      unit: '',
      deadline: Date.now() + 30 * 24 * 60 * 60 * 1000,
      milestones: [],
      obstacles: [],
      strategies: [],
      isActive: true,
    });
    setMilestoneInput('');
    setObstacleInput('');
    setStrategyInput('');
  };

  const handleProgressSubmit = (goalId: string, value: number, notes: string, mood: string, energy: number) => {
    const newProgress: GoalProgress = {
      id: Date.now().toString(),
      goalId,
      value,
      notes,
      timestamp: Date.now(),
      mood,
      energy,
    };
    
    setGoalProgress(prev => [newProgress, ...prev]);
    
    // Update goal current value
    setGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? { ...goal, currentValue: goal.currentValue + value }
        : goal
    ));
    
    setProgressModal(null);
    showToast('Progress logged!', 'success');
  };

  const toggleGoalStatus = (goalId: string) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? { ...goal, isActive: !goal.isActive }
        : goal
    ));
  };

  const addMilestone = () => {
    if (milestoneInput.trim()) {
      const newMilestone: Milestone = {
        id: Date.now().toString(),
        name: milestoneInput.trim(),
        targetValue: form.targetValue * 0.25, // Default to 25% of target
        achieved: false,
      };
      setForm(f => ({ ...f, milestones: [...f.milestones, newMilestone] }));
      setMilestoneInput('');
    }
  };

  const addObstacle = () => {
    if (obstacleInput.trim()) {
      setForm(f => ({ ...f, obstacles: [...f.obstacles, obstacleInput.trim()] }));
      setObstacleInput('');
    }
  };

  const addStrategy = () => {
    if (strategyInput.trim()) {
      setForm(f => ({ ...f, strategies: [...f.strategies, strategyInput.trim()] }));
      setStrategyInput('');
    }
  };

  const filteredGoals = useMemo(() => {
    if (selectedCategory === 'all') return goals;
    return goals.filter(goal => goal.category === selectedCategory);
  }, [goals, selectedCategory]);

  const activeGoals = filteredGoals.filter(goal => goal.isActive);
  const completedGoals = filteredGoals.filter(goal => goal.currentValue >= goal.targetValue);

  const getProgressPercentage = (goal: Goal) => {
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  };

  const getDaysUntilDeadline = (deadline: number) => {
    const days = Math.ceil((deadline - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const getGoalProgress = (goalId: string) => {
    return goalProgress.filter(p => p.goalId === goalId);
  };
  
  return (
    <div style={{ margin: '2rem 0' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12, color: themes[theme].primary }}>
        <IconTrophy style={{ marginRight: 8 }} />
        Goal Tracker
      </h2>
      
      {/* Category Filter */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['all', ...GOAL_CATEGORIES] as const).map(cat => (
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
      </div>

      {/* Goal Stats */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 4px #0001', minWidth: 120 }}>
          <div style={{ fontSize: '1.2em', fontWeight: 700, color: themes[theme].primary }}>{activeGoals.length}</div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>Active Goals</div>
        </div>
        <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 4px #0001', minWidth: 120 }}>
          <div style={{ fontSize: '1.2em', fontWeight: 700, color: '#28a745' }}>{completedGoals.length}</div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>Completed</div>
        </div>
      </div>

      {/* Create Goal Button */}
      <button 
        onClick={() => setGoalModal(true)} 
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
        Create New Goal
      </button>

      {/* Goals List */}
      {activeGoals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          <IconTarget size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <p>No active goals yet. Create your first goal to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {activeGoals.map(goal => {
            const progress = getProgressPercentage(goal);
            const daysLeft = getDaysUntilDeadline(goal.deadline);
            const recentProgress = getGoalProgress(goal.id).slice(0, 3);
            
            return (
              <div key={goal.id} style={{ 
                background: '#fff', 
                borderRadius: 12, 
                padding: 20, 
                boxShadow: '0 2px 8px #0001',
                borderLeft: `4px solid ${progress >= 100 ? '#28a745' : progress >= 75 ? '#ffc107' : themes[theme].primary}`
              }}>
                {/* Goal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1em', fontWeight: 700, color: '#333' }}>
                      {goal.name}
                    </h3>
                    <div style={{ fontSize: '0.9em', color: '#666', marginTop: 4 }}>
                      {goal.category} • {goal.currentValue}/{goal.targetValue} {goal.unit}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleGoalStatus(goal.id)}
                    style={{
                      background: goal.isActive ? '#dc3545' : '#28a745',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 8px',
                      fontSize: '0.8em',
                      fontWeight: 600
                    }}
                  >
                    {goal.isActive ? <IconX size={12} /> : <IconCheck size={12} />}
                  </button>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ 
                    background: '#f0f0f0', 
                    borderRadius: 8, 
                    height: 12, 
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      background: progress >= 100 ? '#28a745' : progress >= 75 ? '#ffc107' : themes[theme].primary,
                      height: '100%',
                      width: `${progress}%`,
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
                    <span>{progress.toFixed(1)}% Complete</span>
                    <span>{daysLeft} days left</span>
                  </div>
                </div>

                {/* Description */}
                {goal.description && (
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.95em', color: '#555', lineHeight: 1.5 }}>
                    {goal.description}
                  </p>
                )}

                {/* Milestones */}
                {goal.milestones.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, color: '#333', marginBottom: 8 }}>
                      <IconFlag size={16} style={{ marginRight: 6, color: themes[theme].primary }} />
                      Milestones
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {goal.milestones.map(milestone => (
                        <div key={milestone.id} style={{
                          background: milestone.achieved ? '#28a745' : '#f8f9fa',
                          color: milestone.achieved ? '#fff' : '#666',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: '0.85em',
                          fontWeight: 600
                        }}>
                          {milestone.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Progress */}
                {recentProgress.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, color: '#333', marginBottom: 8 }}>Recent Progress</div>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>
                      {recentProgress.map(prog => (
                        <div key={prog.id} style={{ marginBottom: 4 }}>
                          +{prog.value} {goal.unit} • {prog.mood} • Energy: {prog.energy}/10
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    onClick={() => setProgressModal(goal.id)}
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
                    Log Progress
                  </button>
                  <button
                    onClick={() => {/* Edit goal */}}
                    style={{
                      background: '#f8f9fa',
                      color: '#333',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 12px',
                      fontSize: '0.9em',
                      fontWeight: 600
                    }}
                  >
                    <IconEdit size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Creation Modal */}
      {goalModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>Create New Goal</h3>
            <form onSubmit={e => { e.preventDefault(); handleGoalSubmit(); }}>
              <label>Goal Name: *
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="e.g., Read 12 books this year"
                />
              </label>
              
              <label>Description:
                <textarea 
                  value={form.description} 
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="Why is this goal important to you?"
                />
              </label>
              
              <label>Category:
                <select 
                  value={form.category} 
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as Goal['category'] }))} 
                  style={{ width: '100%', marginTop: 4 }}
                >
                  {GOAL_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label>Target Value:
                  <input 
                    type="number" 
                    value={form.targetValue} 
                    onChange={e => setForm(f => ({ ...f, targetValue: Number(e.target.value) }))} 
                    style={{ width: '100%', marginTop: 4 }}
                  />
                </label>
                <label>Unit: *
                  <input 
                    type="text" 
                    value={form.unit} 
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} 
                    style={{ width: '100%', marginTop: 4 }}
                    placeholder="e.g., books, miles, hours"
                  />
                </label>
              </div>
              
              <label>Deadline:
                <input 
                  type="date" 
                  value={new Date(form.deadline).toISOString().split('T')[0]} 
                  onChange={e => setForm(f => ({ ...f, deadline: new Date(e.target.value).getTime() }))} 
                  style={{ width: '100%', marginTop: 4 }}
                />
              </label>

              {/* Milestones */}
              <div style={{ margin: '12px 0' }}>
                <label>Milestones:
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <input 
                      type="text" 
                      value={milestoneInput} 
                      onChange={e => setMilestoneInput(e.target.value)} 
                      style={{ flex: 1 }}
                      placeholder="e.g., Read 3 books"
                    />
                    <button type="button" onClick={addMilestone} style={{ background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px' }}>
                      Add
                    </button>
                  </div>
                </label>
                {form.milestones.length > 0 && (
                  <div style={{ fontSize: '0.9em', color: '#666', marginTop: 4 }}>
                    {form.milestones.map(m => m.name).join(', ')}
                  </div>
                )}
              </div>

              {/* Obstacles */}
              <div style={{ margin: '12px 0' }}>
                <label>Potential Obstacles:
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <input 
                      type="text" 
                      value={obstacleInput} 
                      onChange={e => setObstacleInput(e.target.value)} 
                      style={{ flex: 1 }}
                      placeholder="e.g., Lack of time"
                    />
                    <button type="button" onClick={addObstacle} style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px' }}>
                      Add
                    </button>
                  </div>
                </label>
                {form.obstacles.length > 0 && (
                  <div style={{ fontSize: '0.9em', color: '#666', marginTop: 4 }}>
                    {form.obstacles.join(', ')}
                  </div>
                )}
              </div>

              {/* Strategies */}
              <div style={{ margin: '12px 0' }}>
                <label>Strategies:
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <input 
                      type="text" 
                      value={strategyInput} 
                      onChange={e => setStrategyInput(e.target.value)} 
                      style={{ flex: 1 }}
                      placeholder="e.g., Read 30 minutes daily"
                    />
                    <button type="button" onClick={addStrategy} style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px' }}>
                      Add
                    </button>
                  </div>
                </label>
                {form.strategies.length > 0 && (
                  <div style={{ fontSize: '0.9em', color: '#666', marginTop: 4 }}>
                    {form.strategies.join(', ')}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setGoalModal(false)} style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Logging Modal */}
      {progressModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320 }}>
            <h3>Log Progress</h3>
            <form onSubmit={e => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleProgressSubmit(
                progressModal,
                Number(formData.get('value')),
                formData.get('notes') as string,
                formData.get('mood') as string,
                Number(formData.get('energy'))
              );
            }}>
              <label>Progress Value:
                <input type="number" name="value" required style={{ width: '100%', marginTop: 4 }} />
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
                  Log Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalTracker; 