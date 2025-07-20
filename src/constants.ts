import {
  IconWorld,
  IconBrandGoogle,
  IconBrandYoutube,
  IconBrandNotion,
  IconBrandGithub,
  IconBrandDiscord,
  IconExternalLink,
} from '@tabler/icons-react';

export type Theme = {
  name: string;
  background: string;
  primary: string;
  accent: string;
  text: string;
  button: string;
  buttonText: string;
  modalBg: string;
  modalText: string;
  modalAccent: string;
};

export type TaskTemplate = {
  id: string;
  name: string;
  description: string;
  type: 'task' | 'reminder' | 'note';
  priority: 'urgent' | 'important' | 'someday';
  energy: number;
  energyEstimate: number;
  context: string[];
  tags: string[];
  recurring: string | undefined;
  dueDate: string | undefined;
  subtasks: string[];
  notes: string;
  isDefault: boolean;
};

export const THEMES: { [key: string]: Theme } = {
  blue: {
    name: 'Calming Blue',
    background: '#eaf2ff',
    primary: '#4f8cff',
    accent: '#ffffff',
    text: '#222',
    button: '#4f8cff',
    buttonText: '#fff',
    modalBg: '#fff',
    modalText: '#222',
    modalAccent: '#4f8cff',
  },
  lime: {
    name: 'Lime Green & Black',
    background: '#111',
    primary: '#bfff00',
    accent: '#222',
    text: '#bfff00',
    button: '#bfff00',
    buttonText: '#111',
    modalBg: '#181818',
    modalText: '#bfff00',
    modalAccent: '#bfff00',
  },
  stormy: {
    name: 'Stormy Morning',
    background: 'linear-gradient(135deg, #bfc9d1 0%, #6b7a8f 100%)',
    primary: '#4a5a6a',
    accent: '#e3e8ee',
    text: '#263040',
    button: '#6b7a8f',
    buttonText: '#fff',
    modalBg: '#e3e8ee',
    modalText: '#263040',
    modalAccent: '#4a5a6a',
  },
  forest: {
    name: 'Lush Forest',
    background: 'linear-gradient(135deg, #2e4639 0%, #a3c9a8 100%)',
    primary: '#3b6d4a',
    accent: '#eafbe7',
    text: '#1b2e23',
    button: '#3b6d4a',
    buttonText: '#eafbe7',
    modalBg: '#eafbe7',
    modalText: '#1b2e23',
    modalAccent: '#3b6d4a',
  },
  lavender: {
    name: 'Lavender Lullaby',
    background: 'linear-gradient(135deg, #e6e6fa 0%, #b2f7ef 100%)',
    primary: '#b57edc',
    accent: '#f7faff',
    text: '#4b3b5c',
    button: '#b57edc',
    buttonText: '#fff',
    modalBg: '#f7faff',
    modalText: '#4b3b5c',
    modalAccent: '#b57edc',
  },
  pumpkin: {
    name: 'Pumpkin Spice',
    background: 'linear-gradient(135deg, #ffb570 0%, #a05a2c 100%)',
    primary: '#a05a2c',
    accent: '#fff6e6',
    text: '#4a2c1a',
    button: '#ff7f2a',
    buttonText: '#fff6e6',
    modalBg: '#fff6e6',
    modalText: '#4a2c1a',
    modalAccent: '#a05a2c',
  },
};

export const MOOD_OPTIONS = [
  { value: 'great', emoji: '😃', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'ok', emoji: '😐', label: 'Okay' },
  { value: 'meh', emoji: '🙁', label: 'Meh' },
  { value: 'bad', emoji: '😫', label: 'Bad' },
];

export const NUDGE_MESSAGES = [
  "Time for a stretch?",
  "You're doing great!",
  "Need a water break?",
  "Take a deep breath.",
  "How's your focus?",
  "Quick check-in: How are you feeling?",
  "Remember to blink!",
  "A little movement goes a long way.",
  "Celebrate a small win!",
  "You deserve a break.",
  "Refocus: What's your next step?",
  "Smile! You're making progress.",
];

export const QUICK_LINK_ICONS = [
  { value: 'world', icon: IconWorld, label: 'Website' },
  { value: 'google', icon: IconBrandGoogle, label: 'Google' },
  { value: 'youtube', icon: IconBrandYoutube, label: 'YouTube' },
  { value: 'notion', icon: IconBrandNotion, label: 'Notion' },
  { value: 'github', icon: IconBrandGithub, label: 'GitHub' },
  { value: 'discord', icon: IconBrandDiscord, label: 'Discord' },
  { value: 'external', icon: IconExternalLink, label: 'Other' },
];

export const DEFAULT_PROJECTS = [
  {
    id: 'inbox',
    name: 'Inbox',
    description: 'General tasks and notes',
    currentTask: '',
    nextSteps: [],
    resources: [],
    lastWorked: Date.now(),
    timeSpent: 0,
    status: 'active',
  },
  {
    id: 'personal',
    name: 'Personal',
    description: 'Personal projects and goals',
    currentTask: '',
    nextSteps: [],
    resources: [],
    lastWorked: Date.now(),
    timeSpent: 0,
    status: 'active',
  },
  {
    id: 'work',
    name: 'Work',
    description: 'Work-related projects',
    currentTask: '',
    nextSteps: [],
    resources: [],
    lastWorked: Date.now(),
    timeSpent: 0,
    status: 'active',
  },
];

export const DEFAULT_TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'default-1',
    name: 'Email Follow-up',
    description: 'Send a follow-up email to a contact or client.',
    type: 'task',
    priority: 'important',
    energy: 2,
    energyEstimate: 10,
    context: ['computer', 'work'],
    tags: ['email', 'follow-up'],
    recurring: undefined,
    dueDate: undefined,
    subtasks: ['Draft email', 'Review', 'Send'],
    notes: '',
    isDefault: true,
  },
  {
    id: 'default-2',
    name: 'Take Medication',
    description: 'Remember to take your medication.',
    type: 'reminder',
    priority: 'urgent',
    energy: 1,
    energyEstimate: 2,
    context: ['home'],
    tags: ['health', 'medication'],
    recurring: 'daily',
    dueDate: undefined,
    subtasks: [],
    notes: '',
    isDefault: true,
  },
  {
    id: 'default-3',
    name: 'Daily Review',
    description: 'Reflect on your day and plan for tomorrow.',
    type: 'note',
    priority: 'someday',
    energy: 2,
    energyEstimate: 15,
    context: ['home', 'evening'],
    tags: ['review', 'reflection'],
    recurring: 'daily',
    dueDate: undefined,
    subtasks: ['What went well?', 'What to improve?', 'Plan tomorrow'],
    notes: '',
    isDefault: true,
  },
]; 