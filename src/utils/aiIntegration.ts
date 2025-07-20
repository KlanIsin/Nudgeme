// AI Integration & Natural Language Processing for NudgeMe
import { storage } from './storage';

export interface AISuggestion {
  id: string;
  type: 'task' | 'focus' | 'break' | 'mood' | 'goal' | 'reminder';
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  estimatedDuration?: number;
  energyLevel?: 'low' | 'medium' | 'high';
  tags?: string[];
  action?: () => void;
}

export interface NLPResult {
  type: 'task' | 'reminder' | 'mood' | 'goal' | 'focus';
  content: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
  energy: 'low' | 'medium' | 'high';
  tags: string[];
  duration?: number;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
  };
  metadata: {
    confidence: number;
    entities: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
  };
}

export interface UserPattern {
  id: string;
  type: 'productivity' | 'energy' | 'mood' | 'focus' | 'distraction';
  pattern: string;
  confidence: number;
  frequency: number;
  triggers: string[];
  recommendations: string[];
  lastUpdated: number;
}

export interface PredictiveInsight {
  id: string;
  type: 'productivity' | 'energy' | 'mood' | 'focus' | 'completion';
  prediction: string;
  confidence: number;
  timeframe: 'today' | 'week' | 'month';
  factors: string[];
  recommendations: string[];
  timestamp: number;
}

class AIIntegration {
  private isInitialized = false;
  private userPatterns: Map<string, UserPattern> = new Map();
  private predictiveInsights: PredictiveInsight[] = [];
  private nlpModels: Map<string, any> = new Map();

  constructor() {
    this.initializeNLPModels();
  }

  // Initialize AI system
  async initialize(): Promise<void> {
    try {
      await this.loadUserPatterns();
      await this.loadPredictiveInsights();
      await this.analyzeUserData();
      
      this.isInitialized = true;
      console.log('AI Integration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI Integration:', error);
    }
  }

  // Initialize NLP models
  private initializeNLPModels(): void {
    // Task recognition patterns
    this.nlpModels.set('task', {
      patterns: [
        /(?:add|create|make|set)\s+(?:a\s+)?(?:new\s+)?(?:task|todo|item)\s+(?:called\s+)?(.+)/i,
        /(?:need\s+to|have\s+to|must|should)\s+(.+)/i,
        /(.+)\s+(?:by|before|until)\s+(.+)/i,
        /(.+)\s+(?:tomorrow|next\s+week|next\s+month)/i
      ],
      priorityKeywords: {
        high: ['urgent', 'asap', 'important', 'critical', 'emergency', 'deadline'],
        medium: ['soon', 'this week', 'should', 'need'],
        low: ['sometime', 'when possible', 'maybe', 'if time']
      },
      energyKeywords: {
        high: ['energetic', 'motivated', 'excited', 'ready'],
        medium: ['okay', 'fine', 'normal'],
        low: ['tired', 'exhausted', 'low energy', 'drained']
      }
    });

    // Time recognition patterns
    this.nlpModels.set('time', {
      patterns: [
        /(\d{1,2}):(\d{2})\s*(am|pm)/i,
        /(\d{1,2})\s*(am|pm)/i,
        /(today|tomorrow|next\s+week|next\s+month)/i,
        /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
        /(january|february|march|april|may|june|july|august|september|october|november|december)/i
      ]
    });

    // Mood recognition patterns
    this.nlpModels.set('mood', {
      patterns: [
        /(?:feeling|am|feel)\s+(.+)/i,
        /(?:mood|emotion)\s+(?:is\s+)?(.+)/i
      ],
      moodKeywords: {
        positive: ['happy', 'excited', 'motivated', 'energetic', 'good', 'great', 'amazing'],
        neutral: ['okay', 'fine', 'normal', 'alright', 'stable'],
        negative: ['sad', 'anxious', 'stressed', 'tired', 'overwhelmed', 'bad']
      }
    });
  }

  // Parse natural language input
  async parseNaturalLanguage(input: string): Promise<NLPResult | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const normalizedInput = input.toLowerCase().trim();
    
    // Determine input type
    const type = this.determineInputType(normalizedInput);
    
    // Extract entities and metadata
    const entities = this.extractEntities(normalizedInput);
    const priority = this.extractPriority(normalizedInput);
    const energy = this.extractEnergy(normalizedInput);
    const dueDate = this.extractDueDate(normalizedInput);
    const duration = this.extractDuration(normalizedInput);
    const recurring = this.extractRecurring(normalizedInput);
    const tags = this.extractTags(normalizedInput);
    const sentiment = this.analyzeSentiment(normalizedInput);
    
    // Extract main content
    const content = this.extractContent(normalizedInput, type);
    
    if (!content) {
      return null;
    }

    const result: NLPResult = {
      type,
      content,
      priority,
      dueDate,
      energy,
      tags,
      duration,
      recurring,
      metadata: {
        confidence: this.calculateConfidence(normalizedInput, type),
        entities,
        sentiment
      }
    };

    // Learn from this input
    await this.learnFromInput(input, result);

    return result;
  }

  // Determine input type
  private determineInputType(input: string): 'task' | 'reminder' | 'mood' | 'goal' | 'focus' {
    if (this.nlpModels.get('mood')?.patterns.some(p => p.test(input))) {
      return 'mood';
    }
    if (input.includes('goal') || input.includes('target') || input.includes('achieve')) {
      return 'goal';
    }
    if (input.includes('focus') || input.includes('concentrate') || input.includes('work on')) {
      return 'focus';
    }
    if (input.includes('remind') || input.includes('remember')) {
      return 'reminder';
    }
    return 'task';
  }

  // Extract entities from input
  private extractEntities(input: string): string[] {
    const entities: string[] = [];
    
    // Extract names, places, times, etc.
    const namePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
    const timePattern = /\b\d{1,2}:\d{2}\s*(am|pm)?\b/gi;
    const datePattern = /\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;
    
    entities.push(...Array.from(input.match(namePattern) || []));
    entities.push(...Array.from(input.match(timePattern) || []));
    entities.push(...Array.from(input.match(datePattern) || []));
    
    return entities;
  }

  // Extract priority from input
  private extractPriority(input: string): 'high' | 'medium' | 'low' {
    const priorityKeywords = this.nlpModels.get('task')?.priorityKeywords;
    
    if (priorityKeywords?.high.some(keyword => input.includes(keyword))) {
      return 'high';
    }
    if (priorityKeywords?.low.some(keyword => input.includes(keyword))) {
      return 'low';
    }
    return 'medium';
  }

  // Extract energy level from input
  private extractEnergy(input: string): 'low' | 'medium' | 'high' {
    const energyKeywords = this.nlpModels.get('task')?.energyKeywords;
    
    if (energyKeywords?.high.some(keyword => input.includes(keyword))) {
      return 'high';
    }
    if (energyKeywords?.low.some(keyword => input.includes(keyword))) {
      return 'low';
    }
    return 'medium';
  }

  // Extract due date from input
  private extractDueDate(input: string): Date | undefined {
    const timeModel = this.nlpModels.get('time');
    const patterns = timeModel?.patterns || [];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        return this.parseDateFromMatch(match, input);
      }
    }
    
    return undefined;
  }

  // Parse date from regex match
  private parseDateFromMatch(match: RegExpMatchArray, input: string): Date | undefined {
    const now = new Date();
    
    if (input.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    
    if (input.includes('next week')) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek;
    }
    
    if (input.includes('next month')) {
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;
    }
    
    // Handle specific times
    const timeMatch = input.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (timeMatch) {
      const [_, hours, minutes, period] = timeMatch;
      const date = new Date(now);
      let hour = parseInt(hours);
      
      if (period.toLowerCase() === 'pm' && hour !== 12) {
        hour += 12;
      } else if (period.toLowerCase() === 'am' && hour === 12) {
        hour = 0;
      }
      
      date.setHours(hour, parseInt(minutes), 0, 0);
      return date;
    }
    
    return undefined;
  }

  // Extract duration from input
  private extractDuration(input: string): number | undefined {
    const durationPatterns = [
      /(\d+)\s*(?:hour|hr)s?/i,
      /(\d+)\s*(?:minute|min)s?/i,
      /(\d+)\s*(?:day|days)/i
    ];
    
    for (const pattern of durationPatterns) {
      const match = input.match(pattern);
      if (match) {
        const value = parseInt(match[1]);
        if (input.includes('hour') || input.includes('hr')) {
          return value * 60; // Convert to minutes
        }
        if (input.includes('day')) {
          return value * 24 * 60; // Convert to minutes
        }
        return value; // Already in minutes
      }
    }
    
    return undefined;
  }

  // Extract recurring pattern
  private extractRecurring(input: string): { type: 'daily' | 'weekly' | 'monthly'; interval: number } | undefined {
    if (input.includes('daily') || input.includes('every day')) {
      return { type: 'daily', interval: 1 };
    }
    if (input.includes('weekly') || input.includes('every week')) {
      return { type: 'weekly', interval: 1 };
    }
    if (input.includes('monthly') || input.includes('every month')) {
      return { type: 'monthly', interval: 1 };
    }
    
    const everyPattern = /every\s+(\d+)\s*(day|week|month)s?/i;
    const match = input.match(everyPattern);
    if (match) {
      const interval = parseInt(match[1]);
      const type = match[2] as 'day' | 'week' | 'month';
      return { type: type === 'day' ? 'daily' : type === 'week' ? 'weekly' : 'monthly', interval };
    }
    
    return undefined;
  }

  // Extract tags from input
  private extractTags(input: string): string[] {
    const tags: string[] = [];
    
    // Extract hashtags
    const hashtagPattern = /#(\w+)/g;
    const hashtags = Array.from(input.match(hashtagPattern) || []);
    tags.push(...hashtags.map(tag => tag.slice(1)));
    
    // Extract common categories
    const categories = ['work', 'personal', 'health', 'finance', 'learning', 'social', 'home'];
    categories.forEach(category => {
      if (input.includes(category)) {
        tags.push(category);
      }
    });
    
    return tags;
  }

  // Analyze sentiment
  private analyzeSentiment(input: string): 'positive' | 'neutral' | 'negative' {
    const moodKeywords = this.nlpModels.get('mood')?.moodKeywords;
    
    const positiveCount = moodKeywords?.positive.filter(keyword => input.includes(keyword)).length || 0;
    const negativeCount = moodKeywords?.negative.filter(keyword => input.includes(keyword)).length || 0;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Extract main content
  private extractContent(input: string, type: string): string {
    // Remove common prefixes and suffixes
    const prefixes = [
      /^(?:add|create|make|set)\s+(?:a\s+)?(?:new\s+)?(?:task|todo|item)\s+(?:called\s+)?/i,
      /^(?:need\s+to|have\s+to|must|should)\s+/i,
      /^(?:feeling|am|feel)\s+/i,
      /^(?:mood|emotion)\s+(?:is\s+)?/i
    ];
    
    let content = input;
    prefixes.forEach(prefix => {
      content = content.replace(prefix, '');
    });
    
    // Remove time/date information
    content = content.replace(/\b(?:by|before|until|tomorrow|next\s+week|next\s+month)\b.*$/i, '');
    
    return content.trim();
  }

  // Calculate confidence score
  private calculateConfidence(input: string, type: string): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on pattern matches
    const model = this.nlpModels.get(type);
    if (model?.patterns) {
      const patternMatches = model.patterns.filter(p => p.test(input)).length;
      confidence += patternMatches * 0.1;
    }
    
    // Increase confidence based on entity extraction
    const entities = this.extractEntities(input);
    confidence += entities.length * 0.05;
    
    // Increase confidence for longer, more specific inputs
    if (input.length > 20) confidence += 0.1;
    if (input.length > 50) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  // Generate AI suggestions
  async generateSuggestions(context: any): Promise<AISuggestion[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const suggestions: AISuggestion[] = [];
    
    // Analyze current context
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const userData = await this.getUserData();
    
    // Time-based suggestions
    if (currentHour >= 9 && currentHour <= 11) {
      suggestions.push({
        id: 'morning-focus',
        type: 'focus',
        title: 'Morning Focus Session',
        description: 'Your energy is typically highest in the morning. Perfect time for deep work!',
        confidence: 0.8,
        reasoning: 'Based on your productivity patterns, mornings are your peak performance time',
        priority: 'high',
        estimatedDuration: 25,
        energyLevel: 'high',
        tags: ['morning', 'focus', 'productivity']
      });
    }
    
    // Energy-based suggestions
    const currentEnergy = context.currentEnergy || 'medium';
    if (currentEnergy === 'low') {
      suggestions.push({
        id: 'low-energy-break',
        type: 'break',
        title: 'Take a Short Break',
        description: 'Your energy seems low. Consider a 5-minute break to recharge.',
        confidence: 0.7,
        reasoning: 'Low energy periods benefit from short breaks rather than forcing work',
        priority: 'medium',
        estimatedDuration: 5,
        energyLevel: 'low',
        tags: ['break', 'energy', 'recharge']
      });
    }
    
    // Task-based suggestions
    const pendingTasks = userData.tasks?.filter((t: any) => t.status === 'pending') || [];
    if (pendingTasks.length > 0) {
      const highPriorityTasks = pendingTasks.filter((t: any) => t.priority === 'high');
      if (highPriorityTasks.length > 0) {
        suggestions.push({
          id: 'high-priority-task',
          type: 'task',
          title: `Complete: ${highPriorityTasks[0].content}`,
          description: 'This high-priority task has been pending. Consider tackling it now.',
          confidence: 0.9,
          reasoning: 'High-priority tasks should be completed first',
          priority: 'high',
          estimatedDuration: highPriorityTasks[0].estimatedDuration || 30,
          energyLevel: currentEnergy,
          tags: ['priority', 'task', 'completion']
        });
      }
    }
    
    // Mood-based suggestions
    const recentMoods = userData.moods?.slice(-5) || [];
    const averageMood = this.calculateAverageMood(recentMoods);
    if (averageMood < 3) {
      suggestions.push({
        id: 'mood-checkin',
        type: 'mood',
        title: 'Mood Check-in',
        description: 'Your mood has been lower than usual. How are you feeling right now?',
        confidence: 0.6,
        reasoning: 'Regular mood check-ins help maintain mental well-being',
        priority: 'medium',
        tags: ['mood', 'wellness', 'checkin']
      });
    }
    
    // Goal-based suggestions
    const activeGoals = userData.goals?.filter((g: any) => g.status === 'active') || [];
    if (activeGoals.length > 0) {
      const goal = activeGoals[0];
      suggestions.push({
        id: 'goal-progress',
        type: 'goal',
        title: `Work on: ${goal.title}`,
        description: `Make progress toward your goal: ${goal.description}`,
        confidence: 0.7,
        reasoning: 'Regular progress on goals increases motivation and achievement',
        priority: 'medium',
        estimatedDuration: 20,
        energyLevel: currentEnergy,
        tags: ['goal', 'progress', 'motivation']
      });
    }
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  // Generate predictive insights
  async generatePredictiveInsights(): Promise<PredictiveInsight[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const insights: PredictiveInsight[] = [];
    const userData = await this.getUserData();
    
    // Productivity prediction
    const productivityInsight = await this.predictProductivity(userData);
    if (productivityInsight) {
      insights.push(productivityInsight);
    }
    
    // Energy prediction
    const energyInsight = await this.predictEnergy(userData);
    if (energyInsight) {
      insights.push(energyInsight);
    }
    
    // Mood prediction
    const moodInsight = await this.predictMood(userData);
    if (moodInsight) {
      insights.push(moodInsight);
    }
    
    // Focus prediction
    const focusInsight = await this.predictFocus(userData);
    if (focusInsight) {
      insights.push(focusInsight);
    }
    
    // Task completion prediction
    const completionInsight = await this.predictTaskCompletion(userData);
    if (completionInsight) {
      insights.push(completionInsight);
    }
    
    return insights;
  }

  // Predict productivity
  private async predictProductivity(userData: any): Promise<PredictiveInsight | null> {
    const focusSessions = userData.focusSessions || [];
    const recentSessions = focusSessions.slice(-10);
    
    if (recentSessions.length < 3) return null;
    
    const averageProductivity = recentSessions.reduce((sum: number, session: any) => 
      sum + (session.productivityScore || 0), 0) / recentSessions.length;
    
    const trend = this.calculateTrend(recentSessions.map((s: any) => s.productivityScore || 0));
    
    return {
      id: 'productivity-prediction',
      type: 'productivity',
      prediction: `Your productivity is ${trend > 0 ? 'improving' : 'declining'}. Expected score: ${Math.round(averageProductivity + trend)}/10`,
      confidence: 0.7,
      timeframe: 'week',
      factors: ['Focus session quality', 'Energy levels', 'Task complexity'],
      recommendations: [
        'Schedule focus sessions during your peak energy hours',
        'Take regular breaks to maintain productivity',
        'Break complex tasks into smaller chunks'
      ],
      timestamp: Date.now()
    };
  }

  // Predict energy levels
  private async predictEnergy(userData: any): Promise<PredictiveInsight | null> {
    const energyLogs = userData.energyLogs || [];
    const recentLogs = energyLogs.slice(-20);
    
    if (recentLogs.length < 5) return null;
    
    const currentHour = new Date().getHours();
    const hourlyEnergy = this.calculateHourlyEnergy(recentLogs);
    const predictedEnergy = hourlyEnergy[currentHour] || 5;
    
    return {
      id: 'energy-prediction',
      type: 'energy',
      prediction: `Your energy level is expected to be ${predictedEnergy}/10 at this time`,
      confidence: 0.8,
      timeframe: 'today',
      factors: ['Time of day', 'Sleep quality', 'Recent activity'],
      recommendations: [
        predictedEnergy < 4 ? 'Consider a short break or lighter tasks' : 'Great time for focused work',
        'Stay hydrated and take movement breaks',
        'Monitor your energy patterns'
      ],
      timestamp: Date.now()
    };
  }

  // Predict mood
  private async predictMood(userData: any): Promise<PredictiveInsight | null> {
    const moods = userData.moods || [];
    const recentMoods = moods.slice(-10);
    
    if (recentMoods.length < 3) return null;
    
    const averageMood = this.calculateAverageMood(recentMoods);
    const trend = this.calculateTrend(recentMoods.map((m: any) => m.score || 0));
    
    return {
      id: 'mood-prediction',
      type: 'mood',
      prediction: `Your mood trend is ${trend > 0 ? 'improving' : 'declining'}. Current average: ${averageMood.toFixed(1)}/10`,
      confidence: 0.6,
      timeframe: 'week',
      factors: ['Recent activities', 'Sleep quality', 'Social interactions'],
      recommendations: [
        'Practice gratitude and positive self-talk',
        'Engage in activities that boost your mood',
        'Consider talking to someone if mood remains low'
      ],
      timestamp: Date.now()
    };
  }

  // Predict focus ability
  private async predictFocus(userData: any): Promise<PredictiveInsight | null> {
    const focusSessions = userData.focusSessions || [];
    const recentSessions = focusSessions.slice(-10);
    
    if (recentSessions.length < 3) return null;
    
    const averageFocus = recentSessions.reduce((sum: number, session: any) => 
      sum + (session.focusScore || 0), 0) / recentSessions.length;
    
    return {
      id: 'focus-prediction',
      type: 'focus',
      prediction: `Your focus ability is currently ${averageFocus.toFixed(1)}/10`,
      confidence: 0.7,
      timeframe: 'today',
      factors: ['Environment', 'Energy levels', 'Task interest'],
      recommendations: [
        'Minimize distractions in your environment',
        'Use focus techniques like Pomodoro',
        'Choose tasks that match your current energy level'
      ],
      timestamp: Date.now()
    };
  }

  // Predict task completion
  private async predictTaskCompletion(userData: any): Promise<PredictiveInsight | null> {
    const tasks = userData.tasks || [];
    const completedTasks = tasks.filter((t: any) => t.status === 'completed');
    const pendingTasks = tasks.filter((t: any) => t.status === 'pending');
    
    if (completedTasks.length === 0) return null;
    
    const completionRate = completedTasks.length / tasks.length;
    const averageCompletionTime = this.calculateAverageCompletionTime(completedTasks);
    
    return {
      id: 'completion-prediction',
      type: 'completion',
      prediction: `You complete ${(completionRate * 100).toFixed(1)}% of tasks. Average completion time: ${Math.round(averageCompletionTime)} minutes`,
      confidence: 0.8,
      timeframe: 'week',
      factors: ['Task complexity', 'Priority levels', 'Energy availability'],
      recommendations: [
        'Break large tasks into smaller, manageable pieces',
        'Set realistic deadlines based on your patterns',
        'Focus on high-priority tasks first'
      ],
      timestamp: Date.now()
    };
  }

  // Learn from user input
  private async learnFromInput(input: string, result: NLPResult): Promise<void> {
    // Store pattern for future learning
    const pattern: UserPattern = {
      id: `pattern_${Date.now()}`,
      type: result.type as any,
      pattern: input,
      confidence: result.metadata.confidence,
      frequency: 1,
      triggers: result.metadata.entities,
      recommendations: [],
      lastUpdated: Date.now()
    };
    
    this.userPatterns.set(pattern.id, pattern);
    await this.saveUserPatterns();
  }

  // Calculate trend from data points
  private calculateTrend(data: number[]): number {
    if (data.length < 2) return 0;
    
    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = data.reduce((sum, val, index) => sum + (index * val), 0);
    const sumX2 = data.reduce((sum, _, index) => sum + (index * index), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  // Calculate average mood
  private calculateAverageMood(moods: any[]): number {
    if (moods.length === 0) return 5;
    return moods.reduce((sum, mood) => sum + (mood.score || 5), 0) / moods.length;
  }

  // Calculate hourly energy patterns
  private calculateHourlyEnergy(energyLogs: any[]): Record<number, number> {
    const hourlyEnergy: Record<number, number> = {};
    const hourlyCounts: Record<number, number> = {};
    
    energyLogs.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      hourlyEnergy[hour] = (hourlyEnergy[hour] || 0) + (log.energy || 5);
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    });
    
    Object.keys(hourlyEnergy).forEach(hour => {
      const h = parseInt(hour);
      hourlyEnergy[h] = hourlyEnergy[h] / hourlyCounts[h];
    });
    
    return hourlyEnergy;
  }

  // Calculate average completion time
  private calculateAverageCompletionTime(completedTasks: any[]): number {
    if (completedTasks.length === 0) return 30;
    
    const completionTimes = completedTasks
      .filter(task => task.completedAt && task.createdAt)
      .map(task => {
        const created = new Date(task.createdAt);
        const completed = new Date(task.completedAt);
        return (completed.getTime() - created.getTime()) / (1000 * 60); // Convert to minutes
      });
    
    if (completionTimes.length === 0) return 30;
    return completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
  }

  // Get user data from storage
  private async getUserData(): Promise<any> {
    const data: any = {};
    
    const stores = ['tasks', 'focusSessions', 'moods', 'energyLogs', 'goals'];
    for (const store of stores) {
      data[store] = await storage.getAll(store);
    }
    
    return data;
  }

  // Load user patterns
  private async loadUserPatterns(): Promise<void> {
    try {
      const patterns = await storage.getAll('userPatterns');
      this.userPatterns = new Map(patterns.map((p: UserPattern) => [p.id, p]));
    } catch (error) {
      console.error('Failed to load user patterns:', error);
    }
  }

  // Save user patterns
  private async saveUserPatterns(): Promise<void> {
    try {
      const patterns = Array.from(this.userPatterns.values());
      for (const pattern of patterns) {
        await storage.set('userPatterns', pattern);
      }
    } catch (error) {
      console.error('Failed to save user patterns:', error);
    }
  }

  // Load predictive insights
  private async loadPredictiveInsights(): Promise<void> {
    try {
      this.predictiveInsights = await storage.getAll('predictiveInsights');
    } catch (error) {
      console.error('Failed to load predictive insights:', error);
    }
  }

  // Analyze user data for patterns
  private async analyzeUserData(): Promise<void> {
    const userData = await this.getUserData();
    
    // Analyze productivity patterns
    await this.analyzeProductivityPatterns(userData);
    
    // Analyze energy patterns
    await this.analyzeEnergyPatterns(userData);
    
    // Analyze mood patterns
    await this.analyzeMoodPatterns(userData);
  }

  // Analyze productivity patterns
  private async analyzeProductivityPatterns(userData: any): Promise<void> {
    const focusSessions = userData.focusSessions || [];
    if (focusSessions.length < 5) return;
    
    // Find best productivity times
    const hourlyProductivity: Record<number, number[]> = {};
    focusSessions.forEach((session: any) => {
      const hour = new Date(session.startTime).getHours();
      if (!hourlyProductivity[hour]) hourlyProductivity[hour] = [];
      hourlyProductivity[hour].push(session.productivityScore || 0);
    });
    
    const bestHours = Object.entries(hourlyProductivity)
      .map(([hour, scores]) => ({
        hour: parseInt(hour),
        average: scores.reduce((sum, score) => sum + score, 0) / scores.length
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 3);
    
    console.log('Best productivity hours:', bestHours);
  }

  // Analyze energy patterns
  private async analyzeEnergyPatterns(userData: any): Promise<void> {
    const energyLogs = userData.energyLogs || [];
    if (energyLogs.length < 10) return;
    
    // Find energy patterns throughout the day
    const hourlyEnergy = this.calculateHourlyEnergy(energyLogs);
    const peakHours = Object.entries(hourlyEnergy)
      .filter(([_, energy]) => energy > 7)
      .map(([hour, _]) => parseInt(hour));
    
    console.log('Peak energy hours:', peakHours);
  }

  // Analyze mood patterns
  private async analyzeMoodPatterns(userData: any): Promise<void> {
    const moods = userData.moods || [];
    if (moods.length < 5) return;
    
    // Find mood patterns
    const averageMood = this.calculateAverageMood(moods);
    const moodTrend = this.calculateTrend(moods.map(m => m.score || 5));
    
    console.log('Mood analysis:', { averageMood, trend: moodTrend });
  }

  // Get AI statistics
  getStats(): {
    patternsLearned: number;
    insightsGenerated: number;
    suggestionsMade: number;
    accuracy: number;
  } {
    return {
      patternsLearned: this.userPatterns.size,
      insightsGenerated: this.predictiveInsights.length,
      suggestionsMade: 0, // Would track in real implementation
      accuracy: 0.75 // Would calculate based on user feedback
    };
  }
}

// Create and export singleton instance
export const aiIntegration = new AIIntegration();

// Export types and utilities
export { AIIntegration };
export type { AISuggestion, NLPResult, UserPattern, PredictiveInsight }; 