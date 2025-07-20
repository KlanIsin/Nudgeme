import React, { useState, useEffect, useMemo } from 'react';
import type { Reminder, ReminderSettings } from '../types';
import { IconBell, IconClock, IconMapPin, IconZap, IconAlertTriangle, IconCheck, IconX, IconPlus, IconSettings } from '@tabler/icons-react';

const REMINDER_CATEGORIES = ['task', 'medication', 'appointment', 'habit', 'custom'] as const;
const PRIORITY_LEVELS = ['low', 'medium', 'high', 'urgent'] as const;

const IntelligentReminders = ({ theme, themes, showToast }: { theme: any, themes: any, showToast: (message: string, type?: 'success' | 'error' | 'info') => void }) => {
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const raw = localStorage.getItem('reminders');
    return raw ? JSON.parse(raw) : [];
  });

  const [settings, setSettings] = useState<ReminderSettings>(() => {
    const raw = localStorage.getItem('reminderSettings');
    return raw ? JSON.parse(raw) : {
      gentleEscalation: true,
      energyMatching: true,
      locationAware: true,
      quietHours: { start: 22, end: 8 },
      defaultPriority: 'medium',
      autoSnooze: true,
      snoozeDuration: 15,
    };
  });

  const [reminderModal, setReminderModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<Reminder['priority'] | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<Reminder['category'] | 'all'>('all');

  const [form, setForm] = useState<Omit<Reminder, 'id' | 'createdAt'>>({
    title: '',
    description: '',
    dueDate: Date.now() + 60 * 60 * 1000, // 1 hour from now
    priority: 'medium',
    category: 'task',
    energyLevel: 5,
    location: '',
    context: [],
    escalation: false,
    escalationSteps: [],
    isActive: true,
  });

  const [contextInput, setContextInput] = useState('');
  const [escalationStepInput, setEscalationStepInput] = useState('');

  useEffect(() => {
    localStorage.setItem('reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('reminderSettings', JSON.stringify(settings));
  }, [settings]);

  const handleReminderSubmit = () => {
    if (!form.title.trim()) {
      showToast('Please enter a reminder title', 'error');
      return;
    }

    const newReminder: Reminder = {
      ...form,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };

    setReminders(prev => [newReminder, ...prev]);
    setReminderModal(false);
    showToast('Reminder created!', 'success');

    // Reset form
    setForm({
      title: '',
      description: '',
      dueDate: Date.now() + 60 * 60 * 1000,
      priority: 'medium',
      category: 'task',
      energyLevel: 5,
      location: '',
      context: [],
      escalation: false,
      escalationSteps: [],
      isActive: true,
    });
    setContextInput('');
    setEscalationStepInput('');
  };

  const completeReminder = (reminderId: string) => {
    setReminders(prev => prev.map(reminder =>
      reminder.id === reminderId
        ? { ...reminder, completedAt: Date.now(), isActive: false }
        : reminder
    ));
    showToast('Reminder completed!', 'success');
  };

  const snoozeReminder = (reminderId: string) => {
    const snoozeUntil = Date.now() + (settings.snoozeDuration * 60 * 1000);
    setReminders(prev => prev.map(reminder =>
      reminder.id === reminderId
        ? { ...reminder, snoozedUntil: snoozeUntil }
        : reminder
    ));
    showToast(`Reminder snoozed for ${settings.snoozeDuration} minutes`, 'info');
  };

  const addContext = () => {
    if (contextInput.trim()) {
      setForm(f => ({ ...f, context: [...f.context, contextInput.trim()] }));
      setContextInput('');
    }
  };

  const addEscalationStep = () => {
    if (escalationStepInput.trim()) {
      setForm(f => ({ ...f, escalationSteps: [...f.escalationSteps, escalationStepInput.trim()] }));
      setEscalationStepInput('');
    }
  };

  const getPriorityColor = (priority: Reminder['priority']) => {
    switch (priority) {
      case 'urgent': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getPriorityIcon = (priority: Reminder['priority']) => {
    switch (priority) {
      case 'urgent': return <IconAlertTriangle size={16} />;
      case 'high': return <IconAlertTriangle size={16} />;
      case 'medium': return <IconClock size={16} />;
      case 'low': return <IconCheck size={16} />;
      default: return <IconBell size={16} />;
    }
  };

  const isInQuietHours = () => {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= settings.quietHours.start || currentHour < settings.quietHours.end;
  };

  const shouldShowReminder = (reminder: Reminder) => {
    if (!reminder.isActive) return false;
    if (reminder.completedAt) return false;
    if (reminder.snoozedUntil && reminder.snoozedUntil > Date.now()) return false;
    if (settings.energyMatching && reminder.energyLevel > 7) return false; // Skip high-energy reminders when tired
    if (isInQuietHours() && reminder.priority !== 'urgent') return false;
    return true;
  };

  const filteredReminders = useMemo(() => {
    let filtered = reminders.filter(shouldShowReminder);
    
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(r => r.priority === selectedPriority);
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }
    
    return filtered.sort((a, b) => {
      // Sort by priority first, then by due date
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.dueDate - b.dueDate;
    });
  }, [reminders, selectedPriority, selectedCategory, settings]);

  const overdueReminders = filteredReminders.filter(r => r.dueDate < Date.now());
  const upcomingReminders = filteredReminders.filter(r => r.dueDate >= Date.now());

  const getTimeUntilDue = (dueDate: number) => {
    const diff = dueDate - Date.now();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (diff < 0) return 'Overdue';
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'Due now';
  };

  return (
    <div style={{ margin: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: themes[theme].primary }}>
          <IconBell style={{ marginRight: 8 }} />
          Intelligent Reminders
        </h2>
        <button
          onClick={() => setSettingsModal(true)}
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
          <IconSettings size={16} />
        </button>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['all', ...PRIORITY_LEVELS] as const).map(priority => (
          <button
            key={priority}
            onClick={() => setSelectedPriority(priority)}
            style={{
              background: selectedPriority === priority ? getPriorityColor(priority) : '#f0f0f0',
              color: selectedPriority === priority ? '#fff' : '#333',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: '0.9em',
              fontWeight: 600
            }}
          >
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['all', ...REMINDER_CATEGORIES] as const).map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            style={{
              background: selectedCategory === category ? themes[theme].primary : '#f0f0f0',
              color: selectedCategory === category ? '#fff' : '#333',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: '0.9em',
              fontWeight: 600
            }}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 4px #0001', minWidth: 120 }}>
          <div style={{ fontSize: '1.2em', fontWeight: 700, color: '#dc3545' }}>{overdueReminders.length}</div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>Overdue</div>
        </div>
        <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 4px #0001', minWidth: 120 }}>
          <div style={{ fontSize: '1.2em', fontWeight: 700, color: themes[theme].primary }}>{upcomingReminders.length}</div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>Upcoming</div>
        </div>
      </div>

      {/* Create Reminder Button */}
      <button
        onClick={() => setReminderModal(true)}
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
        Create Reminder
      </button>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          <IconBell size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <p>No active reminders. Create your first reminder to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredReminders.map(reminder => {
            const isOverdue = reminder.dueDate < Date.now();
            const timeUntilDue = getTimeUntilDue(reminder.dueDate);
            
            return (
              <div key={reminder.id} style={{
                background: '#fff',
                borderRadius: 12,
                padding: 16,
                boxShadow: '0 2px 8px #0001',
                borderLeft: `4px solid ${getPriorityColor(reminder.priority)}`,
                opacity: reminder.snoozedUntil && reminder.snoozedUntil > Date.now() ? 0.6 : 1
              }}>
                {/* Reminder Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {getPriorityIcon(reminder.priority)}
                      <h3 style={{ margin: 0, fontSize: '1.1em', fontWeight: 700, color: '#333' }}>
                        {reminder.title}
                      </h3>
                      <span style={{
                        background: getPriorityColor(reminder.priority),
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: '0.75em',
                        fontWeight: 600
                      }}>
                        {reminder.priority.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>
                      {reminder.category} • {timeUntilDue}
                      {reminder.location && ` • ${reminder.location}`}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {reminder.description && (
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.95em', color: '#555', lineHeight: 1.4 }}>
                    {reminder.description}
                  </p>
                )}

                {/* Context and Energy */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {reminder.context.map((ctx, idx) => (
                    <span key={idx} style={{
                      background: '#f8f9fa',
                      color: '#666',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: '0.8em'
                    }}>
                      {ctx}
                    </span>
                  ))}
                  <span style={{
                    background: '#e3f2fd',
                    color: '#1976d2',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: '0.8em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <IconZap size={12} />
                    Energy: {reminder.energyLevel}/10
                  </span>
                </div>

                {/* Escalation Steps */}
                {reminder.escalation && reminder.escalationSteps.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, color: '#dc3545', marginBottom: 4, fontSize: '0.9em' }}>
                      Escalation Steps:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.85em', color: '#666' }}>
                      {reminder.escalationSteps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => completeReminder(reminder.id)}
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
                    <IconCheck size={14} /> Complete
                  </button>
                  <button
                    onClick={() => snoozeReminder(reminder.id)}
                    style={{
                      background: '#ffc107',
                      color: '#333',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 12px',
                      fontSize: '0.9em',
                      fontWeight: 600
                    }}
                  >
                    Snooze
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reminder Creation Modal */}
      {reminderModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>Create Reminder</h3>
            <form onSubmit={e => { e.preventDefault(); handleReminderSubmit(); }}>
              <label>Title: *
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="e.g., Take medication"
                />
              </label>

              <label>Description:
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="Additional details..."
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label>Category:
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as Reminder['category'] }))}
                    style={{ width: '100%', marginTop: 4 }}
                  >
                    {REMINDER_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </label>

                <label>Priority:
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value as Reminder['priority'] }))}
                    style={{ width: '100%', marginTop: 4 }}
                  >
                    {PRIORITY_LEVELS.map(priority => (
                      <option key={priority} value={priority}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label>Due Date & Time:
                <input
                  type="datetime-local"
                  value={new Date(form.dueDate).toISOString().slice(0, 16)}
                  onChange={e => setForm(f => ({ ...f, dueDate: new Date(e.target.value).getTime() }))}
                  style={{ width: '100%', marginTop: 4 }}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label>Energy Level (1-10):
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.energyLevel}
                    onChange={e => setForm(f => ({ ...f, energyLevel: Number(e.target.value) }))}
                    style={{ width: '100%', marginTop: 4 }}
                  />
                </label>

                <label>Location:
                  <input
                    type="text"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    style={{ width: '100%', marginTop: 4 }}
                    placeholder="e.g., Home, Office"
                  />
                </label>
              </div>

              {/* Context */}
              <div style={{ margin: '12px 0' }}>
                <label>Context:
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <input
                      type="text"
                      value={contextInput}
                      onChange={e => setContextInput(e.target.value)}
                      style={{ flex: 1 }}
                      placeholder="e.g., morning, work, focus"
                    />
                    <button type="button" onClick={addContext} style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px' }}>
                      Add
                    </button>
                  </div>
                </label>
                {form.context.length > 0 && (
                  <div style={{ fontSize: '0.9em', color: '#666', marginTop: 4 }}>
                    {form.context.join(', ')}
                  </div>
                )}
              </div>

              {/* Escalation */}
              <div style={{ margin: '12px 0' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={form.escalation}
                    onChange={e => setForm(f => ({ ...f, escalation: e.target.checked }))}
                    style={{ marginRight: 8 }}
                  />
                  Enable Escalation
                </label>
                {form.escalation && (
                  <div style={{ marginTop: 8 }}>
                    <label>Escalation Steps:
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <input
                          type="text"
                          value={escalationStepInput}
                          onChange={e => setEscalationStepInput(e.target.value)}
                          style={{ flex: 1 }}
                          placeholder="e.g., Send follow-up email"
                        />
                        <button type="button" onClick={addEscalationStep} style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px' }}>
                          Add
                        </button>
                      </div>
                    </label>
                    {form.escalationSteps.length > 0 && (
                      <div style={{ fontSize: '0.9em', color: '#666', marginTop: 4 }}>
                        {form.escalationSteps.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setReminderModal(false)} style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>
                  Create Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320 }}>
            <h3>Reminder Settings</h3>
            <form onSubmit={e => { e.preventDefault(); setSettingsModal(false); }}>
              <label>
                <input
                  type="checkbox"
                  checked={settings.gentleEscalation}
                  onChange={e => setSettings(s => ({ ...s, gentleEscalation: e.target.checked }))}
                  style={{ marginRight: 8 }}
                />
                Gentle Escalation
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={settings.energyMatching}
                  onChange={e => setSettings(s => ({ ...s, energyMatching: e.target.checked }))}
                  style={{ marginRight: 8 }}
                />
                Energy Level Matching
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={settings.locationAware}
                  onChange={e => setSettings(s => ({ ...s, locationAware: e.target.checked }))}
                  style={{ marginRight: 8 }}
                />
                Location Awareness
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={settings.autoSnooze}
                  onChange={e => setSettings(s => ({ ...s, autoSnooze: e.target.checked }))}
                  style={{ marginRight: 8 }}
                />
                Auto Snooze
              </label>

              <label>Default Priority:
                <select
                  value={settings.defaultPriority}
                  onChange={e => setSettings(s => ({ ...s, defaultPriority: e.target.value as Reminder['priority'] }))}
                  style={{ width: '100%', marginTop: 4 }}
                >
                  {PRIORITY_LEVELS.map(priority => (
                    <option key={priority} value={priority}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</option>
                  ))}
                </select>
              </label>

              <label>Snooze Duration (minutes):
                <input
                  type="number"
                  value={settings.snoozeDuration}
                  onChange={e => setSettings(s => ({ ...s, snoozeDuration: Number(e.target.value) }))}
                  style={{ width: '100%', marginTop: 4 }}
                />
              </label>

              <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setSettingsModal(false)} style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligentReminders; 