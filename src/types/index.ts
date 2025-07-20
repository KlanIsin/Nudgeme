// types/index.ts

// ===== ENHANCED TYPE DEFINITIONS =====

// 1.1 Smart Task System
export type TaskPriority = 'urgent' | 'important' | 'someday' | 'backlog';
export type TaskType = 'task' | 'note' | 'idea' | 'reminder';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'abandoned';

export type SmartTask = {
  id: string;
  content: string;
  type: 'task' | 'note' | 'idea' | 'reminder';
  priority: 'urgent' | 'important' | 'someday' | 'backlog';
  energy: 1 | 2 | 3 | 4 | 5;
  timeEstimate: number; // Minutes
  context: string[];
  tags: string[];
  dueDate?: Date;
  recurring?: 'daily' | 'weekly' | 'monthly';
  subtasks: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'abandoned';
  createdAt: number;
  completedAt?: number;
  timeSpent?: number;
};

// 1.2 Project Context Manager
export type Project = {
  id: string;
  name: string;
  description: string;
  currentTask: string;
  nextSteps: string[];
  resources: string[]; // URLs, notes, etc.
  lastWorked: number;
  timeSpent: number;
  status: 'active' | 'paused' | 'completed';
};

// 2.1 Advanced Focus Timer
export type FocusMode = 'pomodoro' | 'flow' | 'sprint' | 'recovery' | 'body-double';

export type FocusSession = {
  id: string;
  mode: FocusMode;
  duration: number;
  task: string;
  interruptions: number;
  focusScore: number; // Self-rated 1-10
  notes: string;
  completed: boolean;
  startTime: number;
  endTime?: number;
  actualDuration?: number;
};

// 2.2 Distraction Management
export type DistractionType = 'internal' | 'external' | 'digital' | 'environmental';

export type Distraction = {
  id: string;
  type: DistractionType;
  trigger: string;
  severity: 1 | 2 | 3 | 4 | 5;
  handled: boolean;
  strategy: string;
  timestamp: number;
  duration: number; // in seconds
  impact: number; // 1-10
  notes: string;
};

// 3.1 Comprehensive Mood Analysis
export type PrimaryMood = 'happy' | 'sad' | 'anxious' | 'excited' | 'calm' | 'frustrated' | 'neutral' | 'overwhelmed' | 'focused' | 'scattered';

export type MoodEntry = {
  id: string;
  timestamp: number;
  primary: PrimaryMood;
  intensity: 1 | 2 | 3 | 4 | 5;
  factors: {
    sleep: number;
    social: number;
    work: number;
    physical: number;
    environmental: number;
    medication: number;
    food: number;
  };
  symptoms: {
    focus: number;
    motivation: number;
    anxiety: number;
    impulsivity: number;
    restlessness: number;
    executiveFunction: number;
    emotionalRegulation: number;
  };
  triggers: string[];
  coping: string[];
  notes: string;
  location: string;
  activity: string;
};

// 4.1 Conversation & Social Tracking
export type SocialType = 'conversation' | 'meeting' | 'social_event' | 'conflict' | 'presentation' | 'interview';

export type SocialEntry = {
  id: string;
  timestamp: number;
  type: SocialType;
  participants: string[];
  duration: number; // in minutes
  success: number; // 1-10
  challenges: string[];
  strategies: string[];
  followUp: string[];
  notes: string;
  energy: number; // 1-10
  anxiety: number; // 1-10
  preparation: number; // 1-10
  location: string;
  context: string;
};

// 5.1 Sensory Regulation Tools
export type SensoryType = 'visual' | 'auditory' | 'tactile' | 'olfactory' | 'gustatory' | 'proprioceptive' | 'vestibular';

export type SensoryProfile = {
  [key in SensoryType]: {
    sensitivity: number; // 1-10
    preferences: string[];
    triggers: string[];
    strategies: string[];
  };
};

export type SensoryCheckin = {
  id: string;
  timestamp: number;
  sensoryType: SensoryType;
  level: number; // 1 (understimulated) - 10 (overstimulated)
  triggers: string[];
  strategies: string[];
  effectiveness: number; // 1-10
  notes: string;
  environment: string;
  overloadWarning: boolean;
};

// 6.1 Personal Pattern Recognition
export type PatternType = 'daily' | 'weekly' | 'monthly' | 'triggered' | 'seasonal' | 'circadian';

export type Pattern = {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'mood' | 'sensory' | 'social' | 'focus';
  triggers: string[];
  behaviors: string[];
  outcomes: string[];
  frequency: number; // How often this pattern occurs
  confidence: number; // 1-10, how confident we are in this pattern
  lastObserved: number;
  insights: string;
  recommendations: string[];
  isActive: boolean;
};

// 6.2 Progress & Goal Tracking
export type GoalType = 'habit' | 'project' | 'skill' | 'lifestyle' | 'health' | 'social' | 'professional';

export type Milestone = {
  id: string;
  name: string;
  targetValue: number;
  achieved: boolean;
  achievedAt?: number;
};

export type Goal = {
  id: string;
  name: string;
  description: string;
  category: 'personal' | 'work' | 'health' | 'learning' | 'creative';
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: number;
  milestones: Milestone[];
  obstacles: string[];
  strategies: string[];
  isActive: boolean;
  createdAt: number;
};

export type GoalProgress = {
  id: string;
  goalId: string;
  value: number;
  notes: string;
  timestamp: number;
  mood: string;
  energy: number; // 1-10
};

// 7.1 Rabbit Hole Session
export type RabbitHoleSession = {
  id: string;
  topic: string;
  context: string;
  startTime: number;
  endTime: number;
  summary: string;
  findings: string[];
  insights: string[];
  tangents: string[];
  reflection: string;
  linkedProject: string;
  linkedTask: string;
  linkedGoal: string;
};

export type Reminder = {
  id: string;
  title: string;
  description: string;
  dueDate: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'task' | 'medication' | 'appointment' | 'habit' | 'custom';
  energyLevel: number; // 1-10, required energy level
  location: string;
  context: string[]; // e.g., ['work', 'morning', 'focus']
  escalation: boolean;
  escalationSteps: string[];
  isActive: boolean;
  createdAt: number;
  completedAt?: number;
  snoozedUntil?: number;
};

export type ReminderSettings = {
  gentleEscalation: boolean;
  energyMatching: boolean;
  locationAware: boolean;
  quietHours: {
    start: number; // hour in 24h format
    end: number;
  };
  defaultPriority: 'low' | 'medium' | 'high' | 'urgent';
  autoSnooze: boolean;
  snoozeDuration: number; // minutes
};

export type ExternalIntegration = {
  id: string;
  name: string;
  type: 'calendar' | 'email' | 'notes' | 'fitness' | 'weather' | 'todo' | 'habit';
  apiKey: string;
  isConnected: boolean;
  lastSync: number;
  settings: Record<string, any>;
  syncFrequency: number; // minutes
};

export type IntegrationData = {
  id: string;
  integrationId: string;
  data: Record<string, any>;
  timestamp: number;
  type: 'event' | 'task' | 'metric' | 'note';
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  category: 'streak' | 'milestone' | 'pattern' | 'social' | 'focus' | 'habit';
  icon: string;
  criteria: Record<string, any>;
  points: number;
  isUnlocked: boolean;
  unlockedAt?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
};

export type AchievementProgress = {
  id: string;
  achievementId: string;
  currentValue: number;
  targetValue: number;
  lastUpdated: number;
};

export type Challenge = {
  id: string;
  name: string;
  description: string;
  category: 'focus' | 'habit' | 'social' | 'learning' | 'creative' | 'health';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  duration: number; // days
  startDate: number;
  endDate: number;
  rewards: string[];
  supportSystem: string[];
  isActive: boolean;
  participants: string[];
  creator: string;
  createdAt: number;
};

export type ChallengeProgress = {
  id: string;
  challengeId: string;
  userId: string;
  currentValue: number;
  targetValue: number;
  lastUpdated: number;
  notes: string;
  mood: string;
  energy: number; // 1-10
};

export type PriorityMatrix = {
  id: string;
  name: string;
  description: string;
  impactLevels: string[]; // e.g., ['Extensive', 'Significant', 'Moderate', 'Minor']
  urgencyLevels: string[]; // e.g., ['Critical', 'High', 'Medium', 'Low', 'Lowest']
  priorityMapping: Record<string, Record<string, string>>; // impact -> urgency -> priority
  isActive: boolean;
  createdAt: number;
  lastUpdated: number;
};

export type PriorityMatrixItem = {
  id: string;
  matrixId: string;
  impact: string;
  urgency: string;
  priority: string;
  description: string;
  recommendations: string[];
  estimatedEffort: number; // 1-10
  estimatedImpact: number; // 1-10
  isCustom: boolean;
}; 