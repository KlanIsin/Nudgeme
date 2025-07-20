import React, { useState, useContext } from 'react';
import AppContext from '../context/GlobalStateContext';
import { ActionTypes } from '../context/GlobalStateProvider';
import type { MoodEntry, PrimaryMood } from '../types';
import { IconMoodSmile } from '@tabler/icons-react';

const MOODS: { value: PrimaryMood; emoji: string; label: string }[] = [
  { value: 'happy', emoji: '😃', label: 'Happy' },
  { value: 'sad', emoji: '😢', label: 'Sad' },
  { value: 'anxious', emoji: '😰', label: 'Anxious' },
  { value: 'excited', emoji: '🤩', label: 'Excited' },
  { value: 'calm', emoji: '😌', label: 'Calm' },
  { value: 'frustrated', emoji: '😠', label: 'Frustrated' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'overwhelmed', emoji: '🥴', label: 'Overwhelmed' },
  { value: 'focused', emoji: '🧠', label: 'Focused' },
  { value: 'scattered', emoji: '🤯', label: 'Scattered' },
];
const FACTORS = ['sleep', 'social', 'work', 'physical', 'environmental', 'medication', 'food'];
const SYMPTOMS = ['focus', 'motivation', 'anxiety', 'impulsivity', 'restlessness', 'executiveFunction', 'emotionalRegulation'];

const MoodAnalysis = ({ theme, themes, showToast }: { theme: any, themes: any, showToast: (message: string, type?: 'success' | 'error' | 'info') => void }) => {
  const { state, dispatch } = useContext(AppContext);
  const { moods } = state;

  const [moodModal, setMoodModal] = useState(false);
  const [form, setForm] = useState<Omit<MoodEntry, 'id' | 'timestamp'>>({
    primary: 'neutral',
    intensity: 3,
    factors: { sleep: 3, social: 3, work: 3, physical: 3, environmental: 3, medication: 3, food: 3 },
    symptoms: { focus: 3, motivation: 3, anxiety: 3, impulsivity: 3, restlessness: 3, executiveFunction: 3, emotionalRegulation: 3 },
    triggers: [],
    coping: [],
    notes: '',
    location: '',
    activity: '',
  });
  const [triggerInput, setTriggerInput] = useState('');
  const [copingInput, setCopingInput] = useState('');

  const handleLogMood = () => {
    const newMoodEntry: MoodEntry = {
      ...form,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    dispatch({ type: ActionTypes.ADD_MOOD_ENTRY, payload: newMoodEntry });
    showToast('Mood logged.', 'success');
    setMoodModal(false);
    setForm({
      primary: 'neutral',
      intensity: 3,
      factors: { sleep: 3, social: 3, work: 3, physical: 3, environmental: 3, medication: 3, food: 3 },
      symptoms: { focus: 3, motivation: 3, anxiety: 3, impulsivity: 3, restlessness: 3, executiveFunction: 3, emotionalRegulation: 3 },
      triggers: [],
      coping: [],
      notes: '',
      location: '',
      activity: '',
    });
    setTriggerInput('');
    setCopingInput('');
  };

  // Mood trend: average intensity per day (simple visualization)
  const trend = moods.reduce((acc: Record<string, number[]>, m) => {
    const day = new Date(m.timestamp).toLocaleDateString();
    if (!acc[day]) acc[day] = [];
    acc[day].push(m.intensity);
    return acc;
  }, {});
  const trendData = Object.entries(trend).map(([day, vals]) => ({ day, avg: (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) }));

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12, color: themes[theme].primary }}>Mood Analysis</h2>
      <button onClick={() => setMoodModal(true)} style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}><IconMoodSmile /> Log Mood</button>
      {/* Mood Trend Visualization */}
      <div style={{ margin: '16px 0', color: '#888', fontSize: '0.98em' }}>
        <b>Mood Trend:</b> {trendData.map(t => `${t.day}: ${t.avg}`).join(' | ')}
      </div>
      {/* Mood History Display */}
      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
        {moods.slice(0, 10).map(m => (
          <div key={m.id} style={{ background: '#fff', borderRadius: 8, marginBottom: 10, padding: 12, boxShadow: '0 1px 4px #0001', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ fontWeight: 600 }}>{MOODS.find(x => x.value === m.primary)?.emoji} {m.primary} <span style={{ color: themes[theme].primary, fontWeight: 400 }}>Intensity: {m.intensity}</span></div>
            <div style={{ fontSize: '0.95em', color: '#666', marginBottom: 4 }}>Factors: {FACTORS.map(f => `${f}: ${m.factors[f as keyof typeof m.factors]}`).join(', ')}</div>
            <div style={{ fontSize: '0.95em', color: '#666', marginBottom: 4 }}>Symptoms: {SYMPTOMS.map(s => `${s}: ${m.symptoms[s as keyof typeof m.symptoms]}`).join(', ')}</div>
            <div style={{ fontSize: '0.95em', color: '#888' }}>Triggers: {m.triggers.join(', ') || 'None'} | Coping: {m.coping.join(', ') || 'None'}</div>
            <div style={{ fontSize: '0.95em', color: '#888' }}>{m.notes}</div>
            <div style={{ fontSize: '0.92em', color: '#aaa' }}>{new Date(m.timestamp).toLocaleString()} | {m.location} | {m.activity}</div>
          </div>
        ))}
      </div>
      {/* Mood Modal */}
      {moodModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 400 }}>
            <h3>How are you feeling?</h3>
            <form onSubmit={e => { e.preventDefault(); handleLogMood(); }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {MOODS.map(m => (
                  <button type="button" key={m.value} onClick={() => setForm(f => ({ ...f, primary: m.value }))} style={{ fontSize: '2rem', background: form.primary === m.value ? themes[theme].primary : '#eee', color: form.primary === m.value ? '#fff' : '#222', border: 'none', borderRadius: 8, padding: '0.3em 0.7em', cursor: 'pointer' }}>{m.emoji}</button>
                ))}
              </div>
              <label>Intensity:
                <input type="range" min={1} max={5} value={form.intensity} onChange={e => setForm(f => ({ ...f, intensity: Number(e.target.value) as 1|2|3|4|5 }))} style={{ width: '100%' }} />
                <span style={{ marginLeft: 8 }}>{form.intensity}</span>
              </label>
              <div style={{ margin: '8px 0' }}>
                <b>Factors:</b>
                {FACTORS.map(f => (
                  <label key={f} style={{ marginLeft: 8 }}>{f}
                    <input type="range" min={1} max={5} value={form.factors[f as keyof typeof form.factors]} onChange={e => setForm(prev => ({ ...prev, factors: { ...prev.factors, [f]: Number(e.target.value) } }))} />
                  </label>
                ))}
              </div>
              <div style={{ margin: '8px 0' }}>
                <b>Symptoms:</b>
                {SYMPTOMS.map(s => (
                  <label key={s} style={{ marginLeft: 8 }}>{s}
                    <input type="range" min={1} max={5} value={form.symptoms[s as keyof typeof form.symptoms]} onChange={e => setForm(prev => ({ ...prev, symptoms: { ...prev.symptoms, [s]: Number(e.target.value) } }))} />
                  </label>
                ))}
              </div>
              <div style={{ margin: '8px 0' }}>
                <label>Triggers:
                  <input type="text" value={triggerInput} onChange={e => setTriggerInput(e.target.value)} style={{ marginLeft: 6, width: '70%' }} />
                  <button type="button" onClick={() => { if (triggerInput.trim()) setForm(f => ({ ...f, triggers: [...f.triggers, triggerInput.trim()] })); setTriggerInput(''); }} style={{ marginLeft: 6 }}>Add</button>
                </label>
                <div style={{ fontSize: '0.95em', color: '#888' }}>{form.triggers.join(', ')}</div>
              </div>
              <div style={{ margin: '8px 0' }}>
                <label>Coping:
                  <input type="text" value={copingInput} onChange={e => setCopingInput(e.target.value)} style={{ marginLeft: 6, width: '70%' }} />
                  <button type="button" onClick={() => { if (copingInput.trim()) setForm(f => ({ ...f, coping: [...f.coping, copingInput.trim()] })); setCopingInput(''); }} style={{ marginLeft: 6 }}>Add</button>
                </label>
                <div style={{ fontSize: '0.95em', color: '#888' }}>{form.coping.join(', ')}</div>
              </div>
              <label>Notes:
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ width: '100%' }} />
              </label>
              <label>Location:
                <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} style={{ width: '100%' }} />
              </label>
              <label>Activity:
                <input type="text" value={form.activity} onChange={e => setForm(f => ({ ...f, activity: e.target.value }))} style={{ width: '100%' }} />
              </label>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setMoodModal(false)} style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>Log Mood</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodAnalysis; 