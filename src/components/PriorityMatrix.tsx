import React, { useState, useEffect, useMemo } from 'react';
import type { PriorityMatrix, PriorityMatrixItem } from '../types';
import { IconGrid, IconPlus, IconTarget, IconClock, IconAlertTriangle, IconCheck, IconX, IconEdit, IconTrash, IconBrain, IconZap, IconTrendingUp, IconSettings, IconFilter } from '@tabler/icons-react';

// Predefined matrices
const DEFAULT_MATRICES: Omit<PriorityMatrix, 'id' | 'createdAt' | 'lastUpdated'>[] = [
  {
    name: 'Eisenhower Matrix',
    description: 'Classic time management matrix based on urgency and importance',
    impactLevels: ['Important', 'Not Important'],
    urgencyLevels: ['Urgent', 'Not Urgent'],
    priorityMapping: {
      'Important': {
        'Urgent': 'Do First',
        'Not Urgent': 'Schedule'
      },
      'Not Important': {
        'Urgent': 'Delegate',
        'Not Urgent': 'Eliminate'
      }
    },
    isActive: true
  },
  {
    name: 'ADHD-Friendly Matrix',
    description: 'Optimized for ADHD brains with energy and impact considerations',
    impactLevels: ['High Impact', 'Medium Impact', 'Low Impact'],
    urgencyLevels: ['Critical', 'High', 'Medium', 'Low'],
    priorityMapping: {
      'High Impact': {
        'Critical': 'Do Now (High Energy)',
        'High': 'Schedule (Peak Energy)',
        'Medium': 'Plan (Good Energy)',
        'Low': 'Batch (Any Energy)'
      },
      'Medium Impact': {
        'Critical': 'Delegate or Simplify',
        'High': 'Schedule (Moderate Energy)',
        'Medium': 'Batch (Low Energy)',
        'Low': 'Consider Eliminating'
      },
      'Low Impact': {
        'Critical': 'Automate or Delegate',
        'High': 'Batch (Low Energy)',
        'Medium': 'Eliminate if Possible',
        'Low': 'Eliminate'
      }
    },
    isActive: true
  },
  {
    name: 'Energy-Based Matrix',
    description: 'Prioritize based on energy requirements and available energy',
    impactLevels: ['High Energy', 'Medium Energy', 'Low Energy'],
    urgencyLevels: ['Critical', 'High', 'Medium', 'Low'],
    priorityMapping: {
      'High Energy': {
        'Critical': 'Do in Peak Energy Window',
        'High': 'Schedule for High Energy',
        'Medium': 'Break into Smaller Tasks',
        'Low': 'Consider Delegating'
      },
      'Medium Energy': {
        'Critical': 'Do When Energy is Available',
        'High': 'Schedule for Moderate Energy',
        'Medium': 'Batch with Similar Tasks',
        'Low': 'Do During Low Energy'
      },
      'Low Energy': {
        'Critical': 'Simplify or Delegate',
        'High': 'Break into Micro-Tasks',
        'Medium': 'Perfect for Low Energy',
        'Low': 'Eliminate or Automate'
      }
    },
    isActive: true
  }
];

const PriorityMatrix = ({ theme, themes, showToast }: { theme: any, themes: any, showToast: (message: string, type?: 'success' | 'error' | 'info') => void }) => {
  const [matrices, setMatrices] = useState<PriorityMatrix[]>(() => {
    const raw = localStorage.getItem('priorityMatrices');
    return raw ? JSON.parse(raw) : DEFAULT_MATRICES.map(m => ({ 
      ...m, 
      id: Date.now().toString() + Math.random(), 
      createdAt: Date.now(), 
      lastUpdated: Date.now() 
    }));
  });

  const [matrixItems, setMatrixItems] = useState<PriorityMatrixItem[]>(() => {
    const raw = localStorage.getItem('priorityMatrixItems');
    return raw ? JSON.parse(raw) : [];
  });

  const [selectedMatrix, setSelectedMatrix] = useState<string | null>(null);
  const [matrixModal, setMatrixModal] = useState(false);
  const [itemModal, setItemModal] = useState(false);
  const [analysisModal, setAnalysisModal] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<string | 'all'>('all');

  const [form, setForm] = useState<Omit<PriorityMatrix, 'id' | 'createdAt' | 'lastUpdated'>>({
    name: '',
    description: '',
    impactLevels: ['High', 'Medium', 'Low'],
    urgencyLevels: ['Critical', 'High', 'Medium', 'Low'],
    priorityMapping: {},
    isActive: true,
  });

  const [itemForm, setItemForm] = useState<Omit<PriorityMatrixItem, 'id' | 'matrixId'>>({
    impact: '',
    urgency: '',
    priority: '',
    description: '',
    recommendations: [],
    estimatedEffort: 5,
    estimatedImpact: 5,
    isCustom: false,
  });

  const [impactInput, setImpactInput] = useState('');
  const [urgencyInput, setUrgencyInput] = useState('');
  const [recommendationInput, setRecommendationInput] = useState('');

  useEffect(() => {
    localStorage.setItem('priorityMatrices', JSON.stringify(matrices));
  }, [matrices]);

  useEffect(() => {
    localStorage.setItem('priorityMatrixItems', JSON.stringify(matrixItems));
  }, [matrixItems]);

  const handleMatrixSubmit = () => {
    if (!form.name.trim() || !form.description.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    // Generate priority mapping
    const priorityMapping: Record<string, Record<string, string>> = {};
    form.impactLevels.forEach(impact => {
      priorityMapping[impact] = {};
      form.urgencyLevels.forEach(urgency => {
        priorityMapping[impact][urgency] = 'Custom Priority';
      });
    });

    const newMatrix: PriorityMatrix = {
      ...form,
      priorityMapping,
      id: Date.now().toString(),
      createdAt: Date.now(),
      lastUpdated: Date.now(),
    };

    setMatrices(prev => [newMatrix, ...prev]);
    setMatrixModal(false);
    showToast('Priority matrix created!', 'success');

    // Reset form
    setForm({
      name: '',
      description: '',
      impactLevels: ['High', 'Medium', 'Low'],
      urgencyLevels: ['Critical', 'High', 'Medium', 'Low'],
      priorityMapping: {},
      isActive: true,
    });
  };

  const handleItemSubmit = () => {
    if (!selectedMatrix || !itemForm.description.trim()) {
      showToast('Please select a matrix and fill in the description', 'error');
      return;
    }

    const newItem: PriorityMatrixItem = {
      ...itemForm,
      id: Date.now().toString(),
      matrixId: selectedMatrix,
    };

    setMatrixItems(prev => [newItem, ...prev]);
    setItemModal(false);
    showToast('Item added to matrix!', 'success');

    // Reset form
    setItemForm({
      impact: '',
      urgency: '',
      priority: '',
      description: '',
      recommendations: [],
      estimatedEffort: 5,
      estimatedImpact: 5,
      isCustom: false,
    });
    setRecommendationInput('');
  };

  const addRecommendation = () => {
    if (recommendationInput.trim()) {
      setItemForm(f => ({ ...f, recommendations: [...f.recommendations, recommendationInput.trim()] }));
      setRecommendationInput('');
    }
  };

  const getPriorityColor = (priority: string) => {
    const priorityLower = priority.toLowerCase();
    if (priorityLower.includes('do first') || priorityLower.includes('critical') || priorityLower.includes('now')) {
      return '#dc3545';
    } else if (priorityLower.includes('schedule') || priorityLower.includes('high')) {
      return '#fd7e14';
    } else if (priorityLower.includes('plan') || priorityLower.includes('medium')) {
      return '#ffc107';
    } else if (priorityLower.includes('delegate') || priorityLower.includes('batch')) {
      return '#17a2b8';
    } else if (priorityLower.includes('eliminate') || priorityLower.includes('low')) {
      return '#6c757d';
    }
    return themes[theme].primary;
  };

  const getPriorityIcon = (priority: string) => {
    const priorityLower = priority.toLowerCase();
    if (priorityLower.includes('do first') || priorityLower.includes('critical')) {
      return <IconAlertTriangle size={16} />;
    } else if (priorityLower.includes('schedule') || priorityLower.includes('high')) {
      return <IconClock size={16} />;
    } else if (priorityLower.includes('plan') || priorityLower.includes('medium')) {
      return <IconTarget size={16} />;
    } else if (priorityLower.includes('delegate') || priorityLower.includes('batch')) {
      return <IconUsers size={16} />;
    } else if (priorityLower.includes('eliminate') || priorityLower.includes('low')) {
      return <IconX size={16} />;
    }
    return <IconTarget size={16} />;
  };

  const getEffortImpactScore = (effort: number, impact: number) => {
    // Calculate ROI-like score: (Impact - Effort) / 10
    return ((impact - effort) / 10) * 100;
  };

  const getEffortImpactColor = (effort: number, impact: number) => {
    const score = getEffortImpactScore(effort, impact);
    if (score >= 30) return '#28a745'; // High ROI
    if (score >= 0) return '#ffc107'; // Medium ROI
    return '#dc3545'; // Low ROI
  };

  const currentMatrix = matrices.find(m => m.id === selectedMatrix);
  const matrixItemsForCurrent = matrixItems.filter(item => item.matrixId === selectedMatrix);
  const filteredItems = selectedPriority === 'all' 
    ? matrixItemsForCurrent 
    : matrixItemsForCurrent.filter(item => item.priority === selectedPriority);

  const priorities = currentMatrix ? 
    [...new Set(matrixItemsForCurrent.map(item => item.priority))] : [];

  const analysis = useMemo(() => {
    if (!currentMatrix || matrixItemsForCurrent.length === 0) return null;

    const totalItems = matrixItemsForCurrent.length;
    const priorityCounts = priorities.reduce((acc, priority) => {
      acc[priority] = matrixItemsForCurrent.filter(item => item.priority === priority).length;
      return acc;
    }, {} as Record<string, number>);

    const avgEffort = matrixItemsForCurrent.reduce((sum, item) => sum + item.estimatedEffort, 0) / totalItems;
    const avgImpact = matrixItemsForCurrent.reduce((sum, item) => sum + item.estimatedImpact, 0) / totalItems;
    const avgROI = getEffortImpactScore(avgEffort, avgImpact);

    const highROIItems = matrixItemsForCurrent.filter(item => 
      getEffortImpactScore(item.estimatedEffort, item.estimatedImpact) >= 30
    );

    return {
      totalItems,
      priorityCounts,
      avgEffort,
      avgImpact,
      avgROI,
      highROIItems: highROIItems.length,
      highROIPercentage: (highROIItems.length / totalItems) * 100
    };
  }, [currentMatrix, matrixItemsForCurrent, priorities]);

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12, color: themes[theme].primary }}>
        <IconGrid style={{ marginRight: 8 }} />
        Priority Matrix
      </h2>

      {/* Matrix Selection */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
          Select Priority Matrix:
        </label>
        <select
          value={selectedMatrix || ''}
          onChange={e => setSelectedMatrix(e.target.value || null)}
          style={{ 
            width: '100%', 
            padding: '8px 12px', 
            borderRadius: 6, 
            border: '1px solid #ddd',
            fontSize: '1em'
          }}
        >
          <option value="">Choose a matrix...</option>
          {matrices.map(matrix => (
            <option key={matrix.id} value={matrix.id}>
              {matrix.name}
            </option>
          ))}
        </select>
      </div>

      {currentMatrix && (
        <>
          {/* Matrix Description */}
          <div style={{ 
            background: '#f8f9fa', 
            padding: 16, 
            borderRadius: 8, 
            marginBottom: 16,
            borderLeft: `4px solid ${themes[theme].primary}`
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1em', fontWeight: 600 }}>
              {currentMatrix.name}
            </h3>
            <p style={{ margin: 0, fontSize: '0.95em', color: '#666', lineHeight: 1.5 }}>
              {currentMatrix.description}
            </p>
          </div>

          {/* Analysis Stats */}
          {analysis && (
            <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 4px #0001', minWidth: 120 }}>
                <div style={{ fontSize: '1.2em', fontWeight: 700, color: themes[theme].primary }}>{analysis.totalItems}</div>
                <div style={{ fontSize: '0.9em', color: '#666' }}>Total Items</div>
              </div>
              <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 4px #0001', minWidth: 120 }}>
                <div style={{ fontSize: '1.2em', fontWeight: 700, color: '#28a745' }}>{analysis.highROIItems}</div>
                <div style={{ fontSize: '0.9em', color: '#666' }}>High ROI Items</div>
              </div>
              <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 4px #0001', minWidth: 120 }}>
                <div style={{ fontSize: '1.2em', fontWeight: 700, color: '#ffc107' }}>{analysis.avgROI.toFixed(0)}%</div>
                <div style={{ fontSize: '0.9em', color: '#666' }}>Avg ROI</div>
              </div>
              <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 4px #0001', minWidth: 120 }}>
                <div style={{ fontSize: '1.2em', fontWeight: 700, color: '#17a2b8' }}>{analysis.avgEffort.toFixed(1)}</div>
                <div style={{ fontSize: '0.9em', color: '#666' }}>Avg Effort</div>
              </div>
            </div>
          )}

          {/* Priority Filter */}
          <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9em', fontWeight: 600, color: '#333' }}>Filter by Priority:</span>
            {(['all', ...priorities] as const).map(priority => (
              <button
                key={priority}
                onClick={() => setSelectedPriority(priority)}
                style={{
                  background: selectedPriority === priority ? getPriorityColor(priority) : '#f0f0f0',
                  color: selectedPriority === priority ? '#fff' : '#333',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: '0.85em',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                {selectedPriority === priority && getPriorityIcon(priority)}
                {priority === 'all' ? 'All' : priority}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setItemModal(true)}
              style={{
                background: themes[theme].primary,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '0.7em 1.5em',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <IconPlus size={16} />
              Add Item
            </button>
            <button
              onClick={() => setAnalysisModal(true)}
              style={{
                background: '#17a2b8',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '0.7em 1.5em',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <IconTrendingUp size={16} />
              Detailed Analysis
            </button>
          </div>

          {/* Matrix Visualization */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${currentMatrix.urgencyLevels.length}, 1fr)`,
            gap: 12,
            marginBottom: 24
          }}>
            {/* Header row */}
            <div style={{ fontWeight: 600, color: '#666', textAlign: 'center' }}>Impact →</div>
            {currentMatrix.urgencyLevels.map(urgency => (
              <div key={urgency} style={{ 
                fontWeight: 600, 
                color: '#333', 
                textAlign: 'center',
                padding: '8px 4px',
                background: '#f8f9fa',
                borderRadius: 4
              }}>
                {urgency}
              </div>
            ))}

            {/* Matrix cells */}
            {currentMatrix.impactLevels.map(impact => (
              <React.Fragment key={impact}>
                <div style={{ 
                  fontWeight: 600, 
                  color: '#333', 
                  textAlign: 'center',
                  padding: '8px 4px',
                  background: '#f8f9fa',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {impact}
                </div>
                {currentMatrix.urgencyLevels.map(urgency => {
                  const priority = currentMatrix.priorityMapping[impact]?.[urgency] || 'Custom';
                  const itemsInCell = filteredItems.filter(item => 
                    item.impact === impact && item.urgency === urgency
                  );
                  
                  return (
                    <div key={`${impact}-${urgency}`} style={{
                      background: '#fff',
                      border: `2px solid ${getPriorityColor(priority)}`,
                      borderRadius: 8,
                      padding: 12,
                      minHeight: 120,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}>
                      <div style={{
                        background: getPriorityColor(priority),
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: '0.8em',
                        fontWeight: 600,
                        textAlign: 'center'
                      }}>
                        {priority}
                      </div>
                      <div style={{ fontSize: '0.85em', color: '#666' }}>
                        {itemsInCell.length} items
                      </div>
                      {itemsInCell.slice(0, 2).map(item => (
                        <div key={item.id} style={{
                          fontSize: '0.8em',
                          padding: '4px 6px',
                          background: '#f8f9fa',
                          borderRadius: 4,
                          borderLeft: `3px solid ${getPriorityColor(item.priority)}`
                        }}>
                          {item.description.slice(0, 30)}...
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          {/* Items List */}
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
              <IconTarget size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
              <p>No items found. Add items to start using your priority matrix!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredItems.map(item => {
                const roiScore = getEffortImpactScore(item.estimatedEffort, item.estimatedImpact);
                
                return (
                  <div key={item.id} style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: 16,
                    boxShadow: '0 2px 8px #0001',
                    borderLeft: `4px solid ${getPriorityColor(item.priority)}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '1em', fontWeight: 600, color: '#333' }}>
                          {item.description}
                        </h4>
                        <div style={{ fontSize: '0.85em', color: '#666', marginTop: 4 }}>
                          Impact: {item.impact} • Urgency: {item.urgency}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          background: getPriorityColor(item.priority),
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: '0.8em',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          {getPriorityIcon(item.priority)}
                          {item.priority}
                        </div>
                      </div>
                    </div>

                    {/* Effort/Impact Analysis */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                      <div style={{ fontSize: '0.85em', color: '#666' }}>
                        Effort: {item.estimatedEffort}/10
                      </div>
                      <div style={{ fontSize: '0.85em', color: '#666' }}>
                        Impact: {item.estimatedImpact}/10
                      </div>
                      <div style={{ 
                        fontSize: '0.85em', 
                        fontWeight: 600,
                        color: getEffortImpactColor(item.estimatedEffort, item.estimatedImpact)
                      }}>
                        ROI: {roiScore.toFixed(0)}%
                      </div>
                    </div>

                    {/* Recommendations */}
                    {item.recommendations.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: '0.85em', fontWeight: 600, color: '#333', marginBottom: 4 }}>
                          Recommendations:
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.8em', color: '#666' }}>
                          {item.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Matrix Creation Modal */}
      {matrixModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>Create Priority Matrix</h3>
            <form onSubmit={e => { e.preventDefault(); handleMatrixSubmit(); }}>
              <label>Matrix Name: *
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="e.g., My Custom Matrix"
                />
              </label>

              <label>Description: *
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="Describe your matrix approach..."
                />
              </label>

              <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setMatrixModal(false)} style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>
                  Create Matrix
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Creation Modal */}
      {itemModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>Add Matrix Item</h3>
            <form onSubmit={e => { e.preventDefault(); handleItemSubmit(); }}>
              <label>Description: *
                <textarea
                  value={itemForm.description}
                  onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))}
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="Describe the task, project, or decision..."
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label>Impact Level:
                  <select
                    value={itemForm.impact}
                    onChange={e => setItemForm(f => ({ ...f, impact: e.target.value }))}
                    style={{ width: '100%', marginTop: 4 }}
                  >
                    <option value="">Select impact...</option>
                    {currentMatrix?.impactLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </label>

                <label>Urgency Level:
                  <select
                    value={itemForm.urgency}
                    onChange={e => setItemForm(f => ({ ...f, urgency: e.target.value }))}
                    style={{ width: '100%', marginTop: 4 }}
                  >
                    <option value="">Select urgency...</option>
                    {currentMatrix?.urgencyLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label>Estimated Effort (1-10):
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={itemForm.estimatedEffort}
                    onChange={e => setItemForm(f => ({ ...f, estimatedEffort: Number(e.target.value) }))}
                    style={{ width: '100%', marginTop: 4 }}
                  />
                </label>

                <label>Estimated Impact (1-10):
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={itemForm.estimatedImpact}
                    onChange={e => setItemForm(f => ({ ...f, estimatedImpact: Number(e.target.value) }))}
                    style={{ width: '100%', marginTop: 4 }}
                  />
                </label>
              </div>

              {/* Recommendations */}
              <div style={{ margin: '12px 0' }}>
                <label>Recommendations:
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <input
                      type="text"
                      value={recommendationInput}
                      onChange={e => setRecommendationInput(e.target.value)}
                      style={{ flex: 1 }}
                      placeholder="e.g., Break into smaller tasks"
                    />
                    <button type="button" onClick={addRecommendation} style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px' }}>
                      Add
                    </button>
                  </div>
                </label>
                {itemForm.recommendations.length > 0 && (
                  <div style={{ fontSize: '0.9em', color: '#666', marginTop: 4 }}>
                    {itemForm.recommendations.join(', ')}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setItemModal(false)} style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600 }}>
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      {analysisModal && analysis && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>Detailed Matrix Analysis</h3>
            
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Priority Distribution</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(analysis.priorityCounts).map(([priority, count]) => (
                  <div key={priority} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: getPriorityColor(priority)
                      }} />
                      <span style={{ fontSize: '0.9em' }}>{priority}</span>
                    </div>
                    <div style={{ fontSize: '0.9em', fontWeight: 600 }}>
                      {count} ({((count / analysis.totalItems) * 100).toFixed(1)}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>ROI Analysis</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>Average ROI</div>
                  <div style={{ fontSize: '1.5em', fontWeight: 700, color: getEffortImpactColor(analysis.avgEffort, analysis.avgImpact) }}>
                    {analysis.avgROI.toFixed(1)}%
                  </div>
                </div>
                <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>High ROI Items</div>
                  <div style={{ fontSize: '1.5em', fontWeight: 700, color: '#28a745' }}>
                    {analysis.highROIPercentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Recommendations</h4>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.9em', color: '#666' }}>
                {analysis.avgROI < 0 && (
                  <li>Consider eliminating or delegating low-ROI items</li>
                )}
                {analysis.highROIPercentage < 30 && (
                  <li>Focus on high-impact, low-effort opportunities</li>
                )}
                {analysis.avgEffort > 7 && (
                  <li>Break down high-effort items into smaller tasks</li>
                )}
                <li>Review priority distribution to ensure balance</li>
                <li>Regularly update effort and impact estimates</li>
              </ul>
            </div>

            <button
              onClick={() => setAnalysisModal(false)}
              style={{ background: themes[theme].primary, color: '#fff', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 600, width: '100%' }}
            >
              Close Analysis
            </button>
          </div>
        </div>
      )}

      {/* Create Matrix Button */}
      {!selectedMatrix && (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          <IconGrid size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <p>Select a priority matrix to get started, or create your own!</p>
          <button
            onClick={() => setMatrixModal(true)}
            style={{
              background: themes[theme].primary,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0.7em 1.5em',
              fontWeight: 600,
              marginTop: 16
            }}
          >
            Create Custom Matrix
          </button>
        </div>
      )}
    </div>
  );
};

export default PriorityMatrix; 