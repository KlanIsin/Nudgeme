import React, { useState, useEffect, useMemo } from 'react';
import type { SensoryCheckin, SensoryProfile, SensoryType } from '../types';
import { IconEar } from '@tabler/icons-react';

const SENSORY_TYPES: SensoryType[] = ['visual', 'auditory', 'tactile', 'olfactory', 'gustatory', 'proprioceptive', 'vestibular'];
const REGULATION_TOOLS: Record<SensoryType, string[]> = {
  visual: ['Dim lights', 'Blue light filter', 'Look at nature', 'Wear sunglasses'],
  auditory: ['Noise-cancelling headphones', 'White noise', 'Music', 'Earplugs'],
  tactile: ['Fidget tool', 'Soft fabric', 'Weighted blanket', 'Hand massage'],
  olfactory: ['Essential oils', 'Fresh air', 'Scented candle'],
  gustatory: ['Chew gum', 'Drink water', 'Eat a snack'],
  proprioceptive: ['Stretch', 'Yoga', 'Squeeze ball', 'Push against wall'],
  vestibular: ['Rocking', 'Swing', 'Balance board', 'Spin in chair'],
};

const SensoryTools = ({ theme, themes, showToast }: { theme: any, themes: any, showToast: (message: string, type?: 'success' | 'error' | 'info') => void }) => {
  const [sensoryCheckins, setSensoryCheckins] = useState<SensoryCheckin[]>(() => {
    const raw = localStorage.getItem('sensoryCheckins');
    return raw ? JSON.parse(raw) : [];
  });
  const [sensoryModal, setSensoryModal] = useState(false);
  const [form, setForm] = useState<Omit<SensoryCheckin, 'id' | 'timestamp'>>({
    sensoryType: 'visual',
    level: 5,
    triggers: [],
    strategies: [],
    effectiveness: 5,
    notes: '',
    environment: '',
    overloadWarning: false,
  });
  const [triggerInput, setTriggerInput] = useState('');
  const [strategyInput, setStrategyInput] = useState('');

  useEffect(() => {
    localStorage.setItem('sensoryCheckins', JSON.stringify(sensoryCheckins));
  }, [sensoryCheckins]);
  
  const handleSensoryCheckinSubmit = () => {
    const newSensoryCheckin: SensoryCheckin = {
      ...form,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    setSensoryCheckins(prev => [newSensoryCheckin, ...prev]);
    setSensoryModal(false);
    showToast('Sensory check-in logged!', 'success');
    setForm({
      sensoryType: 'visual',
      level: 5,
      triggers: [],
      strategies: [],
      effectiveness: 5,
      notes: '',
      environment: '',
      overloadWarning: false,
    });
    setTriggerInput('');
    setStrategyInput('');
  };

  // Pattern recognition: average level per type
  const avg = (arr: number[]) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : '-';
  const avgByType = useMemo(() => {
    const byType: Record<SensoryType, number[]> = { visual: [], auditory: [], tactile: [], olfactory: [], gustatory: [], proprioceptive: [], vestibular: [] };
    sensoryCheckins.forEach(s => { byType[s.sensoryType].push(s.level); });
    return SENSORY_TYPES.map(t => ({ type: t, avg: avg(byType[t]) }));
  }, [sensoryCheckins]);

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12, color: themes[theme].primary }}>Sensory Tools</h2>
      <button onClick={() => setSensoryModal(true)} style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}><IconEar /> Sensory Check-in</button>
      {/* Pattern Recognition */}
      <div style={{ margin: '16px 0', color: '#888', fontSize: '0.98em' }}>
        <b>Avg. Level by Type:</b> {avgByType.map(t => `${t.type}: ${t.avg}`).join(' | ')}
      </div>
      {/* Sensory History Display */}
      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
        {sensoryCheckins.slice(0, 10).map(s => (
          <div key={s.id} style={{ background: '#fff', borderRadius: 8, marginBottom: 10, padding: 12, boxShadow: '0 1px 4px #0001', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ fontWeight: 600 }}>{s.sensoryType} | Level: {s.level} | Overload: {s.overloadWarning ? '⚠️' : 'No'}</div>
            <div style={{ fontSize: '0.95em', color: '#666', marginBottom: 4 }}>Triggers: {s.triggers.join(', ') || 'None'} | Strategies: {s.strategies.join(', ') || 'None'}</div>
            <div style={{ fontSize: '0.95em', color: '#888' }}>Effectiveness: {s.effectiveness}/10 | {s.environment}</div>
            <div style={{ fontSize: '0.95em', color: '#888' }}>{s.notes}</div>
            <div style={{ fontSize: '0.92em', color: '#aaa' }}>{new Date(s.timestamp).toLocaleString()}</div>
          </div>
        ))}
      </div>
      {/* Sensory Modal */}
      {sensoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 400 }}>
            <h3>Sensory Check-in</h3>
            <form onSubmit={e => { e.preventDefault(); handleSensoryCheckinSubmit(); }}>
              <label>Sensory Type:
                <select value={form.sensoryType} onChange={e => setForm(f => ({ ...f, sensoryType: e.target.value as SensoryType }))} style={{ marginLeft: 6 }}>
                  {SENSORY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label>Level (1-10):
                <input type="number" min={1} max={10} value={form.level} onChange={e => setForm(f => ({ ...f, level: Number(e.target.value) }))} style={{ marginLeft: 6, width: 60 }} />
              </label>
              <label>Overload Warning:
                <input type="checkbox" checked={form.overloadWarning} onChange={e => setForm(f => ({ ...f, overloadWarning: e.target.checked }))} style={{ marginLeft: 6 }} />
              </label>
              <div style={{ margin: '8px 0' }}>
                <label>Triggers:
                  <input type="text" value={triggerInput} onChange={e => setTriggerInput(e.target.value)} style={{ marginLeft: 6, width: '70%' }} />
                  <button type="button" onClick={() => { if (triggerInput.trim()) setForm(f => ({ ...f, triggers: [...f.triggers, triggerInput.trim()] })); setTriggerInput(''); }} style={{ marginLeft: 6 }}>Add</button>
                </label>
                <div style={{ fontSize: '0.95em', color: '#888' }}>{form.triggers.join(', ')}</div>
              </div>
              <div style={{ margin: '8px 0' }}>
                <label>Strategies:
                  <input type="text" value={strategyInput} onChange={e => setStrategyInput(e.target.value)} style={{ marginLeft: 6, width: '70%' }} />
                  <button type="button" onClick={() => { if (strategyInput.trim()) setForm(f => ({ ...f, strategies: [...f.strategies, strategyInput.trim()] })); setStrategyInput(''); }} style={{ marginLeft: 6 }}>Add</button>
                </label>
                <div style={{ fontSize: '0.95em', color: '#888' }}>{form.strategies.join(', ')}</div>
              </div>
              <label>Effectiveness (1-10):
                <input type="number" min={1} max={10} value={form.effectiveness} onChange={e => setForm(f => ({ ...f, effectiveness: Number(e.target.value) }))} style={{ marginLeft: 6, width: 60 }} />
              </label>
              <label>Environment:
                <input type="text" value={form.environment} onChange={e => setForm(f => ({ ...f, environment: e.target.value }))} style={{ width: '100%' }} />
              </label>
              <label>Notes:
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ width: '100%' }} />
              </label>
              {/* Quick access to regulation tools */}
              <div style={{ margin: '8px 0' }}>
                <b>Regulation Tools:</b>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {REGULATION_TOOLS[form.sensoryType].map((tool, idx) => (
                    <li key={idx} style={{ color: themes[theme].primary }}>{tool}</li>
                  ))}
                </ul>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setSensoryModal(false)} style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>Log Check-in</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SensoryTools; 