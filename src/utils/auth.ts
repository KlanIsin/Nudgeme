import CryptoJS from 'crypto-js';

export interface User {
  id: string;
  name: string;
  email?: string;
  preferences: {
    theme: 'light' | 'dark' | 'high-contrast';
    notifications: boolean;
    voiceCommands: boolean;
    autoSync: boolean;
  };
  createdAt: Date;
  lastLogin: Date;
}

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

class AuthManager {
  private static instance: AuthManager;
  private users: Map<string, User> = new Map();
  private currentUser: User | null = null;
  private readonly STORAGE_KEY = 'nudgeme_users';
  private readonly SESSION_KEY = 'nudgeme_current_user';

  private constructor() {
    this.loadUsers();
    this.restoreSession();
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  private loadUsers(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const usersData = JSON.parse(stored);
        this.users = new Map(Object.entries(usersData));
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  private saveUsers(): void {
    try {
      const usersData = Object.fromEntries(this.users);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usersData));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  private restoreSession(): void {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (stored) {
        const userData = JSON.parse(stored);
        const user = this.users.get(userData.id);
        if (user) {
          this.currentUser = user;
          this.updateLastLogin(user.id);
        }
      }
    } catch (error) {
      console.error('Error restoring session:', error);
    }
  }

  private updateLastLogin(userId: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.lastLogin = new Date();
      this.users.set(userId, user);
      this.saveUsers();
    }
  }

  private generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  }

  // Public methods
  async createUser(name: string, password: string, email?: string): Promise<User> {
    const userId = this.generateUserId();
    const hashedPassword = this.hashPassword(password);
    
    const user: User = {
      id: userId,
      name,
      email,
      preferences: {
        theme: 'light',
        notifications: true,
        voiceCommands: true,
        autoSync: true,
      },
      createdAt: new Date(),
      lastLogin: new Date(),
    };

    // Store user with hashed password
    this.users.set(userId, user);
    this.saveUsers();

    // Store password hash separately (in real app, this would be in a secure database)
    localStorage.setItem(`password_${userId}`, hashedPassword);

    return user;
  }

  async login(name: string, password: string): Promise<User | null> {
    const hashedPassword = this.hashPassword(password);
    
    // Find user by name
    for (const [userId, user] of this.users.entries()) {
      if (user.name === name) {
        const storedHash = localStorage.getItem(`password_${userId}`);
        if (storedHash === hashedPassword) {
          this.currentUser = user;
          this.updateLastLogin(userId);
          
          // Save session
          localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
          
          return user;
        }
      }
    }
    
    return null;
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem(this.SESSION_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  updateUserPreferences(preferences: Partial<User['preferences']>): void {
    if (this.currentUser) {
      this.currentUser.preferences = { ...this.currentUser.preferences, ...preferences };
      this.users.set(this.currentUser.id, this.currentUser);
      this.saveUsers();
      
      // Update session
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentUser));
    }
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  deleteUser(userId: string): boolean {
    if (this.users.has(userId)) {
      this.users.delete(userId);
      localStorage.removeItem(`password_${userId}`);
      this.saveUsers();
      
      // If deleting current user, logout
      if (this.currentUser?.id === userId) {
        this.logout();
      }
      
      return true;
    }
    return false;
  }

  // Data isolation methods
  getUserDataKey(key: string): string {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }
    return `${this.currentUser.id}_${key}`;
  }

  getUserDataPrefix(): string {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }
    return `${this.currentUser.id}_`;
  }
}

export const authManager = AuthManager.getInstance(); 