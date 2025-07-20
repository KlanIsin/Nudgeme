// types.ts
// All shared type definitions for the NudgeMe app

// 1.1 Smart Task System
type TaskPriority = 'urgent' | 'important' | 'someday' | 'backlog';
type TaskType = 'task' | 'note' | 'idea' | 'reminder';
type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'abandoned';

type SmartTask = {
  id: string;
  content: string;
  type: TaskType;
  priority: TaskPriority;
  energy: 1 | 2 | 3 | 4 | 5;
  energyEstimate: number; // Minutes
  context: string[];
  tags: string[];
  dueDate?: Date;
  recurring?: 'daily' | 'weekly' | 'monthly';
  subtasks: string[];
  status: TaskStatus;
  createdAt: number;
  completedAt?: number;
  timeSpent?: number;
  pinned: boolean;
  notes: string;
};

// 1.2 Project Context Manager
type ProjectStatus = 'active' | 'paused' | 'completed';
type Project = {
  id: string;
  name: string;
  description?: string;
  currentTask?: string;
  nextSteps?: string[];
  resources: string[];
  lastWorked?: number;
  timeSpent?: number;
  status: ProjectStatus;
  color: string;
  createdAt?: number;
  completedAt?: number;
  tags?: string[];
  progress?: number;
  icon?: string;
};

// 2.1 Advanced Focus Timer
type FocusMode = 'pomodoro' | 'flow' | 'sprint' | 'recovery' | 'body-double';

type FocusSession = {
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
type DistractionType = 'internal' | 'external' | 'digital' | 'environmental';

type Distraction = {
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
type PrimaryMood = 'happy' | 'sad' | 'anxious' | 'excited' | 'calm' | 'frustrated' | 'neutral' | 'overwhelmed' | 'focused' | 'scattered';

type MoodEntry = {
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
type SocialType = 'conversation' | 'meeting' | 'social_event' | 'conflict' | 'presentation' | 'interview';

type SocialEntry = {
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
type SensoryType = 'visual' | 'auditory' | 'tactile' | 'olfactory' | 'gustatory' | 'proprioceptive' | 'vestibular';

type SensoryProfile = {
  [key in SensoryType]: {
    sensitivity: number; // 1-10
    preferences: string[];
    triggers: string[];
    strategies: string[];
  };
};

type SensoryCheckin = {
  timestamp: number;
  sensoryType: SensoryType;
  level: number; // 1 (understimulated) - 10 (overstimulated)
  triggers: string[];
  strategies: string[];
  effectiveness: number; // 1-10
  notes: string;
};

// 6.1 Personal Pattern Recognition
type PatternType = 'daily' | 'weekly' | 'monthly' | 'triggered' | 'seasonal' | 'circadian';

type Pattern = {
  id: string;
  type: PatternType;
  description: string;
  confidence: number; // 0-100
  conditions: string[];
  outcomes: string[];
  frequency: number;
  duration: number;
  strength: number; // 1-10
  insights: string[];
  recommendations: string[];
  discoveredAt: number;
  lastUpdated: number;
  active: boolean;
};

// 6.2 Progress & Goal Tracking
type GoalType = 'habit' | 'project' | 'skill' | 'lifestyle' | 'health' | 'social' | 'professional';

type Goal = {
  id: string;
  title: string;
  description: string;
  type: GoalType;
  metrics: {
    target: number;
    current: number;
    unit: string;
  };
  milestones: {
    id: string;
    description: string;
    targetDate: number;
    completed: boolean;
  }[];
  startDate: number;
  targetDate: number;
  completedDate?: number;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
};

// (Add any additional types from both files here) 
export type { SmartTask, Project, FocusSession, Distraction, MoodEntry, SocialEntry, SensoryCheckin, Pattern, Goal, RabbitHoleSession }; 