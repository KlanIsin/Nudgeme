import React, { useState, useEffect, useContext } from 'react';
import AppContext from '../context/GlobalStateContext';
import { ActionTypes } from '../context/GlobalStateProvider';
import type { FocusSession, FocusMode } from '../types';
import { IconClockPlay, IconPlayerPause, IconRefresh, IconPlayerStop } from '@tabler/icons-react';

const MODES: { mode: FocusMode; label: string; defaultDuration: number }[] = [
  { mode: 'pomodoro', label: 'Pomodoro', defaultDuration: 25 },
  { mode: 'flow', label: 'Flow', defaultDuration: 60 },
  { mode: 'sprint', label: 'Sprint', defaultDuration: 15 },
  { mode: 'recovery', label: 'Recovery', defaultDuration: 5 },
  { mode: 'body-double', label: 'Body Doubling', defaultDuration: 30 },
];

const FocusTimer = ({ theme, themes, showToast }: { theme: any, themes: any, showToast: (message: string, type?: 'success' | 'error' | 'info') => void }) => {
  const { state, dispatch } = useContext(AppContext);
  const { focusSessions } = state;

  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [sessionFeedbackModal, setSessionFeedbackModal] = useState(false);
  const [sessionFocusScore, setSessionFocusScore] = useState(5);
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionInterruptions, setSessionInterruptions] = useState(0);

  const [timerInterval, setTimerInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timer, setTimer] = useState(0);
  const [focusMode, setFocusMode] = useState<FocusMode>('pomodoro');
  const [customDuration, setCustomDuration] = useState(25);
  const [focusFeedback, setFocusFeedback] = useState('');

  useEffect(() => {
    if (!timerRunning) {
      if (timerInterval) clearInterval(timerInterval);
      setTimerInterval(null);
      return;
    }
    const interval = setInterval(() => {
      setTimer(t => {
        if (t > 0) return t - 1;
        setTimerRunning(false);
        setFocusFeedback('Session complete!');
        setSessionFeedbackModal(true);
        return 0;
      });
    }, 1000);
    setTimerInterval(interval);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const handleStartSession = () => {
    const duration = customDuration * 60;
    setTimer(duration);
    setTimerRunning(true);
    setFocusFeedback('');
    const newSession: FocusSession = {
      id: Date.now().toString(),
      mode: focusMode,
      duration,
      task: '',
      interruptions: 0,
      focusScore: 0,
      notes: '',
      completed: false,
      startTime: Date.now(),
    };
    setCurrentSession(newSession);
  };

  const handlePause = () => setTimerRunning(false);
  const handleResume = () => setTimerRunning(true);
  const handleReset = () => {
    setTimer(MODES.find(m => m.mode === focusMode)?.defaultDuration * 60 || 25 * 60);
    setTimerRunning(false);
    setFocusFeedback('');
    setCurrentSession(null);
  };

  const handleModeChange = (mode: FocusMode) => {
    setFocusMode(mode);
    const def = MODES.find(m => m.mode === mode)?.defaultDuration || 25;
    setCustomDuration(def);
    setTimer(def * 60);
    setTimerRunning(false);
    setFocusFeedback('');
    setCurrentSession(null);
  };

  const handleSessionFeedbackSubmit = () => {
    if (currentSession) {
      const completedSession = {
        ...currentSession,
        focusScore: sessionFocusScore,
        notes: sessionNotes,
        interruptions: sessionInterruptions,
        completed: true,
        endTime: Date.now(),
        actualDuration: currentSession.duration - timer,
      };
      dispatch({ type: ActionTypes.ADD_FOCUS_SESSION, payload: completedSession });
      setCurrentSession(null);
      setSessionFeedbackModal(false);
      setSessionFocusScore(5);
      setSessionNotes('');
      setSessionInterruptions(0);
      showToast('Focus session logged!', 'success');
    }
  };

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12, color: themes[theme].primary }}>Focus Timer</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {MODES.map(m => (
          <button
            key={m.mode}
            onClick={() => handleModeChange(m.mode)}
            style={{
              background: focusMode === m.mode ? themes[theme].primary : '#eaf2ff',
              color: focusMode === m.mode ? '#fff' : '#222',
              border: 'none',
              borderRadius: 8,
              padding: '0.5em 1.2em',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <label style={{ fontWeight: 500, marginRight: 8 }}>Duration (min):</label>
        <input
          type="number"
          min={1}
          max={180}
          value={customDuration}
          onChange={e => setCustomDuration(Number(e.target.value))}
          style={{ width: 60, padding: 4, borderRadius: 6, border: '1px solid #ccc' }}
        />
      </div>
      <div className="focus-timer-display" style={{ fontSize: '3rem', fontWeight: 700, textAlign: 'center', marginBottom: 16 }}>
        {Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}
      </div>
      <div className="focus-timer-controls" style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
        {!timerRunning ? (
          <button onClick={handleStartSession}><IconClockPlay /> Start</button>
        ) : (
          <button onClick={handlePause}><IconPlayerPause /> Pause</button>
        )}
        <button onClick={handleReset}><IconRefresh /> Reset</button>
      </div>
      {focusFeedback && <div style={{ textAlign: 'center', color: themes[theme].primary }}>{focusFeedback}</div>}
      {/* Session Feedback Modal */}
      {sessionFeedbackModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320 }}>
            <h3>Session Complete!</h3>
            <div style={{ marginBottom: 12 }}>
              <label>Focus Score (1-10):
                <input type="number" min={1} max={10} value={sessionFocusScore} onChange={e => setSessionFocusScore(Number(e.target.value))} style={{ width: 60, marginLeft: 8 }} />
              </label>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Interruptions:
                <input type="number" min={0} value={sessionInterruptions} onChange={e => setSessionInterruptions(Number(e.target.value))} style={{ width: 60, marginLeft: 8 }} />
              </label>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Notes:
                <textarea value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} style={{ width: '100%', minHeight: 40, marginLeft: 8 }} />
              </label>
            </div>
            <button onClick={handleSessionFeedbackSubmit} style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600, fontSize: '1.1em' }}>Submit</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusTimer; 