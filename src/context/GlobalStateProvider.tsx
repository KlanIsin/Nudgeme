import React, { useReducer, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import AppContext from './GlobalStateContext';
import type { AppState } from './GlobalStateContext';
import useLocalStorage from '../hooks/useLocalStorage';
import { DEFAULT_PROJECTS, DEFAULT_TASK_TEMPLATES } from '../constants';
import type { 
  SmartTask, 
  PriorityMatrix, 
  PriorityMatrixItem, 
  Reminder, 
  ReminderSettings,
  ExternalIntegration,
  IntegrationData,
  Achievement,
  AchievementProgress,
  Challenge,
  ChallengeProgress,
  FocusSession,
  MoodEntry,
  SensoryCheckin,
  SocialEntry,
  Distraction
} from '../types';

// Action Types
export const ActionTypes = {
  // Core Features
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  ADD_PROJECT: 'ADD_PROJECT',
  UPDATE_PROJECT: 'UPDATE_PROJECT',
  DELETE_PROJECT: 'DELETE_PROJECT',
  ADD_FOCUS_SESSION: 'ADD_FOCUS_SESSION',
  UPDATE_FOCUS_SESSION: 'UPDATE_FOCUS_SESSION',
  ADD_DISTRACTION: 'ADD_DISTRACTION',
  UPDATE_DISTRACTION: 'UPDATE_DISTRACTION',
  ADD_MOOD_ENTRY: 'ADD_MOOD_ENTRY',
  ADD_SOCIAL_ENTRY: 'ADD_SOCIAL_ENTRY',
  ADD_SENSORY_CHECKIN: 'ADD_SENSORY_CHECKIN',
  ADD_RABBIT_HOLE_SESSION: 'ADD_RABBIT_HOLE_SESSION',
  
  // New Features
  ADD_PRIORITY_MATRIX: 'ADD_PRIORITY_MATRIX',
  UPDATE_PRIORITY_MATRIX: 'UPDATE_PRIORITY_MATRIX',
  DELETE_PRIORITY_MATRIX: 'DELETE_PRIORITY_MATRIX',
  ADD_PRIORITY_MATRIX_ITEM: 'ADD_PRIORITY_MATRIX_ITEM',
  UPDATE_PRIORITY_MATRIX_ITEM: 'UPDATE_PRIORITY_MATRIX_ITEM',
  DELETE_PRIORITY_MATRIX_ITEM: 'DELETE_PRIORITY_MATRIX_ITEM',
  
  ADD_REMINDER: 'ADD_REMINDER',
  UPDATE_REMINDER: 'UPDATE_REMINDER',
  DELETE_REMINDER: 'DELETE_REMINDER',
  UPDATE_REMINDER_SETTINGS: 'UPDATE_REMINDER_SETTINGS',
  
  ADD_EXTERNAL_INTEGRATION: 'ADD_EXTERNAL_INTEGRATION',
  UPDATE_EXTERNAL_INTEGRATION: 'UPDATE_EXTERNAL_INTEGRATION',
  DELETE_EXTERNAL_INTEGRATION: 'DELETE_EXTERNAL_INTEGRATION',
  ADD_INTEGRATION_DATA: 'ADD_INTEGRATION_DATA',
  
  ADD_ACHIEVEMENT: 'ADD_ACHIEVEMENT',
  UPDATE_ACHIEVEMENT: 'UPDATE_ACHIEVEMENT',
  ADD_ACHIEVEMENT_PROGRESS: 'ADD_ACHIEVEMENT_PROGRESS',
  UPDATE_ACHIEVEMENT_PROGRESS: 'UPDATE_ACHIEVEMENT_PROGRESS',
  
  ADD_CHALLENGE: 'ADD_CHALLENGE',
  UPDATE_CHALLENGE: 'UPDATE_CHALLENGE',
  DELETE_CHALLENGE: 'DELETE_CHALLENGE',
  ADD_CHALLENGE_PROGRESS: 'ADD_CHALLENGE_PROGRESS',
  UPDATE_CHALLENGE_PROGRESS: 'UPDATE_CHALLENGE_PROGRESS',
  
  // Integration Actions
  UPDATE_CROSS_FEATURE_INSIGHTS: 'UPDATE_CROSS_FEATURE_INSIGHTS',
  ADD_AUTOMATED_ACTION: 'ADD_AUTOMATED_ACTION',
  EXECUTE_AUTOMATED_ACTION: 'EXECUTE_AUTOMATED_ACTION',
  UPDATE_INTEGRATION_STATE: 'UPDATE_INTEGRATION_STATE',
};

// Default reminder settings
const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  gentleEscalation: true,
  energyMatching: true,
  locationAware: true,
  quietHours: { start: 22, end: 8 },
  defaultPriority: 'medium',
  autoSnooze: false,
  snoozeDuration: 15,
};

// Default cross-feature insights
const DEFAULT_CROSS_FEATURE_INSIGHTS = {
  energyPatterns: {
    peakHours: [9, 10, 11, 14, 15, 16],
    lowEnergyTriggers: ['after lunch', 'late afternoon', 'stress'],
    energyTaskCorrelation: {},
  },
  productivityInsights: {
    bestTaskTypes: ['focus', 'creative', 'analytical'],
    optimalSessionLength: 25,
    distractionPatterns: ['social media', 'email', 'noise'],
    moodProductivityCorrelation: {},
  },
  sensoryOptimization: {
    optimalEnvironments: ['quiet', 'natural light', 'comfortable'],
    sensoryTriggers: ['bright lights', 'loud noises', 'crowds'],
    focusEnhancers: ['white noise', 'fidget tools', 'movement breaks'],
  },
  socialProductivity: {
    collaborativeTasks: ['brainstorming', 'planning', 'review'],
    soloTasks: ['deep work', 'writing', 'analysis'],
    socialEnergyImpact: {},
  },
};

// Default integration state
const DEFAULT_INTEGRATION_STATE = {
  lastSync: Date.now(),
  syncStatus: 'idle' as const,
  crossFeatureRecommendations: [],
  automatedActions: [],
};

const initialState: AppState = {
  // Core Features
  tasks: [],
  projects: DEFAULT_PROJECTS,
  focusSessions: [],
  distractions: [],
  moods: [],
  socialEntries: [],
  sensoryCheckins: [],
  patterns: [],
  goals: [],
  rabbitHoleSessions: [],
  taskTemplates: DEFAULT_TASK_TEMPLATES,
  
  // New Features
  priorityMatrices: [],
  priorityMatrixItems: [],
  reminders: [],
  reminderSettings: DEFAULT_REMINDER_SETTINGS,
  externalIntegrations: [],
  integrationData: [],
  achievements: [],
  achievementProgress: [],
  challenges: [],
  challengeProgress: [],
  
  // Integration & Analytics
  crossFeatureInsights: DEFAULT_CROSS_FEATURE_INSIGHTS,
  integrationState: DEFAULT_INTEGRATION_STATE,
};

// Intelligent cross-feature analysis functions
const analyzeEnergyPatterns = (focusSessions: FocusSession[], moods: MoodEntry[], sensoryCheckins: SensoryCheckin[]) => {
  const energyData = focusSessions.map(session => ({
    hour: new Date(session.startTime).getHours(),
    energy: session.focusScore,
    timestamp: session.startTime,
  }));

  const hourlyEnergy = Array(24).fill(0).map((_, hour) => {
    const sessionsInHour = energyData.filter(d => d.hour === hour);
    return sessionsInHour.length > 0 
      ? sessionsInHour.reduce((sum, d) => sum + d.energy, 0) / sessionsInHour.length 
      : 0;
  });

  const peakHours = hourlyEnergy
    .map((energy, hour) => ({ energy, hour }))
    .sort((a, b) => b.energy - a.energy)
    .slice(0, 6)
    .map(h => h.hour);

  return { peakHours, hourlyEnergy };
};

const analyzeProductivityInsights = (focusSessions: FocusSession[], distractions: Distraction[], moods: MoodEntry[]) => {
  const completedSessions = focusSessions.filter(s => s.completed);
  const optimalLength = completedSessions.length > 0 
    ? Math.round(completedSessions.reduce((sum, s) => sum + s.duration, 0) / completedSessions.length)
    : 25;

  const distractionPatterns = distractions
    .map(d => d.trigger)
    .reduce((acc, trigger) => {
      acc[trigger] = (acc[trigger] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const moodProductivity = moods.map(mood => ({
    mood: mood.primary,
    productivity: mood.symptoms.focus,
  }));

  return { optimalLength, distractionPatterns, moodProductivity };
};

const analyzeSensoryOptimization = (sensoryCheckins: SensoryCheckin[], focusSessions: FocusSession[]) => {
  const optimalEnvironments = sensoryCheckins
    .filter(s => s.effectiveness >= 7)
    .map(s => s.environment)
    .filter((env, index, arr) => arr.indexOf(env) === index);

  const sensoryTriggers = sensoryCheckins
    .filter(s => s.overloadWarning)
    .flatMap(s => s.triggers)
    .filter((trigger, index, arr) => arr.indexOf(trigger) === index);

  return { optimalEnvironments, sensoryTriggers };
};

const analyzeSocialProductivity = (socialEntries: SocialEntry[], focusSessions: FocusSession[]) => {
  const collaborativeTasks = socialEntries
    .filter(s => s.success >= 7)
    .map(s => s.type)
    .filter((type, index, arr) => arr.indexOf(type) === index);

  const socialEnergyImpact = socialEntries.reduce((acc, entry) => {
    acc[entry.type] = entry.energy;
    return acc;
  }, {} as Record<string, number>);

  return { collaborativeTasks, socialEnergyImpact };
};

// Generate cross-feature recommendations
const generateRecommendations = (state: AppState): string[] => {
  const recommendations: string[] = [];
  
  // Energy-based recommendations
  const { peakHours } = analyzeEnergyPatterns(state.focusSessions, state.moods, state.sensoryCheckins);
  if (peakHours.length > 0) {
    const currentHour = new Date().getHours();
    if (peakHours.includes(currentHour)) {
      recommendations.push("You're in a peak energy hour! Consider tackling high-priority tasks now.");
    }
  }

  // Task-energy correlation
  const highEnergyTasks = state.tasks.filter(t => t.energy >= 4);
  if (highEnergyTasks.length > 0) {
    recommendations.push(`You have ${highEnergyTasks.length} high-energy tasks. Schedule them during your peak hours.`);
  }

  // Sensory optimization
  const recentSensoryCheckins = state.sensoryCheckins
    .filter(s => Date.now() - s.timestamp < 24 * 60 * 60 * 1000);
  if (recentSensoryCheckins.some(s => s.overloadWarning)) {
    recommendations.push("Recent sensory overload detected. Consider using your sensory regulation tools.");
  }

  // Priority matrix insights
  const highPriorityItems = state.priorityMatrixItems.filter(item => 
    item.priority.toLowerCase().includes('high') || item.priority.toLowerCase().includes('critical')
  );
  if (highPriorityItems.length > 0) {
    recommendations.push(`You have ${highPriorityItems.length} high-priority items in your matrix. Review them soon.`);
  }

  return recommendations;
};

// The main application reducer
const appReducer = (state: AppState, action: { type: string; payload: any }): AppState => {
  let newState: AppState;

  switch (action.type) {
    // Core Features
    case ActionTypes.ADD_TASK:
      newState = {
        ...state,
        tasks: [...state.tasks, action.payload],
      };
      break;
    case ActionTypes.UPDATE_TASK:
      newState = {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? { ...task, ...action.payload.updates } : task
        ),
      };
      break;
    case ActionTypes.DELETE_TASK:
      newState = {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload.id),
      };
      break;
    case ActionTypes.ADD_PROJECT:
      newState = {
        ...state,
        projects: [...state.projects, action.payload],
      };
      break;
    case ActionTypes.UPDATE_PROJECT:
      newState = {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        ),
      };
      break;
    case ActionTypes.DELETE_PROJECT:
      newState = {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload.id),
      };
      break;
    case ActionTypes.ADD_FOCUS_SESSION:
      newState = {
        ...state,
        focusSessions: [action.payload, ...state.focusSessions],
      };
      break;
    case ActionTypes.UPDATE_FOCUS_SESSION:
      newState = {
        ...state,
        focusSessions: state.focusSessions.map(session =>
          session.id === action.payload.id ? { ...session, ...action.payload.updates } : session
        ),
      };
      break;
    case ActionTypes.ADD_DISTRACTION:
      newState = {
        ...state,
        distractions: [action.payload, ...state.distractions],
      };
      break;
    case ActionTypes.UPDATE_DISTRACTION:
      newState = {
        ...state,
        distractions: state.distractions.map(d =>
          d.id === action.payload.id ? { ...d, ...action.payload.updates } : d
        ),
      };
      break;
    case ActionTypes.ADD_MOOD_ENTRY:
      newState = {
        ...state,
        moods: [action.payload, ...state.moods],
      };
      break;
    case ActionTypes.ADD_SOCIAL_ENTRY:
      newState = {
        ...state,
        socialEntries: [action.payload, ...state.socialEntries],
      };
      break;
    case ActionTypes.ADD_SENSORY_CHECKIN:
      newState = {
        ...state,
        sensoryCheckins: [action.payload, ...state.sensoryCheckins],
      };
      break;
    case ActionTypes.ADD_RABBIT_HOLE_SESSION:
      newState = {
        ...state,
        rabbitHoleSessions: [action.payload, ...state.rabbitHoleSessions],
      };
      break;

    // Priority Matrix
    case ActionTypes.ADD_PRIORITY_MATRIX:
      newState = {
        ...state,
        priorityMatrices: [action.payload, ...state.priorityMatrices],
      };
      break;
    case ActionTypes.UPDATE_PRIORITY_MATRIX:
      newState = {
        ...state,
        priorityMatrices: state.priorityMatrices.map(m =>
          m.id === action.payload.id ? { ...m, ...action.payload.updates } : m
        ),
      };
      break;
    case ActionTypes.DELETE_PRIORITY_MATRIX:
      newState = {
        ...state,
        priorityMatrices: state.priorityMatrices.filter(m => m.id !== action.payload.id),
        priorityMatrixItems: state.priorityMatrixItems.filter(item => item.matrixId !== action.payload.id),
      };
      break;
    case ActionTypes.ADD_PRIORITY_MATRIX_ITEM:
      newState = {
        ...state,
        priorityMatrixItems: [action.payload, ...state.priorityMatrixItems],
      };
      break;
    case ActionTypes.UPDATE_PRIORITY_MATRIX_ITEM:
      newState = {
        ...state,
        priorityMatrixItems: state.priorityMatrixItems.map(item =>
          item.id === action.payload.id ? { ...item, ...action.payload.updates } : item
        ),
      };
      break;
    case ActionTypes.DELETE_PRIORITY_MATRIX_ITEM:
      newState = {
        ...state,
        priorityMatrixItems: state.priorityMatrixItems.filter(item => item.id !== action.payload.id),
      };
      break;

    // Reminders
    case ActionTypes.ADD_REMINDER:
      newState = {
        ...state,
        reminders: [action.payload, ...state.reminders],
      };
      break;
    case ActionTypes.UPDATE_REMINDER:
      newState = {
        ...state,
        reminders: state.reminders.map(r =>
          r.id === action.payload.id ? { ...r, ...action.payload.updates } : r
        ),
      };
      break;
    case ActionTypes.DELETE_REMINDER:
      newState = {
        ...state,
        reminders: state.reminders.filter(r => r.id !== action.payload.id),
      };
      break;
    case ActionTypes.UPDATE_REMINDER_SETTINGS:
      newState = {
        ...state,
        reminderSettings: { ...state.reminderSettings, ...action.payload },
      };
      break;

    // External Integrations
    case ActionTypes.ADD_EXTERNAL_INTEGRATION:
      newState = {
        ...state,
        externalIntegrations: [action.payload, ...state.externalIntegrations],
      };
      break;
    case ActionTypes.UPDATE_EXTERNAL_INTEGRATION:
      newState = {
        ...state,
        externalIntegrations: state.externalIntegrations.map(i =>
          i.id === action.payload.id ? { ...i, ...action.payload.updates } : i
        ),
      };
      break;
    case ActionTypes.DELETE_EXTERNAL_INTEGRATION:
      newState = {
        ...state,
        externalIntegrations: state.externalIntegrations.filter(i => i.id !== action.payload.id),
      };
      break;
    case ActionTypes.ADD_INTEGRATION_DATA:
      newState = {
        ...state,
        integrationData: [action.payload, ...state.integrationData],
      };
      break;

    // Achievements
    case ActionTypes.ADD_ACHIEVEMENT:
      newState = {
        ...state,
        achievements: [action.payload, ...state.achievements],
      };
      break;
    case ActionTypes.UPDATE_ACHIEVEMENT:
      newState = {
        ...state,
        achievements: state.achievements.map(a =>
          a.id === action.payload.id ? { ...a, ...action.payload.updates } : a
        ),
      };
      break;
    case ActionTypes.ADD_ACHIEVEMENT_PROGRESS:
      newState = {
        ...state,
        achievementProgress: [action.payload, ...state.achievementProgress],
      };
      break;
    case ActionTypes.UPDATE_ACHIEVEMENT_PROGRESS:
      newState = {
        ...state,
        achievementProgress: state.achievementProgress.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        ),
      };
      break;

    // Challenges
    case ActionTypes.ADD_CHALLENGE:
      newState = {
        ...state,
        challenges: [action.payload, ...state.challenges],
      };
      break;
    case ActionTypes.UPDATE_CHALLENGE:
      newState = {
        ...state,
        challenges: state.challenges.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
        ),
      };
      break;
    case ActionTypes.DELETE_CHALLENGE:
      newState = {
        ...state,
        challenges: state.challenges.filter(c => c.id !== action.payload.id),
      };
      break;
    case ActionTypes.ADD_CHALLENGE_PROGRESS:
      newState = {
        ...state,
        challengeProgress: [action.payload, ...state.challengeProgress],
      };
      break;
    case ActionTypes.UPDATE_CHALLENGE_PROGRESS:
      newState = {
        ...state,
        challengeProgress: state.challengeProgress.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        ),
      };
      break;

    // Integration Actions
    case ActionTypes.UPDATE_CROSS_FEATURE_INSIGHTS:
      newState = {
        ...state,
        crossFeatureInsights: { ...state.crossFeatureInsights, ...action.payload },
      };
      break;
    case ActionTypes.ADD_AUTOMATED_ACTION:
      newState = {
        ...state,
        integrationState: {
          ...state.integrationState,
          automatedActions: [action.payload, ...state.integrationState.automatedActions],
        },
      };
      break;
    case ActionTypes.EXECUTE_AUTOMATED_ACTION:
      newState = {
        ...state,
        integrationState: {
          ...state.integrationState,
          automatedActions: state.integrationState.automatedActions.map(action =>
            action.id === action.payload.id ? { ...action, executed: true } : action
          ),
        },
      };
      break;
    case ActionTypes.UPDATE_INTEGRATION_STATE:
      newState = {
        ...state,
        integrationState: { ...state.integrationState, ...action.payload },
      };
      break;

    default:
      return state;
  }

  // Update cross-feature insights after any relevant action
  const updatedInsights = {
    energyPatterns: analyzeEnergyPatterns(newState.focusSessions, newState.moods, newState.sensoryCheckins),
    productivityInsights: analyzeProductivityInsights(newState.focusSessions, newState.distractions, newState.moods),
    sensoryOptimization: analyzeSensoryOptimization(newState.sensoryCheckins, newState.focusSessions),
    socialProductivity: analyzeSocialProductivity(newState.socialEntries, newState.focusSessions),
  };

  const recommendations = generateRecommendations(newState);

  return {
    ...newState,
    crossFeatureInsights: { ...newState.crossFeatureInsights, ...updatedInsights },
    integrationState: {
      ...newState.integrationState,
      crossFeatureRecommendations: recommendations,
      lastSync: Date.now(),
    },
  };
};

export const GlobalStateProvider = ({ children }: { children: ReactNode }) => {
  const [storedState, setStoredState] = useLocalStorage('appState', initialState);
  const [state, dispatch] = useReducer(appReducer, storedState);

  useEffect(() => {
    setStoredState(state);
  }, [state, setStoredState]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}; 