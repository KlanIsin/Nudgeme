import React, { useContext, useMemo } from 'react';
import AppContext from '../context/GlobalStateContext';
import { 
  IconBrain, 
  IconTrendingUp, 
  IconZap, 
  IconTarget, 
  IconClock, 
  IconAlertTriangle, 
  IconCheck, 
  IconX, 
  IconUsers, 
  IconLightbulb, 
  IconChartLine, 
  IconBulb, 
  IconRefresh,
  IconSettings,
  IconEye,
  IconBrainCircuit,
  IconSparkles
} from '@tabler/icons-react';

const SystemIntegration = ({ theme, themes, showToast }: { theme: any, themes: any, showToast: (message: string, type?: 'success' | 'error' | 'info') => void }) => {
  const { state, dispatch } = useContext(AppContext);

  const insights = state.crossFeatureInsights;
  const recommendations = state.integrationState.crossFeatureRecommendations;
  const automatedActions = state.integrationState.automatedActions;

  // Calculate current energy level based on recent data
  const currentEnergyLevel = useMemo(() => {
    const recentMoods = state.moods
      .filter(m => Date.now() - m.timestamp < 4 * 60 * 60 * 1000) // Last 4 hours
      .slice(0, 3);
    
    if (recentMoods.length === 0) return 5; // Default neutral
    
    const avgEnergy = recentMoods.reduce((sum, mood) => {
      return sum + (mood.symptoms.focus + mood.symptoms.motivation) / 2;
    }, 0) / recentMoods.length;
    
    return Math.round(avgEnergy);
  }, [state.moods]);

  // Get optimal tasks for current energy
  const optimalTasksForEnergy = useMemo(() => {
    const currentHour = new Date().getHours();
    const isPeakHour = insights.energyPatterns.peakHours.includes(currentHour);
    
    if (isPeakHour && currentEnergyLevel >= 7) {
      return state.tasks.filter(t => t.energy >= 4 && t.status === 'pending');
    } else if (currentEnergyLevel >= 5) {
      return state.tasks.filter(t => t.energy >= 3 && t.energy <= 6 && t.status === 'pending');
    } else {
      return state.tasks.filter(t => t.energy <= 3 && t.status === 'pending');
    }
  }, [state.tasks, currentEnergyLevel, insights.energyPatterns.peakHours]);

  // Get sensory recommendations
  const sensoryRecommendations = useMemo(() => {
    const recentSensoryCheckins = state.sensoryCheckins
      .filter(s => Date.now() - s.timestamp < 24 * 60 * 60 * 1000);
    
    if (recentSensoryCheckins.some(s => s.overloadWarning)) {
      return insights.sensoryOptimization.focusEnhancers;
    }
    
    return insights.sensoryOptimization.optimalEnvironments;
  }, [state.sensoryCheckins, insights.sensoryOptimization]);

  // Get priority matrix insights
  const priorityInsights = useMemo(() => {
    const highPriorityItems = state.priorityMatrixItems.filter(item => 
      item.priority.toLowerCase().includes('high') || item.priority.toLowerCase().includes('critical')
    );
    
    const highROIItems = state.priorityMatrixItems.filter(item => {
      const roi = ((item.estimatedImpact - item.estimatedEffort) / 10) * 100;
      return roi >= 30;
    });
    
    return { highPriorityItems, highROIItems };
  }, [state.priorityMatrixItems]);

  // Get achievement progress
  const achievementInsights = useMemo(() => {
    const recentAchievements = state.achievements
      .filter(a => a.isUnlocked && Date.now() - (a.unlockedAt || 0) < 7 * 24 * 60 * 60 * 1000);
    
    const closeToUnlocking = state.achievementProgress
      .filter(p => {
        const progress = (p.currentValue / p.targetValue) * 100;
        return progress >= 80 && progress < 100;
      });
    
    return { recentAchievements, closeToUnlocking };
  }, [state.achievements, state.achievementProgress]);

  const getEnergyColor = (level: number) => {
    if (level >= 8) return '#28a745';
    if (level >= 6) return '#ffc107';
    if (level >= 4) return '#fd7e14';
    return '#dc3545';
  };

  const getEnergyIcon = (level: number) => {
    if (level >= 8) return <IconZap size={16} />;
    if (level >= 6) return <IconTarget size={16} />;
    if (level >= 4) return <IconClock size={16} />;
    return <IconAlertTriangle size={16} />;
  };

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12, color: themes[theme].primary }}>
        <IconBrainCircuit style={{ marginRight: 8 }} />
        System Integration & Insights
      </h2>

      {/* Current Status Overview */}
      <div style={{ 
        background: '#fff', 
        borderRadius: 12, 
        padding: 20, 
        marginBottom: 24,
        boxShadow: '0 2px 8px #0001',
        border: `1px solid ${themes[theme].primary}20`
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1em', fontWeight: 600, color: '#333' }}>
          <IconEye style={{ marginRight: 8 }} />
          Current Status
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '2em', 
              fontWeight: 700, 
              color: getEnergyColor(currentEnergyLevel),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}>
              {getEnergyIcon(currentEnergyLevel)}
              {currentEnergyLevel}/10
            </div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>Current Energy</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 700, color: themes[theme].primary }}>
              {optimalTasksForEnergy.length}
            </div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>Optimal Tasks Available</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 700, color: '#17a2b8' }}>
              {priorityInsights.highPriorityItems.length}
            </div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>High Priority Items</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 700, color: '#28a745' }}>
              {priorityInsights.highROIItems.length}
            </div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>High ROI Opportunities</div>
          </div>
        </div>
      </div>

      {/* Cross-Feature Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>
        
        {/* Energy Patterns */}
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          padding: 20,
          boxShadow: '0 2px 8px #0001'
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '1em', fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconZap size={16} />
            Energy Patterns
          </h4>
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: '0.9em', color: '#666', marginBottom: 4 }}>Peak Hours:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {insights.energyPatterns.peakHours.map(hour => (
                <span key={hour} style={{
                  background: themes[theme].primary,
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.8em',
                  fontWeight: 600
                }}>
                  {hour}:00
                </span>
              ))}
            </div>
          </div>
          
          <div style={{ fontSize: '0.9em', color: '#666' }}>
            <div style={{ marginBottom: 4 }}>Low Energy Triggers:</div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.85em' }}>
              {insights.energyPatterns.lowEnergyTriggers.map(trigger => (
                <li key={trigger}>{trigger}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Productivity Insights */}
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          padding: 20,
          boxShadow: '0 2px 8px #0001'
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '1em', fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconTrendingUp size={16} />
            Productivity Insights
          </h4>
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: '0.9em', color: '#666', marginBottom: 4 }}>
              Optimal Session Length: <strong>{insights.productivityInsights.optimalSessionLength} minutes</strong>
            </div>
          </div>
          
          <div style={{ fontSize: '0.9em', color: '#666' }}>
            <div style={{ marginBottom: 4 }}>Best Task Types:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {insights.productivityInsights.bestTaskTypes.map(type => (
                <span key={type} style={{
                  background: '#e9ecef',
                  color: '#495057',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.8em'
                }}>
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sensory Optimization */}
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          padding: 20,
          boxShadow: '0 2px 8px #0001'
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '1em', fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconBrain size={16} />
            Sensory Optimization
          </h4>
          
          <div style={{ fontSize: '0.9em', color: '#666' }}>
            <div style={{ marginBottom: 4 }}>Optimal Environments:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
              {insights.sensoryOptimization.optimalEnvironments.map(env => (
                <span key={env} style={{
                  background: '#d4edda',
                  color: '#155724',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.8em'
                }}>
                  {env}
                </span>
              ))}
            </div>
            
            <div style={{ marginBottom: 4 }}>Focus Enhancers:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {insights.sensoryOptimization.focusEnhancers.map(enhancer => (
                <span key={enhancer} style={{
                  background: '#fff3cd',
                  color: '#856404',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.8em'
                }}>
                  {enhancer}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Social Productivity */}
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          padding: 20,
          boxShadow: '0 2px 8px #0001'
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '1em', fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconUsers size={16} />
            Social Productivity
          </h4>
          
          <div style={{ fontSize: '0.9em', color: '#666' }}>
            <div style={{ marginBottom: 4 }}>Collaborative Tasks:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
              {insights.socialProductivity.collaborativeTasks.map(task => (
                <span key={task} style={{
                  background: '#cce5ff',
                  color: '#004085',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.8em'
                }}>
                  {task}
                </span>
              ))}
            </div>
            
            <div style={{ marginBottom: 4 }}>Solo Tasks:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {insights.socialProductivity.soloTasks.map(task => (
                <span key={task} style={{
                  background: '#f8d7da',
                  color: '#721c24',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.8em'
                }}>
                  {task}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Smart Recommendations */}
      {recommendations.length > 0 && (
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          padding: 20, 
          marginBottom: 24,
          boxShadow: '0 2px 8px #0001',
          borderLeft: `4px solid ${themes[theme].primary}`
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1em', fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconLightbulb size={16} />
            Smart Recommendations
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recommendations.map((rec, index) => (
              <div key={index} style={{
                background: '#f8f9fa',
                padding: 12,
                borderRadius: 8,
                borderLeft: `3px solid ${themes[theme].primary}`,
                fontSize: '0.9em',
                color: '#333'
              }}>
                {rec}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimal Tasks for Current Energy */}
      {optimalTasksForEnergy.length > 0 && (
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          padding: 20, 
          marginBottom: 24,
          boxShadow: '0 2px 8px #0001'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1em', fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconTarget size={16} />
            Optimal Tasks for Your Current Energy ({currentEnergyLevel}/10)
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {optimalTasksForEnergy.slice(0, 5).map(task => (
              <div key={task.id} style={{
                background: '#f8f9fa',
                padding: 12,
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.9em', fontWeight: 600, color: '#333' }}>
                    {task.content}
                  </div>
                  <div style={{ fontSize: '0.8em', color: '#666' }}>
                    Energy: {task.energy}/5 • Type: {task.type}
                  </div>
                </div>
                <div style={{
                  background: getEnergyColor(task.energy * 2),
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: '0.8em',
                  fontWeight: 600
                }}>
                  {task.energy * 2}/10
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sensory Recommendations */}
      {sensoryRecommendations.length > 0 && (
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          padding: 20, 
          marginBottom: 24,
          boxShadow: '0 2px 8px #0001'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1em', fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconBrain size={16} />
            Sensory Environment Recommendations
          </h3>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {sensoryRecommendations.map((rec, index) => (
              <span key={index} style={{
                background: '#e3f2fd',
                color: '#1565c0',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: '0.9em',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <IconSparkles size={14} />
                {rec}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Achievement Insights */}
      {(achievementInsights.recentAchievements.length > 0 || achievementInsights.closeToUnlocking.length > 0) && (
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          padding: 20, 
          marginBottom: 24,
          boxShadow: '0 2px 8px #0001'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1em', fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconChartLine size={16} />
            Achievement Insights
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            {achievementInsights.recentAchievements.length > 0 && (
              <div>
                <div style={{ fontSize: '0.9em', fontWeight: 600, color: '#28a745', marginBottom: 8 }}>
                  Recent Achievements ({achievementInsights.recentAchievements.length})
                </div>
                <div style={{ fontSize: '0.85em', color: '#666' }}>
                  {achievementInsights.recentAchievements.slice(0, 3).map(achievement => (
                    <div key={achievement.id} style={{ marginBottom: 4 }}>
                      🏆 {achievement.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {achievementInsights.closeToUnlocking.length > 0 && (
              <div>
                <div style={{ fontSize: '0.9em', fontWeight: 600, color: '#ffc107', marginBottom: 8 }}>
                  Close to Unlocking ({achievementInsights.closeToUnlocking.length})
                </div>
                <div style={{ fontSize: '0.85em', color: '#666' }}>
                  {achievementInsights.closeToUnlocking.slice(0, 3).map(progress => {
                    const achievement = state.achievements.find(a => a.id === progress.achievementId);
                    const percentage = Math.round((progress.currentValue / progress.targetValue) * 100);
                    return (
                      <div key={progress.id} style={{ marginBottom: 4 }}>
                        ⏳ {achievement?.name} ({percentage}%)
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Automated Actions */}
      {automatedActions.length > 0 && (
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          padding: 20, 
          marginBottom: 24,
          boxShadow: '0 2px 8px #0001'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1em', fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconSettings size={16} />
            Automated Actions
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {automatedActions.slice(0, 5).map(action => (
              <div key={action.id} style={{
                background: '#f8f9fa',
                padding: 12,
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.9em', fontWeight: 600, color: '#333' }}>
                    {action.description}
                  </div>
                  <div style={{ fontSize: '0.8em', color: '#666' }}>
                    {new Date(action.timestamp).toLocaleString()}
                  </div>
                </div>
                <div style={{
                  background: action.executed ? '#28a745' : '#ffc107',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: '0.8em',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  {action.executed ? <IconCheck size={12} /> : <IconClock size={12} />}
                  {action.executed ? 'Executed' : 'Pending'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integration Status */}
      <div style={{ 
        background: '#f8f9fa', 
        borderRadius: 12, 
        padding: 16,
        textAlign: 'center',
        fontSize: '0.9em',
        color: '#666'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <IconRefresh size={16} />
          Last Updated: {new Date(state.integrationState.lastSync).toLocaleString()}
        </div>
        <div>System integration is actively analyzing your data to provide personalized insights</div>
      </div>
    </div>
  );
};

export default SystemIntegration; 