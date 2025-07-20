// Push Notifications System for NudgeMe
export interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  actions?: NotificationAction[];
  timestamp?: number;
  priority?: 'high' | 'normal' | 'low';
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface ScheduledNotification extends NotificationConfig {
  id: string;
  scheduledTime: number;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    timeOfDay?: string; // HH:mm format
  };
  category: 'focus' | 'break' | 'reminder' | 'achievement' | 'mood' | 'task';
  userId?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  focusReminders: boolean;
  breakReminders: boolean;
  taskReminders: boolean;
  moodCheckins: boolean;
  achievementCelebrations: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  desktopNotifications: boolean;
  mobileNotifications: boolean;
}

class NotificationManager {
  private isSupported: boolean;
  private permission: NotificationPermission = 'default';
  private preferences: NotificationPreferences;
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private notificationQueue: NotificationConfig[] = [];
  private isInitialized = false;

  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.preferences = this.loadPreferences();
    this.checkPermission();
  }

  // Initialize notification system
  async initialize(): Promise<void> {
    if (!this.isSupported) {
      console.warn('Notifications not supported in this browser');
      return;
    }

    try {
      // Register service worker for notifications
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered for notifications:', registration);
      }

      // Request permission if not granted
      if (this.permission === 'default') {
        await this.requestPermission();
      }

      // Load scheduled notifications
      await this.loadScheduledNotifications();

      // Start notification scheduler
      this.startScheduler();

      this.isInitialized = true;
      console.log('Notification system initialized');
    } catch (error) {
      console.error('Failed to initialize notification system:', error);
    }
  }

  // Check current permission status
  private checkPermission(): void {
    if (this.isSupported) {
      this.permission = Notification.permission;
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  // Send immediate notification
  async sendNotification(config: NotificationConfig): Promise<boolean> {
    if (!this.isSupported || this.permission !== 'granted') {
      return false;
    }

    // Check if notifications are enabled
    if (!this.preferences.enabled) {
      return false;
    }

    // Check quiet hours
    if (this.isInQuietHours()) {
      console.log('Notification suppressed due to quiet hours');
      return false;
    }

    try {
      const notification = new Notification(config.title, {
        body: config.body,
        icon: config.icon || '/pwa-192x192.png',
        badge: config.badge || '/pwa-192x192.png',
        tag: config.tag,
        data: config.data,
        requireInteraction: config.requireInteraction || false,
        silent: config.silent || !this.preferences.soundEnabled,
        vibrate: this.preferences.vibrationEnabled ? (config.vibrate || [100, 50, 100]) : undefined,
        actions: config.actions,
        timestamp: config.timestamp || Date.now()
      });

      // Handle notification click
      notification.onclick = (event) => {
        this.handleNotificationClick(event, config);
      };

      // Handle notification action clicks
      notification.onactionclick = (event) => {
        this.handleNotificationAction(event, config);
      };

      // Auto-close non-interactive notifications after 5 seconds
      if (!config.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  // Schedule a notification
  async scheduleNotification(notification: ScheduledNotification): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Generate unique ID if not provided
    if (!notification.id) {
      notification.id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Store the notification
    this.scheduledNotifications.set(notification.id, notification);
    await this.saveScheduledNotifications();

    console.log(`Scheduled notification: ${notification.id} for ${new Date(notification.scheduledTime)}`);
    return notification.id;
  }

  // Cancel a scheduled notification
  async cancelNotification(id: string): Promise<boolean> {
    const wasDeleted = this.scheduledNotifications.delete(id);
    if (wasDeleted) {
      await this.saveScheduledNotifications();
      console.log(`Cancelled notification: ${id}`);
    }
    return wasDeleted;
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    this.scheduledNotifications.clear();
    await this.saveScheduledNotifications();
    console.log('Cancelled all scheduled notifications');
  }

  // Get all scheduled notifications
  getScheduledNotifications(): ScheduledNotification[] {
    return Array.from(this.scheduledNotifications.values());
  }

  // Start the notification scheduler
  private startScheduler(): void {
    // Check for due notifications every minute
    setInterval(() => {
      this.checkScheduledNotifications();
    }, 60000);

    // Initial check
    this.checkScheduledNotifications();
  }

  // Check for notifications that are due
  private async checkScheduledNotifications(): Promise<void> {
    const now = Date.now();
    const dueNotifications: ScheduledNotification[] = [];

    for (const notification of this.scheduledNotifications.values()) {
      if (notification.scheduledTime <= now) {
        dueNotifications.push(notification);
      }
    }

    // Send due notifications
    for (const notification of dueNotifications) {
      await this.sendNotification(notification);
      
      // Handle recurring notifications
      if (notification.recurring) {
        await this.scheduleNextRecurringNotification(notification);
      } else {
        // Remove one-time notifications
        this.scheduledNotifications.delete(notification.id);
      }
    }

    if (dueNotifications.length > 0) {
      await this.saveScheduledNotifications();
    }
  }

  // Schedule next occurrence of recurring notification
  private async scheduleNextRecurringNotification(notification: ScheduledNotification): Promise<void> {
    if (!notification.recurring) return;

    const now = new Date();
    let nextTime = new Date(notification.scheduledTime);

    switch (notification.recurring.type) {
      case 'daily':
        nextTime.setDate(nextTime.getDate() + notification.recurring.interval);
        break;
      case 'weekly':
        nextTime.setDate(nextTime.getDate() + (7 * notification.recurring.interval));
        break;
      case 'monthly':
        nextTime.setMonth(nextTime.getMonth() + notification.recurring.interval);
        break;
    }

    // Update scheduled time
    notification.scheduledTime = nextTime.getTime();
    this.scheduledNotifications.set(notification.id, notification);
  }

  // Smart notification helpers for ADHD
  async sendFocusReminder(): Promise<boolean> {
    return this.sendNotification({
      title: 'Time to Focus! 🎯',
      body: 'Your focus session is ready to begin. Take a deep breath and let\'s get productive!',
      tag: 'focus-reminder',
      category: 'focus',
      requireInteraction: false,
      vibrate: [200, 100, 200]
    });
  }

  async sendBreakReminder(): Promise<boolean> {
    return this.sendNotification({
      title: 'Break Time! ☕',
      body: 'Great work! Time to take a short break. Stretch, hydrate, and recharge.',
      tag: 'break-reminder',
      category: 'break',
      requireInteraction: false,
      vibrate: [100, 50, 100]
    });
  }

  async sendTaskReminder(taskTitle: string, dueTime?: string): Promise<boolean> {
    const body = dueTime 
      ? `"${taskTitle}" is due ${dueTime}. Time to tackle it!`
      : `"${taskTitle}" needs your attention. You've got this!`;

    return this.sendNotification({
      title: 'Task Reminder 📝',
      body,
      tag: 'task-reminder',
      category: 'task',
      requireInteraction: true,
      data: { taskTitle },
      actions: [
        { action: 'start', title: 'Start Now' },
        { action: 'snooze', title: 'Snooze 15min' }
      ]
    });
  }

  async sendMoodCheckin(): Promise<boolean> {
    return this.sendNotification({
      title: 'How are you feeling? 💭',
      body: 'Take a moment to check in with yourself. Your mental health matters.',
      tag: 'mood-checkin',
      category: 'mood',
      requireInteraction: true,
      actions: [
        { action: 'checkin', title: 'Check In' },
        { action: 'skip', title: 'Skip' }
      ]
    });
  }

  async sendAchievementCelebration(achievement: string): Promise<boolean> {
    return this.sendNotification({
      title: 'Achievement Unlocked! 🎉',
      body: `Congratulations! You've earned: ${achievement}. You're doing amazing!`,
      tag: 'achievement',
      category: 'achievement',
      requireInteraction: false,
      vibrate: [300, 100, 300, 100, 300]
    });
  }

  async sendEnergyLowReminder(): Promise<boolean> {
    return this.sendNotification({
      title: 'Energy Check ⚡',
      body: 'Your energy seems low. Consider a break or switching to a lighter task.',
      tag: 'energy-reminder',
      category: 'reminder',
      requireInteraction: false
    });
  }

  async sendDistractionAlert(): Promise<boolean> {
    return this.sendNotification({
      title: 'Stay Focused! 🎯',
      body: 'You\'ve been away for a while. Ready to get back to your task?',
      tag: 'distraction-alert',
      category: 'focus',
      requireInteraction: true,
      actions: [
        { action: 'resume', title: 'Resume' },
        { action: 'break', title: 'Take Break' }
      ]
    });
  }

  // Handle notification clicks
  private handleNotificationClick(event: Event, config: NotificationConfig): void {
    const notification = event.target as Notification;
    notification.close();

    // Handle different notification types
    switch (config.tag) {
      case 'focus-reminder':
        this.handleFocusReminderClick();
        break;
      case 'break-reminder':
        this.handleBreakReminderClick();
        break;
      case 'task-reminder':
        this.handleTaskReminderClick(config.data);
        break;
      case 'mood-checkin':
        this.handleMoodCheckinClick();
        break;
      case 'achievement':
        this.handleAchievementClick();
        break;
      default:
        // Default behavior - focus the app window
        window.focus();
    }
  }

  // Handle notification action clicks
  private handleNotificationAction(event: any, config: NotificationConfig): void {
    const action = event.action;
    const notification = event.target as Notification;
    notification.close();

    switch (action) {
      case 'start':
        this.handleStartAction(config.data);
        break;
      case 'snooze':
        this.handleSnoozeAction(config.data);
        break;
      case 'checkin':
        this.handleCheckinAction();
        break;
      case 'resume':
        this.handleResumeAction();
        break;
      case 'break':
        this.handleBreakAction();
        break;
      default:
        console.log('Unknown notification action:', action);
    }
  }

  // Action handlers
  private handleFocusReminderClick(): void {
    // Trigger focus session start
    window.dispatchEvent(new CustomEvent('startFocusSession'));
  }

  private handleBreakReminderClick(): void {
    // Trigger break start
    window.dispatchEvent(new CustomEvent('startBreak'));
  }

  private handleTaskReminderClick(data: any): void {
    // Open task details
    window.dispatchEvent(new CustomEvent('openTask', { detail: data }));
  }

  private handleMoodCheckinClick(): void {
    // Open mood checkin modal
    window.dispatchEvent(new CustomEvent('openMoodCheckin'));
  }

  private handleAchievementClick(): void {
    // Open achievements panel
    window.dispatchEvent(new CustomEvent('openAchievements'));
  }

  private handleStartAction(data: any): void {
    // Start the associated task or session
    window.dispatchEvent(new CustomEvent('startTask', { detail: data }));
  }

  private handleSnoozeAction(data: any): void {
    // Snooze the notification for 15 minutes
    const snoozeTime = Date.now() + (15 * 60 * 1000);
    this.scheduleNotification({
      ...data,
      id: `snooze_${Date.now()}`,
      scheduledTime: snoozeTime,
      title: data.title || 'Task Reminder 📝',
      body: data.body || 'Your snoozed task is ready again!',
      category: 'task'
    });
  }

  private handleCheckinAction(): void {
    // Open mood checkin
    window.dispatchEvent(new CustomEvent('openMoodCheckin'));
  }

  private handleResumeAction(): void {
    // Resume current session
    window.dispatchEvent(new CustomEvent('resumeSession'));
  }

  private handleBreakAction(): void {
    // Start break
    window.dispatchEvent(new CustomEvent('startBreak'));
  }

  // Check if currently in quiet hours
  private isInQuietHours(): boolean {
    if (!this.preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.preferences.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Handles overnight quiet hours (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Update notification preferences
  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
    this.savePreferences();
  }

  // Get current preferences
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // Load preferences from storage
  private loadPreferences(): NotificationPreferences {
    try {
      const saved = localStorage.getItem('nudgeme_notification_preferences');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }

    // Default preferences
    return {
      enabled: true,
      focusReminders: true,
      breakReminders: true,
      taskReminders: true,
      moodCheckins: true,
      achievementCelebrations: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      soundEnabled: true,
      vibrationEnabled: true,
      desktopNotifications: true,
      mobileNotifications: true
    };
  }

  // Save preferences to storage
  private savePreferences(): void {
    try {
      localStorage.setItem('nudgeme_notification_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  // Load scheduled notifications from storage
  private async loadScheduledNotifications(): Promise<void> {
    try {
      const saved = localStorage.getItem('nudgeme_scheduled_notifications');
      if (saved) {
        const notifications = JSON.parse(saved);
        this.scheduledNotifications = new Map(notifications);
      }
    } catch (error) {
      console.error('Failed to load scheduled notifications:', error);
    }
  }

  // Save scheduled notifications to storage
  private async saveScheduledNotifications(): Promise<void> {
    try {
      const notifications = Array.from(this.scheduledNotifications.entries());
      localStorage.setItem('nudgeme_scheduled_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save scheduled notifications:', error);
    }
  }

  // Get notification statistics
  getStats(): {
    totalScheduled: number;
    permission: NotificationPermission;
    isSupported: boolean;
    isEnabled: boolean;
  } {
    return {
      totalScheduled: this.scheduledNotifications.size,
      permission: this.permission,
      isSupported: this.isSupported,
      isEnabled: this.preferences.enabled
    };
  }

  // Test notification
  async testNotification(): Promise<boolean> {
    return this.sendNotification({
      title: 'Test Notification 🧪',
      body: 'This is a test notification to verify everything is working correctly!',
      tag: 'test',
      requireInteraction: true,
      actions: [
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
  }
}

// Create and export singleton instance
export const notificationManager = new NotificationManager();

// Export types and utilities
export { NotificationManager };
export type { NotificationConfig, ScheduledNotification, NotificationPreferences, NotificationAction }; 