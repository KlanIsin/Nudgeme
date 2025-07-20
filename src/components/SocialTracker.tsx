import React, { useState, useContext, useMemo, useCallback, Fragment } from 'react';
import AppContext from '../context/GlobalStateContext';
import { ActionTypes } from '../context/GlobalStateProvider';
import type { SocialEntry, SocialType } from '../types';
import { IconUsers } from '@tabler/icons-react';
import { FixedSizeList } from 'react-window';
import debounce from 'lodash.debounce';

const SOCIAL_TYPES: SocialType[] = ['conversation', 'meeting', 'social_event', 'conflict', 'presentation', 'interview'];
const TEMPLATES = [
  { type: 'meeting', label: 'Team Meeting', participants: ['Team'], duration: 60, context: 'work' },
  { type: 'conversation', label: '1:1 Conversation', participants: ['Colleague'], duration: 30, context: 'work' },
  { type: 'social_event', label: 'Social Event', participants: ['Friends'], duration: 120, context: 'personal' },
];
const typeColors: Record<SocialType, string> = {
  meeting: '#4f8cff',
  conversation: '#43a047',
  social_event: '#fbc02d',
  conflict: '#d32f2f',
  presentation: '#b57edc',
  interview: '#a05a2c',
};

const SocialEntryRow = React.memo(({ entry, style, onEdit }: { entry: SocialEntry; style?: React.CSSProperties; onEdit: (entry: SocialEntry) => void }) => (
  <div style={{ ...style, background: typeColors[entry.type] || '#fff', color: '#222', borderRadius: 8, marginBottom: 10, padding: 12, boxShadow: '0 1px 4px #0001', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
    <div style={{ fontWeight: 600 }}>{entry.type} with {entry.participants.join(', ')}</div>
    <div style={{ fontSize: '0.95em', color: '#666', marginBottom: 4 }}>Duration: {entry.duration} min | Success: {entry.success}/10</div>
    <div style={{ fontSize: '0.95em', color: '#888' }}>Challenges: {entry.challenges.join(', ') || 'None'} | Strategies: {entry.strategies.join(', ') || 'None'} | Follow-up: {entry.followUp.join(', ') || 'None'}</div>
    <div style={{ fontSize: '0.95em', color: '#888' }}>{entry.notes}</div>
    <div style={{ fontSize: '0.92em', color: '#aaa' }}>Energy: {entry.energy} | Anxiety: {entry.anxiety} | Prep: {entry.preparation} | {entry.location} | {entry.context} | {new Date(entry.timestamp).toLocaleString()}</div>
    <button onClick={() => onEdit(entry)} style={{ marginTop: 4, background: '#eee', color: '#222', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 600 }}>Edit</button>
  </div>
));

const SocialTracker = ({ theme, themes, showToast }: { theme: any, themes: any, showToast: (message: string, type?: 'success' | 'error' | 'info') => void }) => {
  const { state, dispatch } = useContext(AppContext);
  const { socialEntries } = state;

  const [socialModal, setSocialModal] = useState(false);
  const [editEntry, setEditEntry] = useState<SocialEntry | null>(null);
  const [form, setForm] = useState<Omit<SocialEntry, 'id' | 'timestamp'>>({
    type: 'conversation',
    participants: [],
    duration: 30,
    success: 7,
    challenges: [],
    strategies: [],
    followUp: [],
    notes: '',
    energy: 5,
    anxiety: 5,
    preparation: 5,
    location: '',
    context: '',
  });
  const [participantInput, setParticipantInput] = useState('');
  const [challengeInput, setChallengeInput] = useState('');
  const [strategyInput, setStrategyInput] = useState('');
  const [followUpInput, setFollowUpInput] = useState('');
  const [filterType, setFilterType] = useState<SocialType | ''>('');
  const [filterParticipant, setFilterParticipant] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Debounced filter input
  const debouncedSetFilterParticipant = useMemo(() => debounce(setFilterParticipant, 300), []);

  // Memoized filtered entries
  const filteredEntries = useMemo(() => {
    let entries = socialEntries;
    if (filterType) entries = entries.filter(e => e.type === filterType);
    if (filterParticipant) entries = entries.filter(e => e.participants.some(p => p.toLowerCase().includes(filterParticipant.toLowerCase())));
    return entries;
  }, [socialEntries, filterType, filterParticipant]);

  // Memoized averages
  const avg = (arr: number[]) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : '-';
  const avgEnergy = useMemo(() => avg(filteredEntries.map(s => s.energy)), [filteredEntries]);
  const avgAnxiety = useMemo(() => avg(filteredEntries.map(s => s.anxiety)), [filteredEntries]);
  const avgPrep = useMemo(() => avg(filteredEntries.map(s => s.preparation)), [filteredEntries]);

  // Progress bar for follow-up completion
  const followUpProgress = useMemo(() => {
    const total = filteredEntries.length;
    const completed = filteredEntries.filter(e => e.followUp.length === 0).length;
    return total ? Math.round((completed / total) * 100) : 0;
  }, [filteredEntries]);

  // Trend visualization (energy/anxiety/prep over time)
  const trendData = useMemo(() => {
    const byDay: Record<string, { energy: number[]; anxiety: number[]; prep: number[] }> = {};
    filteredEntries.forEach(e => {
      const day = new Date(e.timestamp).toLocaleDateString();
      if (!byDay[day]) byDay[day] = { energy: [], anxiety: [], prep: [] };
      byDay[day].energy.push(e.energy);
      byDay[day].anxiety.push(e.anxiety);
      byDay[day].prep.push(e.preparation);
    });
    return Object.entries(byDay).map(([day, vals]) => ({
      day,
      energy: avg(vals.energy),
      anxiety: avg(vals.anxiety),
      prep: avg(vals.prep),
    }));
  }, [filteredEntries]);

  // Chips for participants, challenges, strategies, followUp
  const removeChip = (field: keyof typeof form, idx: number) => {
    setForm(f => ({ ...f, [field]: (f[field] as string[]).filter((_, i) => i !== idx) }));
  };

  // Quick-fill from template
  const handleTemplate = (tpl: typeof TEMPLATES[0]) => {
    setForm(f => ({ ...f, type: tpl.type as SocialType, participants: tpl.participants, duration: tpl.duration, context: tpl.context }));
  };

  // Inline editing
  const handleEdit = (entry: SocialEntry) => {
    setEditEntry(entry);
    setForm({ ...entry });
    setSocialModal(true);
  };

  const handleLogSocial = () => {
    if (editEntry) {
      dispatch({ type: ActionTypes.UPDATE_SOCIAL_ENTRY, payload: { id: editEntry.id, updates: { ...form } } });
      showToast('Social interaction updated.', 'success');
      setEditEntry(null);
    } else {
    const newSocialEntry: SocialEntry = {
        ...form,
        id: Date.now().toString(),
      timestamp: Date.now(),
    };
    dispatch({ type: ActionTypes.ADD_SOCIAL_ENTRY, payload: newSocialEntry });
    showToast('Social interaction logged.', 'success');
    }
    setSocialModal(false);
    setForm({
      type: 'conversation',
      participants: [],
      duration: 30,
      success: 7,
      challenges: [],
      strategies: [],
      followUp: [],
      notes: '',
      energy: 5,
      anxiety: 5,
      preparation: 5,
      location: '',
      context: '',
    });
    setParticipantInput('');
    setChallengeInput('');
    setStrategyInput('');
    setFollowUpInput('');
  };

  // Virtualized list for large history
  const VISIBLE_COUNT = showAll ? filteredEntries.length : 10;
  const Row = useCallback(({ index, style }) => (
    <SocialEntryRow entry={filteredEntries[index]} style={style} onEdit={handleEdit} />
  ), [filteredEntries]);

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12, color: themes[theme].primary }}>Social Tracker</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button onClick={() => setSocialModal(true)} style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }} aria-label="Log Social Interaction"><IconUsers /> Log Social Interaction</button>
        {TEMPLATES.map(tpl => (
          <button key={tpl.label} onClick={() => handleTemplate(tpl)} style={{ background: '#eaf2ff', color: '#222', border: 'none', borderRadius: 8, padding: '0.5em 1.2em', fontWeight: 600 }}>{tpl.label}</button>
        ))}
        <label htmlFor="filter-type">Type:
          <select id="filter-type" value={filterType} onChange={e => setFilterType(e.target.value as SocialType | '')} style={{ marginLeft: 6 }}>
            <option value=''>All</option>
            {SOCIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label htmlFor="filter-participant">Participant:
          <input id="filter-participant" type="text" onChange={e => debouncedSetFilterParticipant(e.target.value)} style={{ marginLeft: 6 }} aria-label="Filter by participant" />
        </label>
      </div>
      {/* Progress Bar for follow-up completion */}
      <div style={{ margin: '8px 0', height: 12, background: '#eaf2ff', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ width: `${followUpProgress}%`, height: '100%', background: themes[theme].primary, borderRadius: 6, transition: 'width 0.3s' }}></div>
      </div>
      <div style={{ fontSize: '0.95em', color: '#888', marginBottom: 8 }}>{followUpProgress}% of interactions have no follow-up needed</div>
      {/* Trend Visualization */}
      <div style={{ margin: '8px 0', color: '#888', fontSize: '0.98em' }}>
        <b>Trends:</b> {trendData.map(t => `${t.day} (E:${t.energy} A:${t.anxiety} P:${t.prep})`).join(' | ')}
      </div>
      {/* Social History Display (virtualized) */}
      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        <FixedSizeList
          height={240}
          itemCount={Math.min(filteredEntries.length, VISIBLE_COUNT)}
          itemSize={120}
          width={'100%'}
        >
          {Row}
        </FixedSizeList>
        {filteredEntries.length > VISIBLE_COUNT && !showAll && (
          <button onClick={() => setShowAll(true)} style={{ marginTop: 8, background: '#eee', color: '#222', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>Show More</button>
        )}
      </div>
      {/* Social Modal */}
      {socialModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 400 }}>
            <h3>{editEntry ? 'Edit Social Interaction' : 'Log a Social Interaction'}</h3>
            <form onSubmit={e => { e.preventDefault(); handleLogSocial(); }}>
              <label htmlFor="type">Type:
                <select id="type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as SocialType }))} style={{ marginLeft: 6 }}>
                  {SOCIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <div style={{ margin: '8px 0' }}>
                <label htmlFor="participant-input">Participants:</label>
                <input id="participant-input" type="text" value={participantInput} onChange={e => setParticipantInput(e.target.value)} style={{ marginLeft: 6, width: '70%' }} aria-label="Add participant" />
                <button type="button" onClick={() => { if (participantInput.trim()) setForm(f => ({ ...f, participants: [...f.participants, participantInput.trim()] })); setParticipantInput(''); }} style={{ marginLeft: 6 }}>Add</button>
                <div>{form.participants.map((p, idx) => (
                  <span key={idx} style={{ background: '#eaf2ff', borderRadius: 12, padding: '2px 8px', margin: 2 }}>
                    {p}
                    <button type="button" onClick={() => removeChip('participants', idx)} style={{ marginLeft: 4 }}>×</button>
                  </span>
                ))}</div>
              </div>
              <label>Duration (min):
                <input type="number" min={1} max={480} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} style={{ marginLeft: 6, width: 60 }} />
              </label>
              <label>Success (1-10):
                <input type="number" min={1} max={10} value={form.success} onChange={e => setForm(f => ({ ...f, success: Number(e.target.value) }))} style={{ marginLeft: 6, width: 60 }} />
              </label>
              <div style={{ margin: '8px 0' }}>
                <label>Challenges:</label>
                <input type="text" value={challengeInput} onChange={e => setChallengeInput(e.target.value)} style={{ marginLeft: 6, width: '70%' }} aria-label="Add challenge" />
                <button type="button" onClick={() => { if (challengeInput.trim()) setForm(f => ({ ...f, challenges: [...f.challenges, challengeInput.trim()] })); setChallengeInput(''); }} style={{ marginLeft: 6 }}>Add</button>
                <div>{form.challenges.map((c, idx) => (
                  <span key={idx} style={{ background: '#eaf2ff', borderRadius: 12, padding: '2px 8px', margin: 2 }}>
                    {c}
                    <button type="button" onClick={() => removeChip('challenges', idx)} style={{ marginLeft: 4 }}>×</button>
                  </span>
                ))}</div>
              </div>
              <div style={{ margin: '8px 0' }}>
                <label>Strategies:</label>
                <input type="text" value={strategyInput} onChange={e => setStrategyInput(e.target.value)} style={{ marginLeft: 6, width: '70%' }} aria-label="Add strategy" />
                <button type="button" onClick={() => { if (strategyInput.trim()) setForm(f => ({ ...f, strategies: [...f.strategies, strategyInput.trim()] })); setStrategyInput(''); }} style={{ marginLeft: 6 }}>Add</button>
                <div>{form.strategies.map((s, idx) => (
                  <span key={idx} style={{ background: '#eaf2ff', borderRadius: 12, padding: '2px 8px', margin: 2 }}>
                    {s}
                    <button type="button" onClick={() => removeChip('strategies', idx)} style={{ marginLeft: 4 }}>×</button>
                  </span>
                ))}</div>
              </div>
              <div style={{ margin: '8px 0' }}>
                <label>Follow-up:</label>
                <input type="text" value={followUpInput} onChange={e => setFollowUpInput(e.target.value)} style={{ marginLeft: 6, width: '70%' }} aria-label="Add follow-up" />
                <button type="button" onClick={() => { if (followUpInput.trim()) setForm(f => ({ ...f, followUp: [...f.followUp, followUpInput.trim()] })); setFollowUpInput(''); }} style={{ marginLeft: 6 }}>Add</button>
                <div>{form.followUp.map((fup, idx) => (
                  <span key={idx} style={{ background: '#eaf2ff', borderRadius: 12, padding: '2px 8px', margin: 2 }}>
                    {fup}
                    <button type="button" onClick={() => removeChip('followUp', idx)} style={{ marginLeft: 4 }}>×</button>
                  </span>
                ))}</div>
              </div>
              <label>Notes:
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ width: '100%' }} />
              </label>
              <label>Energy (1-10):
                <input type="number" min={1} max={10} value={form.energy} onChange={e => setForm(f => ({ ...f, energy: Number(e.target.value) }))} style={{ marginLeft: 6, width: 60 }} />
              </label>
              <label>Anxiety (1-10):
                <input type="number" min={1} max={10} value={form.anxiety} onChange={e => setForm(f => ({ ...f, anxiety: Number(e.target.value) }))} style={{ marginLeft: 6, width: 60 }} />
              </label>
              <label>Preparation (1-10):
                <input type="number" min={1} max={10} value={form.preparation} onChange={e => setForm(f => ({ ...f, preparation: Number(e.target.value) }))} style={{ marginLeft: 6, width: 60 }} />
              </label>
              <label>Location:
                <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} style={{ width: '100%' }} />
              </label>
              <label>Context:
                <input type="text" value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} style={{ width: '100%' }} />
              </label>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setSocialModal(false); setEditEntry(null); }} style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>{editEntry ? 'Save' : 'Log Social'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialTracker; 