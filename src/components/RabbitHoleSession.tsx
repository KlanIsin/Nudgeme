import React, { useState } from 'react';
// import { ThemeKey } from '../types';

interface RabbitHoleSessionProps {
  theme: string; // Use string to match THEMES keys
  themes: any;
  onSave: (session: any) => void;
  projects: Array<{ id: string; name: string }>;
  tasks: Array<{ id: string; content: string }>;
  goals: Array<{ id: string; title: string }>;
}

const initialSession = {
  topic: '',
  context: '',
  startTime: null as number | null,
  endTime: null as number | null,
  summary: '',
  findings: [''],
  insights: [''],
  tangents: [''],
  reflection: '',
  linkedProject: '',
  linkedTask: '',
  linkedGoal: '',
};

const RabbitHoleSession: React.FC<RabbitHoleSessionProps> = ({ theme, themes, onSave, projects, tasks, goals }) => {
  const [session, setSession] = useState({ ...initialSession });
  const [active, setActive] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleStart = () => {
    setSession({ ...initialSession, startTime: Date.now() });
    setActive(true);
    setShowForm(false);
  };

  const handleEnd = () => {
    setSession(s => ({ ...s, endTime: Date.now() }));
    setActive(false);
    setShowForm(true);
  };

  const handleChange = (field: string, value: any) => {
    setSession(s => ({ ...s, [field]: value }));
  };

  const handleListChange = (field: 'findings' | 'insights' | 'tangents', idx: number, value: string) => {
    setSession(s => {
      const arr = [...(s[field] as string[])];
      arr[idx] = value;
      return { ...s, [field]: arr };
    });
  };

  const handleAddListItem = (field: 'findings' | 'insights' | 'tangents') => {
    setSession(s => ({ ...s, [field]: [...(s[field] as string[]), ''] }));
  };

  const handleSave = () => {
    onSave(session);
    setSession({ ...initialSession });
    setShowForm(false);
  };

  return (
    <div style={{ margin: '2rem 0', background: themes[theme].modalBg, color: themes[theme].modalText, borderRadius: 12, padding: 24, boxShadow: '0 2px 8px #0001' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12, color: themes[theme].primary }}>Rabbit Hole Session Organizer</h2>
      {!active && !showForm && (
        <button onClick={handleStart} style={{ background: themes[theme].primary, color: themes[theme].buttonText, border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600, fontSize: '1.1em' }}>Start Rabbit Hole Session</button>
      )}
      {active && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <label>Topic/Title:<br />
              <input type="text" value={session.topic} onChange={e => handleChange('topic', e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
            </label>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Context/Intent:<br />
              <input type="text" value={session.context} onChange={e => handleChange('context', e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
            </label>
          </div>
          <button onClick={handleEnd} style={{ background: themes[theme].primary, color: themes[theme].buttonText, border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600, fontSize: '1.1em' }}>End Session</button>
        </div>
      )}
      {showForm && (
        <div style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label>Summary of what you explored:<br />
              <textarea value={session.summary} onChange={e => handleChange('summary', e.target.value)} style={{ width: '100%', minHeight: 60, padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
            </label>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Key Findings/Resources:</label>
            {session.findings.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <input type="text" value={item} onChange={e => handleListChange('findings', idx, e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
                {idx === session.findings.length - 1 && (
                  <button type="button" onClick={() => handleAddListItem('findings')}>+</button>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Insights/Ideas/Questions:</label>
            {session.insights.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <input type="text" value={item} onChange={e => handleListChange('insights', idx, e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
                {idx === session.insights.length - 1 && (
                  <button type="button" onClick={() => handleAddListItem('insights')}>+</button>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Tangents/Sub-topics:</label>
            {session.tangents.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <input type="text" value={item} onChange={e => handleListChange('tangents', idx, e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
                {idx === session.tangents.length - 1 && (
                  <button type="button" onClick={() => handleAddListItem('tangents')}>+</button>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Reflection:<br />
              <textarea value={session.reflection} onChange={e => handleChange('reflection', e.target.value)} style={{ width: '100%', minHeight: 60, padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
            </label>
          </div>
          <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
            <label>Link to Project:<br />
              <select value={session.linkedProject} onChange={e => handleChange('linkedProject', e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }}>
                <option value="">None</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label>Link to Task:<br />
              <select value={session.linkedTask} onChange={e => handleChange('linkedTask', e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }}>
                <option value="">None</option>
                {tasks.map(t => <option key={t.id} value={t.id}>{t.content}</option>)}
              </select>
            </label>
            <label>Link to Goal:<br />
              <select value={session.linkedGoal} onChange={e => handleChange('linkedGoal', e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }}>
                <option value="">None</option>
                {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
              </select>
            </label>
          </div>
          <button onClick={handleSave} style={{ background: themes[theme].primary, color: themes[theme].buttonText, border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600, fontSize: '1.1em' }}>Save Session</button>
        </div>
      )}
    </div>
  );
};

export default RabbitHoleSession; 