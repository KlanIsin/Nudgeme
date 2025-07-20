import React, { useState, useContext } from 'react';
import AppContext from '../context/GlobalStateContext';
import { ActionTypes } from '../context/GlobalStateProvider';
import type { SmartTask } from '../types';
import { IconClockPlay, IconCheck, IconX, IconEdit, IconTrash } from '@tabler/icons-react';

const CONTEXT_OPTIONS = ['home', 'work', 'errands', 'computer'];
const PRIORITY_OPTIONS = ['urgent', 'important', 'someday', 'backlog'];
const TYPE_OPTIONS = ['task', 'note', 'idea', 'reminder'];
const RECUR_OPTIONS = ['none', 'daily', 'weekly', 'monthly'];

const SmartTaskSystem = ({ theme, themes, showToast }: { theme: any, themes: any, showToast?: (message: string, type?: 'success' | 'error' | 'info') => void }) => {
  const appContext = useContext(AppContext);
  if (!appContext) return null;
  const { state, dispatch } = appContext;
  const { tasks } = state;

  const [newTask, setNewTask] = useState<Omit<SmartTask, 'id' | 'createdAt' | 'status'>>({
    content: '',
    type: 'task',
    priority: 'urgent',
    energy: 3 as 1|2|3|4|5,
    timeEstimate: 15,
    context: [],
    tags: [],
    dueDate: undefined,
    recurring: undefined,
    subtasks: [],
  });
  const [filterEnergy, setFilterEnergy] = useState<number | null>(null);
  const [filterContext, setFilterContext] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<SmartTask | null>(null);

  const handleCreateTask = () => {
    if (!newTask.content.trim()) {
      showToast && showToast('Task content is required!', 'error');
      return;
    }
    const taskToAdd: SmartTask = {
      ...newTask,
      id: Date.now().toString(),
      createdAt: Date.now(),
      status: 'pending',
    };
    dispatch({ type: ActionTypes.ADD_TASK, payload: taskToAdd });
    showToast && showToast('Task created!', 'success');
    setNewTask({ content: '', type: 'task', priority: 'urgent', energy: 3 as 1|2|3|4|5, timeEstimate: 15, context: [], tags: [], dueDate: undefined, recurring: undefined, subtasks: [] });
  };

  const filteredTasks = tasks.filter((task: SmartTask) => {
    if (filterEnergy && task.energy !== filterEnergy) return false;
    if (filterContext && !task.context.includes(filterContext)) return false;
    return true;
  });

  return (
    <section style={{ margin: '2rem 0' }}>
      <div style={{ background: '#f7f7fa', borderRadius: 12, padding: 24, marginBottom: 32, boxShadow: '0 2px 8px #0001' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 12 }}>Create New Task</h2>
        <input
          type="text"
          placeholder="Task content..."
          value={newTask.content}
          onChange={e => setNewTask(t => ({ ...t, content: e.target.value }))}
          style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
        />
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <select value={newTask.type} onChange={e => setNewTask(t => ({ ...t, type: e.target.value as SmartTask['type'] }))}>
            {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select value={newTask.priority} onChange={e => setNewTask(t => ({ ...t, priority: e.target.value as SmartTask['priority'] }))}>
            {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <input
            type="number"
            min={1}
            max={5}
            value={newTask.energy}
            onChange={e => setNewTask(t => ({ ...t, energy: Number(e.target.value) as 1|2|3|4|5 }))}
            style={{ width: 60 }}
            placeholder="Energy"
          />
          <input
            type="number"
            min={1}
            value={newTask.timeEstimate}
            onChange={e => setNewTask(t => ({ ...t, timeEstimate: Number(e.target.value) }))}
            style={{ width: 80 }}
            placeholder="Time (min)"
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <select multiple value={newTask.context} onChange={e => setNewTask(t => ({ ...t, context: Array.from(e.target.selectedOptions, o => o.value) }))}>
            {CONTEXT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={newTask.tags.join(', ')}
            onChange={e => setNewTask(t => ({ ...t, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
            style={{ width: 180 }}
          />
          <input
            type="date"
            value={newTask.dueDate ? newTask.dueDate.toString().slice(0, 10) : ''}
            onChange={e => setNewTask(t => ({ ...t, dueDate: e.target.value ? new Date(e.target.value) : undefined }))}
          />
          <select value={newTask.recurring || 'none'} onChange={e => setNewTask(t => ({ ...t, recurring: e.target.value === 'none' ? undefined : e.target.value as SmartTask['recurring'] }))}>
            {RECUR_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 8 }}>
          <input
            type="text"
            placeholder="Subtasks (comma separated)"
            value={newTask.subtasks.join(', ')}
            onChange={e => setNewTask(t => ({ ...t, subtasks: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
            style={{ width: '100%' }}
          />
        </div>
        <button onClick={handleCreateTask} style={{ background: '#4f8cff', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600, fontSize: '1.1em' }}>Add Task</button>
      </div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <label>Filter by Energy:
          <select value={filterEnergy ?? ''} onChange={e => setFilterEnergy(e.target.value ? Number(e.target.value) : null)}>
            <option value="">All</option>
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label>Filter by Context:
          <select value={filterContext ?? ''} onChange={e => setFilterContext(e.target.value || null)}>
            <option value="">All</option>
            {CONTEXT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </label>
      </div>
      <div>
        {filteredTasks.length === 0 && <div style={{ color: '#888', margin: '1em 0' }}>No tasks found.</div>}
        {filteredTasks.map(task => (
          <div key={task.id} style={{ background: '#fff', borderRadius: 8, marginBottom: 10, padding: 12, boxShadow: '0 1px 4px #0001', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ fontWeight: 600 }}>{task.content}</div>
            <div style={{ fontSize: '0.95em', color: '#666', marginBottom: 4 }}>
              {task.type} | {task.priority} | Energy: {task.energy} | Time: {task.timeEstimate} min | Context: {task.context.join(', ')}
              {task.recurring && <span> | Recurring: {task.recurring}</span>}
              {task.dueDate && <span> | Due: {task.dueDate.toString().slice(0, 10)}</span>}
            </div>
            {task.subtasks.length > 0 && <div style={{ fontSize: '0.95em', color: '#888' }}>Subtasks: {task.subtasks.join(', ')}</div>}
            {/* Add edit/delete buttons here if needed */}
          </div>
        ))}
      </div>
    </section>
  );
};

export default SmartTaskSystem; 