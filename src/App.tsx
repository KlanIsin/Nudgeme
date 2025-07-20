import React, { useState, useEffect, useCallback } from 'react';
import { GlobalStateProvider, useGlobalState } from './context/GlobalStateProvider';
import { storage } from './utils/storage';
import { cloudSync } from './utils/cloudSync';
import { notificationManager } from './utils/notifications';
import { aiIntegration } from './utils/aiIntegration';
import MobileOptimizedLayout from './components/MobileOptimizedLayout';
import AccessibilityProvider from './components/AccessibilityProvider';
import VirtualizedList from './components/VirtualizedList';
import LoginScreen from './components/LoginScreen';
import { authManager, User } from './utils/auth';

// Import all components
import FocusTimer from './components/FocusTimer';
import GoalTracker from './components/GoalTracker';
import MoodAnalysis from './components/MoodAnalysis';
import PatternRecognition from './components/PatternRecognition';
import ProjectManager from './components/ProjectManager';
import SensoryTools from './components/SensoryTools';
import SmartTaskSystem from './components/SmartTaskSystem';
import SocialTracker from './components/SocialTracker';
import DistractionManager from './components/DistractionManager';
import PriorityMatrix from './components/PriorityMatrix';
import SystemIntegration from './components/SystemIntegration';

// Import types
import { ActionTypes } from './context/GlobalStateContext';
import { AISuggestion, NLPResult } from './utils/aiIntegration';

// Toast notification component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => (
  <div style={{
    position: 'fixed',
    top: 20,
    right: 20,
    background: type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3',
    color: '#fff',
    padding: '12px 16px',
    borderRadius: 8,
    zIndex: 10000,
    maxWidth: 300,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  }}>
    {message}
    <button
      onClick={onClose}
      style={{
        background: 'none',
        border: 'none',
        color: '#fff',
        marginLeft: 12,
        cursor: 'pointer'
      }}
    >
      ×
    </button>
  </div>
);

// Main App Content
const AppContent = () => {
  const { state, dispatch } = useGlobalState();
  const [currentSection, setCurrentSection] = useState('overview');
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const user = authManager.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  // Initialize all systems
  useEffect(() => {
    if (!currentUser) return; // Only initialize if user is authenticated

    const initializeSystems = async () => {
      try {
        // Initialize storage
        await storage.initialize();
        
        // Initialize cloud sync
        await cloudSync.initialize();
        
        // Initialize notifications
        await notificationManager.initialize();
        
        // Initialize AI integration
        await aiIntegration.initialize();
        
        // Load initial data
        await loadInitialData();
        
        setIsInitialized(true);
        showToast(`Welcome back, ${currentUser.name}! 🎉`, 'success');
      } catch (error) {
        console.error('Failed to initialize systems:', error);
        showToast('Some features may not be available', 'error');
      }
    };

    initializeSystems();
  }, [currentUser]);

  // Handle user login
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    showToast(`Welcome, ${user.name}! 🎉`, 'success');
  };

  // Handle user logout
  const handleLogout = () => {
    authManager.logout();
    setCurrentUser(null);
    setIsInitialized(false);
    showToast('Logged out successfully', 'info');
  };

  // Load initial data
  const loadInitialData = async () => {
    try {
      // Load data from storage
      const tasks = await storage.getAll('tasks');
      const focusSessions = await storage.getAll('focusSessions');
      const moods = await storage.getAll('moods');
      const goals = await storage.getAll('goals');
      const sensoryCheckins = await storage.getAll('sensoryCheckins');
      const socialEntries = await storage.getAll('socialEntries');
      const distractions = await storage.getAll('distractions');
      const achievements = await storage.getAll('achievements');
      const challenges = await storage.getAll('challenges');
      const priorityMatrices = await storage.getAll('priorityMatrices');
      const reminders = await storage.getAll('reminders');
      const integrations = await storage.getAll('integrations');

      // Update global state
      dispatch({ type: ActionTypes.LOAD_INITIAL_DATA, payload: {
        tasks,
        focusSessions,
        moods,
        goals,
        sensoryCheckins,
        socialEntries,
        distractions,
        achievements,
        challenges,
        priorityMatrices,
        reminders,
        integrations
      }});
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  // Show toast notification
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  // Handle section navigation
  const handleNavigate = useCallback((section: string) => {
    setCurrentSection(section);
    
    // Generate AI suggestions for the new section
    generateAISuggestions(section);
  }, []);

  // Generate AI suggestions
  const generateAISuggestions = async (section: string) => {
    try {
      const context = {
        currentSection: section,
        currentEnergy: state.currentEnergy,
        timeOfDay: new Date().getHours(),
        recentTasks: state.tasks.slice(-5),
        recentMoods: state.moods.slice(-3)
      };

      const suggestions = await aiIntegration.generateSuggestions(context);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
    }
  };

  // Handle natural language input
  const handleNaturalLanguageInput = async (input: string) => {
    try {
      const result = await aiIntegration.parseNaturalLanguage(input);
      if (result) {
        // Handle different types of parsed input
        switch (result.type) {
          case 'task':
            dispatch({
              type: ActionTypes.ADD_TASK,
              payload: {
                id: Date.now().toString(),
                content: result.content,
                priority: result.priority,
                energy: result.energy,
                tags: result.tags,
                dueDate: result.dueDate,
                estimatedDuration: result.duration,
                status: 'pending',
                createdAt: Date.now()
              }
            });
            showToast(`Task added: ${result.content}`, 'success');
            break;
            
          case 'mood':
            dispatch({
              type: ActionTypes.ADD_MOOD,
              payload: {
                id: Date.now().toString(),
                score: result.metadata.sentiment === 'positive' ? 8 : result.metadata.sentiment === 'negative' ? 3 : 5,
                description: result.content,
                timestamp: Date.now()
              }
            });
            showToast('Mood logged successfully', 'success');
            break;
            
          case 'goal':
            dispatch({
              type: ActionTypes.ADD_GOAL,
              payload: {
                id: Date.now().toString(),
                title: result.content,
                description: result.content,
                targetDate: result.dueDate,
                status: 'active',
                progress: 0,
                createdAt: Date.now()
              }
            });
            showToast(`Goal created: ${result.content}`, 'success');
            break;
            
          default:
            showToast(`Processed: ${result.content}`, 'info');
        }
      }
    } catch (error) {
      console.error('Failed to process natural language input:', error);
      showToast('Failed to process input', 'error');
    }
  };

  // Handle AI suggestion action
  const handleAISuggestion = useCallback((suggestion: AISuggestion) => {
    if (suggestion.action) {
      suggestion.action();
    }
    
    // Remove the suggestion
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    showToast(`Applied: ${suggestion.title}`, 'success');
  }, [showToast]);

  // Auto-save data
  useEffect(() => {
    const autoSave = async () => {
      if (isInitialized) {
        try {
          // Save to local storage
          await storage.set('tasks', state.tasks);
          await storage.set('focusSessions', state.focusSessions);
          await storage.set('moods', state.moods);
          await storage.set('goals', state.goals);
          await storage.set('sensoryCheckins', state.sensoryCheckins);
          await storage.set('socialEntries', state.socialEntries);
          await storage.set('distractions', state.distractions);
          await storage.set('achievements', state.achievements);
          await storage.set('challenges', state.challenges);
          await storage.set('priorityMatrices', state.priorityMatrices);
          await storage.set('reminders', state.reminders);
          await storage.set('integrations', state.integrations);
          
          // Sync to cloud
          await cloudSync.sync();
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    };

    const interval = setInterval(autoSave, 30000); // Auto-save every 30 seconds
    return () => clearInterval(interval);
  }, [state, isInitialized]);

  // Periodic AI analysis
  useEffect(() => {
    const performAIAnalysis = async () => {
      if (isInitialized) {
        try {
          // Generate predictive insights
          const insights = await aiIntegration.generatePredictiveInsights();
          
          // Store insights
          await storage.set('predictiveInsights', insights);
          
          // Show important insights as notifications
          const highConfidenceInsights = insights.filter(insight => insight.confidence > 0.8);
          if (highConfidenceInsights.length > 0) {
            const insight = highConfidenceInsights[0];
            await notificationManager.sendNotification({
              title: 'AI Insight',
              body: insight.prediction,
              tag: 'ai-insight',
              data: insight
            });
          }
        } catch (error) {
          console.error('AI analysis failed:', error);
        }
      }
    };

    const interval = setInterval(performAIAnalysis, 300000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [isInitialized]);

  // Render section content
  const renderSectionContent = () => {
    switch (currentSection) {
      case 'overview':
        return (
          <div style={{ padding: '20px' }}>
            <h2>Welcome to NudgeMe! 🎯</h2>
            <p>Your ADHD-friendly productivity companion</p>
            
            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h3>AI Suggestions</h3>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: 10 }}>
                  {aiSuggestions.slice(0, 3).map(suggestion => (
                    <div
                      key={suggestion.id}
                      style={{
                        background: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: 8,
                        padding: 12,
                        minWidth: 200,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleAISuggestion(suggestion)}
                    >
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9em' }}>{suggestion.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.8em', color: '#666' }}>{suggestion.description}</p>
                      <div style={{ marginTop: 8, fontSize: '0.7em', color: '#007acc' }}>
                        Confidence: {Math.round(suggestion.confidence * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quick Stats */}
            <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 15 }}>
              <div style={{ background: '#e3f2fd', padding: 15, borderRadius: 8, textAlign: 'center' }}>
                <h3 style={{ margin: 0, color: '#1976d2' }}>{state.tasks.filter(t => t.status === 'pending').length}</h3>
                <p style={{ margin: 0, fontSize: '0.8em' }}>Pending Tasks</p>
              </div>
              <div style={{ background: '#f3e5f5', padding: 15, borderRadius: 8, textAlign: 'center' }}>
                <h3 style={{ margin: 0, color: '#7b1fa2' }}>{state.focusSessions.length}</h3>
                <p style={{ margin: 0, fontSize: '0.8em' }}>Focus Sessions</p>
              </div>
              <div style={{ background: '#e8f5e8', padding: 15, borderRadius: 8, textAlign: 'center' }}>
                <h3 style={{ margin: 0, color: '#388e3c' }}>{state.goals.filter(g => g.status === 'active').length}</h3>
                <p style={{ margin: 0, fontSize: '0.8em' }}>Active Goals</p>
              </div>
            </div>
          </div>
        );
        
      case 'focus':
        return <FocusTimer />;
        
      case 'wellness':
        return (
          <div style={{ padding: '20px' }}>
            <MoodAnalysis />
            <SensoryTools />
          </div>
        );
        
      case 'planning':
        return (
          <div style={{ padding: '20px' }}>
            <PriorityMatrix />
            <ProjectManager />
            <SmartTaskSystem />
          </div>
        );
        
      case 'motivation':
        return (
          <div style={{ padding: '20px' }}>
            <GoalTracker />
            <SocialTracker />
          </div>
        );
        
      case 'automation':
        return (
          <div style={{ padding: '20px' }}>
            <SystemIntegration />
            <DistractionManager />
            <PatternRecognition />
          </div>
        );
        
      default:
        return <div>Section not found</div>;
    }
  };

  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2em', marginBottom: 20 }}>🧠</div>
          <h2>Loading NudgeMe...</h2>
          <p>Initializing your productivity companion</p>
        </div>
      </div>
    );
  }

  return (
    <MobileOptimizedLayout
      theme={state.theme}
      themes={state.themes}
      onNavigate={handleNavigate}
      currentSection={currentSection}
      showToast={showToast}
    >
      {renderSectionContent()}
      
      {/* Toast notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
        />
      ))}
    </MobileOptimizedLayout>
  );
};

// Main App Component
const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const user = authManager.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  // Handle user login
  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  // Show login screen if not authenticated
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const [theme, setTheme] = useState('default');
  const themes = {
    default: {
      primary: '#1976d2',
      secondary: '#dc004e',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#000000',
      error: '#f44336',
      success: '#4caf50',
      warning: '#ff9800'
    },
    dark: {
      primary: '#90caf9',
      secondary: '#f48fb1',
      background: '#121212',
      surface: '#1e1e1e',
      text: '#ffffff',
      error: '#f44336',
      success: '#4caf50',
      warning: '#ff9800'
    },
    highContrast: {
      primary: '#ffff00',
      secondary: '#00ffff',
      background: '#000000',
      surface: '#000000',
      text: '#ffffff',
      error: '#ff0000',
      success: '#00ff00',
      warning: '#ffff00'
    }
  };

  return (
    <GlobalStateProvider>
      <AccessibilityProvider theme={theme} themes={themes}>
        <AppContent currentUser={currentUser} onLogout={() => setCurrentUser(null)} />
      </AccessibilityProvider>
    </GlobalStateProvider>
  );
};

export default App;
