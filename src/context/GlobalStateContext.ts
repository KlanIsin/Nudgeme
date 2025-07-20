import { createContext } from 'react';
import type { Dispatch } from 'react';
import type { 
  SmartTask, 
  Project, 
  FocusSession, 
  Distraction, 
  MoodEntry, 
  SocialEntry, 
  SensoryCheckin, 
  Pattern, 
  Goal, 
  RabbitHoleSession,
  PriorityMatrix,
  PriorityMatrixItem,
  Reminder,
  ReminderSettings,
  ExternalIntegration,
  IntegrationData,
  Achievement,
  AchievementProgress,
  Challenge,
  ChallengeProgress
} from '../types';

// Define the shape of our global state
export interface AppState {
  // Core Features
  tasks: SmartTask[];
  projects: Project[];
  focusSessions: FocusSession[];
  distractions: Distraction[];
  moods: MoodEntry[];
  socialEntries: SocialEntry[];
  sensoryCheckins: SensoryCheckin[];
  patterns: Pattern[];
  goals: Goal[];
  rabbitHoleSessions: RabbitHoleSession[];
  
  // New Features
  priorityMatrices: PriorityMatrix[];
  priorityMatrixItems: PriorityMatrixItem[];
  reminders: Reminder[];
  reminderSettings: ReminderSettings;
  externalIntegrations: ExternalIntegration[];
  integrationData: IntegrationData[];
  achievements: Achievement[];
  achievementProgress: AchievementProgress[];
  challenges: Challenge[];
  challengeProgress: ChallengeProgress[];
  
  // Integration & Analytics
  crossFeatureInsights: {
    energyPatterns: {
      peakHours: number[];
      lowEnergyTriggers: string[];
      energyTaskCorrelation: Record<string, number>;
    };
    productivityInsights: {
      bestTaskTypes: string[];
      optimalSessionLength: number;
      distractionPatterns: string[];
      moodProductivityCorrelation: Record<string, number>;
    };
    sensoryOptimization: {
      optimalEnvironments: string[];
      sensoryTriggers: string[];
      focusEnhancers: string[];
    };
    socialProductivity: {
      collaborativeTasks: string[];
      soloTasks: string[];
      socialEnergyImpact: Record<string, number>;
    };
  };
  
  // System Integration State
  integrationState: {
    lastSync: number;
    syncStatus: 'idle' | 'syncing' | 'error';
    crossFeatureRecommendations: string[];
    automatedActions: Array<{
      id: string;
      type: string;
      description: string;
      timestamp: number;
      executed: boolean;
    }>;
  };
  
  // ... other global state properties
}

// Define the shape of the context value
export interface AppContextProps {
  state: AppState;
  dispatch: Dispatch<any>; // Using 'any' for now, will be replaced with specific action types
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export default AppContext; 