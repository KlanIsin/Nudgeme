import React, { useState, useContext } from 'react';
import AppContext from '../context/GlobalStateContext';
import { ActionTypes } from '../context/GlobalStateProvider';
import type { Project } from '../types';
import { IconEdit, IconTrash, IconPlus, IconCheck } from '@tabler/icons-react';

const STATUS_OPTIONS = ['active', 'paused', 'completed'];

const ProjectManager = ({ theme, themes }: { theme: any, themes: any }) => {
  const { state, dispatch } = useContext(AppContext);
  const { projects } = state;

  const [selectedProject, setSelectedProject] = useState<string>('inbox');
  const [newProject, setNewProject] = useState<Omit<Project, 'id'>>({
    name: '',
    description: '',
    currentTask: '',
    nextSteps: [],
    resources: [],
    lastWorked: Date.now(),
    timeSpent: 0,
    status: 'active',
  });
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [resourceInput, setResourceInput] = useState('');
  const [nextStepInput, setNextStepInput] = useState('');

  const handleAddProject = () => {
    if (!newProject.name.trim()) return;
    const projectToAdd: Project = {
      ...newProject,
      id: Date.now().toString(),
      lastWorked: Date.now(),
      timeSpent: 0,
    };
    dispatch({ type: ActionTypes.ADD_PROJECT, payload: projectToAdd });
    setNewProject({ name: '', description: '', currentTask: '', nextSteps: [], resources: [], lastWorked: Date.now(), timeSpent: 0, status: 'active' });
  };

  const handleUpdateProject = () => {
    if (!editingProject) return;
    dispatch({ type: ActionTypes.UPDATE_PROJECT, payload: { id: editingProject.id, updates: editingProject } });
    setEditingProject(null);
  };

  const handleDeleteProject = (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      dispatch({ type: ActionTypes.DELETE_PROJECT, payload: { id } });
      if (selectedProject === id) setSelectedProject('inbox');
    }
  };

  const handleAddResource = (project: Project) => {
    if (!resourceInput.trim()) return;
    const updated = { ...project, resources: [...project.resources, resourceInput] };
    dispatch({ type: ActionTypes.UPDATE_PROJECT, payload: { id: project.id, updates: updated } });
    setResourceInput('');
  };

  const handleRemoveResource = (project: Project, idx: number) => {
    const updated = { ...project, resources: project.resources.filter((_, i) => i !== idx) };
    dispatch({ type: ActionTypes.UPDATE_PROJECT, payload: { id: project.id, updates: updated } });
  };

  const handleAddNextStep = (project: Project) => {
    if (!nextStepInput.trim()) return;
    const updated = { ...project, nextSteps: [...project.nextSteps, nextStepInput] };
    dispatch({ type: ActionTypes.UPDATE_PROJECT, payload: { id: project.id, updates: updated } });
    setNextStepInput('');
  };

  const handleRemoveNextStep = (project: Project, idx: number) => {
    const updated = { ...project, nextSteps: project.nextSteps.filter((_, i) => i !== idx) };
    dispatch({ type: ActionTypes.UPDATE_PROJECT, payload: { id: project.id, updates: updated } });
  };

  const selected = projects.find(p => p.id === selectedProject) || projects[0];
  const progress = selected.nextSteps.length === 0 ? 0 : Math.round((selected.nextSteps.filter(s => s.startsWith('[x]')).length / selected.nextSteps.length) * 100);

  return (
    <div style={{ margin: '2rem 0', background: '#f7f7fa', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px #0001' }}>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 12, color: themes[theme].primary }}>Projects & Contexts</h2>
      {/* Project Selector */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', minWidth: 120 }}>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <span style={{ fontSize: '0.95em', color: '#888' }}>({projects.length} projects)</span>
      </div>
      {/* Context Card for Selected Project */}
      {selected && (
        <div style={{ background: '#fff', borderRadius: 10, padding: 18, marginBottom: 24, boxShadow: '0 1px 4px #0001' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1em' }}>{selected.name}</div>
              <div style={{ color: '#666', fontSize: '0.98em', marginBottom: 4 }}>{selected.description}</div>
              <div style={{ fontSize: '0.97em', marginBottom: 4 }}><b>Status:</b> {selected.status}</div>
              <div style={{ fontSize: '0.97em', marginBottom: 4 }}><b>Current Task:</b> {selected.currentTask || <span style={{ color: '#aaa' }}>None</span>}</div>
              <div style={{ fontSize: '0.97em', marginBottom: 4 }}><b>Last Worked:</b> {new Date(selected.lastWorked).toLocaleString()}</div>
              <div style={{ fontSize: '0.97em', marginBottom: 4 }}><b>Time Spent:</b> {Math.round(selected.timeSpent / 60)} min</div>
            </div>
            <button onClick={() => setEditingProject(selected)} style={{ background: 'none', border: 'none', color: themes[theme].primary, cursor: 'pointer' }}><IconEdit size={20} /></button>
          </div>
          {/* Progress Bar */}
          <div style={{ margin: '12px 0' }}>
            <div style={{ height: 10, background: '#eaf2ff', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: themes[theme].primary, borderRadius: 6, transition: 'width 0.3s' }}></div>
            </div>
            <div style={{ fontSize: '0.95em', color: '#888', marginTop: 2 }}>{progress}% complete</div>
          </div>
          {/* Next Steps */}
          <div style={{ marginBottom: 8 }}>
            <b>Next Steps:</b>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {selected.nextSteps.map((step, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{step}</span>
                  <button onClick={() => handleRemoveNextStep(selected, idx)} style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer' }}><IconTrash size={14} /></button>
                </li>
              ))}
            </ul>
            <form onSubmit={e => { e.preventDefault(); handleAddNextStep(selected); }} style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <input type="text" placeholder="Add next step" value={nextStepInput} onChange={e => setNextStepInput(e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc', fontSize: '0.97em' }} />
              <button type="submit" style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 600, cursor: 'pointer' }}><IconPlus size={16} /></button>
            </form>
          </div>
          {/* Resources */}
          <div style={{ marginBottom: 8 }}>
            <b>Resources:</b>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {selected.resources.map((res, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <a href={res} target="_blank" rel="noopener noreferrer" style={{ color: themes[theme].primary, textDecoration: 'underline' }}>{res}</a>
                  <button onClick={() => handleRemoveResource(selected, idx)} style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer' }}><IconTrash size={14} /></button>
                </li>
              ))}
            </ul>
            <form onSubmit={e => { e.preventDefault(); handleAddResource(selected); }} style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <input type="text" placeholder="Add resource URL or note" value={resourceInput} onChange={e => setResourceInput(e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc', fontSize: '0.97em' }} />
              <button type="submit" style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 600, cursor: 'pointer' }}><IconPlus size={16} /></button>
            </form>
          </div>
        </div>
      )}
      {/* Project List & Actions */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
        {projects.map(p => (
          <div key={p.id} style={{ background: '#eaf2ff', color: '#222', borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600 }}>{p.name}</span>
            <button onClick={() => setEditingProject(p)} style={{ background: 'none', border: 'none', color: themes[theme].primary, cursor: 'pointer' }}><IconEdit size={16} /></button>
            {p.id !== 'inbox' && (
              <button onClick={() => handleDeleteProject(p.id)} style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer' }}><IconTrash size={16} /></button>
            )}
          </div>
        ))}
      </div>
      {/* Add Project Form */}
      <form onSubmit={e => { e.preventDefault(); handleAddProject(); }} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="text" placeholder="New project name" value={newProject.name} onChange={e => setNewProject(n => ({ ...n, name: e.target.value }))} style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
        <input type="text" placeholder="Description" value={newProject.description} onChange={e => setNewProject(n => ({ ...n, description: e.target.value }))} style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
        <button type="submit" style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>Add</button>
      </form>
      {/* Edit Project Modal */}
      {editingProject && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320 }}>
            <h3 style={{ marginBottom: 12 }}>Edit Project</h3>
            <form onSubmit={e => { e.preventDefault(); handleUpdateProject(); }}>
              <input type="text" value={editingProject.name} onChange={e => setEditingProject(p => p ? { ...p, name: e.target.value } : null)} style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', marginBottom: 8, width: '100%' }} />
              <input type="text" value={editingProject.description} onChange={e => setEditingProject(p => p ? { ...p, description: e.target.value } : null)} style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', marginBottom: 8, width: '100%' }} />
              <input type="text" value={editingProject.currentTask} onChange={e => setEditingProject(p => p ? { ...p, currentTask: e.target.value } : null)} style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', marginBottom: 8, width: '100%' }} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <select value={editingProject.status} onChange={e => setEditingProject(p => p ? { ...p, status: e.target.value as Project['status'] } : null)} style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }}>
                  {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditingProject(null)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #ccc', background: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager; 