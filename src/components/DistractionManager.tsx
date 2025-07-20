import React, { useState, useContext } from 'react';
import AppContext from '../context/GlobalStateContext';
import { ActionTypes } from '../context/GlobalStateProvider';
import type { Distraction, DistractionType } from '../types';
import { IconAlertTriangle } from '@tabler/icons-react';

const DISTRACTION_TYPES: DistractionType[] = ['internal', 'external', 'digital', 'environmental'];
const STRATEGY_LIBRARY = [
  'Deep breathing',
  'Move to a quiet space',
  'Turn off notifications',
  'Take a short break',
  'Mindfulness check-in',
  'Jot down the thought for later',
];

const DistractionManager = ({ theme, themes, showToast }: { theme: any, themes: any, showToast: (message: string, type?: 'success' | 'error' | 'info') => void }) => {
  const { state, dispatch } = useContext(AppContext);
  const { distractions } = state;

  const [distractionModal, setDistractionModal] = useState(false);
  const [form, setForm] = useState<Omit<Distraction, 'id' | 'timestamp' | 'duration' | 'handled'>>({
    type: 'internal',
    trigger: '',
    severity: 3,
    strategy: '',
    impact: 5,
    notes: '',
  });
  const [filterType, setFilterType] = useState<DistractionType | ''>('');
  const [filterSeverity, setFilterSeverity] = useState<number | ''>('');

  const handleLogDistraction = () => {
    if (!form.trigger.trim()) return;
    const newDistraction: Distraction = {
      ...form,
      id: Date.now().toString(),
      timestamp: Date.now(),
      duration: 0,
      handled: false,
    };
    dispatch({ type: ActionTypes.ADD_DISTRACTION, payload: newDistraction });
    showToast('Distraction logged.', 'info');
    setDistractionModal(false);
    setForm({ type: 'internal', trigger: '', severity: 3, strategy: '', impact: 5, notes: '' });
  };

  const handleUpdateDistraction = (id: string, updates: Partial<Distraction>) => {
    dispatch({ type: ActionTypes.UPDATE_DISTRACTION, payload: { id, updates } });
  };

  // Pattern recognition: most common triggers/types
  const triggerCounts = distractions.reduce((acc: Record<string, number>, d) => {
    acc[d.trigger] = (acc[d.trigger] || 0) + 1;
    return acc;
  }, {});
  const mostCommonTrigger = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const typeCounts = distractions.reduce((acc: Record<string, number>, d) => {
    acc[d.type] = (acc[d.type] || 0) + 1;
    return acc;
  }, {});
  const mostCommonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const filteredDistractions = distractions.filter(d => {
    if (filterType && d.type !== filterType) return false;
    if (filterSeverity && d.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12, color: themes[theme].primary }}>Distraction Log</h2>
      <div style={{ marginBottom: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={() => setDistractionModal(true)} style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}><IconAlertTriangle /> Log Distraction</button>
        <label>Type:
          <select value={filterType} onChange={e => setFilterType(e.target.value as DistractionType | '')} style={{ marginLeft: 6 }}>
            <option value=''>All</option>
            {DISTRACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>Severity:
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value ? Number(e.target.value) : '')} style={{ marginLeft: 6 }}>
            <option value=''>All</option>
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      {/* Pattern Recognition */}
      <div style={{ marginBottom: 16, color: '#888', fontSize: '0.98em' }}>
        {mostCommonTrigger && <span>Most common trigger: <b>{mostCommonTrigger}</b>. </span>}
        {mostCommonType && <span>Most common type: <b>{mostCommonType}</b>.</span>}
      </div>
      {/* List of distractions */}
      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
        {filteredDistractions.length === 0 && <div style={{ color: '#aaa' }}>No distractions logged.</div>}
        {filteredDistractions.map(d => (
          <div key={d.id} style={{ background: '#fff', borderRadius: 8, marginBottom: 10, padding: 12, boxShadow: '0 1px 4px #0001', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ fontWeight: 600 }}>{d.trigger} <span style={{ color: themes[theme].primary, fontWeight: 400 }}>({d.type})</span></div>
            <div style={{ fontSize: '0.95em', color: '#666', marginBottom: 4 }}>Severity: {d.severity} | Strategy: {d.strategy || <span style={{ color: '#aaa' }}>None</span>} | Impact: {d.impact}/10</div>
            <div style={{ fontSize: '0.95em', color: '#888' }}>{d.notes}</div>
            {!d.handled && <button onClick={() => handleUpdateDistraction(d.id, { handled: true })} style={{ marginTop: 4, background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 600 }}>Mark as Handled</button>}
          </div>
        ))}
      </div>
      {/* Distraction Modal */}
      {distractionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320 }}>
            <h3>Log a Distraction</h3>
            <form onSubmit={e => { e.preventDefault(); handleLogDistraction(); }}>
              <label>Type:
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as DistractionType }))} style={{ marginLeft: 6 }}>
                  {DISTRACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <br />
              <label>Trigger:
                <input type="text" value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))} style={{ marginLeft: 6, width: '90%' }} />
              </label>
              <br />
              <label>Severity:
                <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: Number(e.target.value) as 1|2|3|4|5 }))} style={{ marginLeft: 6 }}>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <br />
              <label>Strategy:
                <select value={form.strategy} onChange={e => setForm(f => ({ ...f, strategy: e.target.value }))} style={{ marginLeft: 6 }}>
                  <option value=''>None</option>
                  {STRATEGY_LIBRARY.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <br />
              <label>Impact:
                <input type="number" min={1} max={10} value={form.impact} onChange={e => setForm(f => ({ ...f, impact: Number(e.target.value) }))} style={{ marginLeft: 6, width: 60 }} />
              </label>
              <br />
              <label>Notes:
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ marginLeft: 6, width: '90%' }} />
              </label>
              <br />
              <button type="submit" style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600, marginTop: 8 }}>Log</button>
              <button type="button" onClick={() => setDistractionModal(false)} style={{ marginLeft: 8, background: '#eee', color: '#222', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistractionManager; 