// Advanced Storage System for NudgeMe
import CryptoJS from 'crypto-js';
import { authManager } from './auth';

export interface StorageConfig {
  encryptionKey?: string;
  compressionEnabled?: boolean;
  maxStorageSize?: number; // in MB
  autoCleanup?: boolean;
  cleanupThreshold?: number; // days
}

export interface StorageStats {
  usedSpace: number;
  totalSpace: number;
  itemCount: number;
  lastCleanup: number;
}

class AdvancedStorage {
  private db: IDBDatabase | null = null;
  private config: StorageConfig;
  private readonly DB_NAME = 'NudgeMeDB';
  private readonly DB_VERSION = 1;
  private readonly STORES = [
    'tasks',
    'focusSessions',
    'moods',
    'sensoryCheckins',
    'socialEntries',
    'distractions',
    'goals',
    'achievements',
    'challenges',
    'priorityMatrices',
    'reminders',
    'integrations',
    'settings',
    'analytics',
    'backups'
  ];

  constructor(config: StorageConfig = {}) {
    this.config = {
      encryptionKey: config.encryptionKey || 'nudgeme-default-key',
      compressionEnabled: config.compressionEnabled ?? true,
      maxStorageSize: config.maxStorageSize || 100, // 100MB
      autoCleanup: config.autoCleanup ?? true,
      cleanupThreshold: config.cleanupThreshold || 90, // 90 days
      ...config
    };
  }

  // Initialize the storage system
  async initialize(): Promise<void> {
    try {
      // Try IndexedDB first
      if ('indexedDB' in window) {
        await this.initializeIndexedDB();
        console.log('IndexedDB initialized successfully');
      } else {
        console.warn('IndexedDB not supported, falling back to localStorage');
      }
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      console.log('Falling back to localStorage');
    }
  }

  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        this.STORES.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            
            // Create indexes for common queries
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('type', 'type', { unique: false });
            store.createIndex('status', 'status', { unique: false });
            
            console.log(`Created object store: ${storeName}`);
          }
        });
      };
    });
  }

  // Store data with encryption and compression
  async set<T>(storeName: string, data: T): Promise<void> {
    try {
      const processedData = await this.processDataForStorage(data);
      const userKey = this.getUserSpecificKey(storeName);
      
      if (this.db) {
        await this.setIndexedDB(userKey, processedData);
      } else {
        this.setLocalStorage(userKey, processedData);
      }
    } catch (error) {
      console.error(`Failed to store data in ${storeName}:`, error);
      throw error;
    }
  }

  // Retrieve data with decryption and decompression
  async get<T>(storeName: string, id: string): Promise<T | null> {
    try {
      let data: any;
      const userKey = this.getUserSpecificKey(storeName);
      
      if (this.db) {
        data = await this.getIndexedDB(userKey, id);
      } else {
        data = this.getLocalStorage(userKey, id);
      }

      if (!data) return null;

      return await this.processDataFromStorage<T>(data);
    } catch (error) {
      console.error(`Failed to retrieve data from ${storeName}:`, error);
      return null;
    }
  }

  // Get all data from a store
  async getAll<T>(storeName: string): Promise<T[]> {
    try {
      let data: any[];
      const userKey = this.getUserSpecificKey(storeName);
      
      if (this.db) {
        data = await this.getAllIndexedDB(userKey);
      } else {
        data = this.getAllLocalStorage(userKey);
      }

      const processedData = await Promise.all(
        data.map(item => this.processDataFromStorage<T>(item))
      );

      return processedData.filter(item => item !== null) as T[];
    } catch (error) {
      console.error(`Failed to retrieve all data from ${storeName}:`, error);
      return [];
    }
  }

  // Get user-specific key for data isolation
  private getUserSpecificKey(storeName: string): string {
    try {
      const currentUser = authManager.getCurrentUser();
      if (currentUser) {
        return `${currentUser.id}_${storeName}`;
      }
      return storeName; // Fallback for unauthenticated users
    } catch (error) {
      console.warn('Could not get user-specific key, using default:', error);
      return storeName;
    }
  }

  // Update existing data
  async update<T>(storeName: string, id: string, updates: Partial<T>): Promise<void> {
    try {
      const existingData = await this.get<T>(storeName, id);
      if (!existingData) {
        throw new Error(`Data with id ${id} not found in ${storeName}`);
      }

      const updatedData = { ...existingData, ...updates, id };
      await this.set(storeName, updatedData);
    } catch (error) {
      console.error(`Failed to update data in ${storeName}:`, error);
      throw error;
    }
  }

  // Delete data
  async delete(storeName: string, id: string): Promise<void> {
    try {
      if (this.db) {
        await this.deleteIndexedDB(storeName, id);
      } else {
        this.deleteLocalStorage(storeName, id);
      }
    } catch (error) {
      console.error(`Failed to delete data from ${storeName}:`, error);
      throw error;
    }
  }

  // Clear all data from a store
  async clear(storeName: string): Promise<void> {
    try {
      if (this.db) {
        await this.clearIndexedDB(storeName);
      } else {
        this.clearLocalStorage(storeName);
      }
    } catch (error) {
      console.error(`Failed to clear ${storeName}:`, error);
      throw error;
    }
  }

  // Get storage statistics
  async getStats(): Promise<StorageStats> {
    try {
      let usedSpace = 0;
      let itemCount = 0;

      if (this.db) {
        const stats = await this.getIndexedDBStats();
        usedSpace = stats.usedSpace;
        itemCount = stats.itemCount;
      } else {
        const stats = this.getLocalStorageStats();
        usedSpace = stats.usedSpace;
        itemCount = stats.itemCount;
      }

      return {
        usedSpace,
        totalSpace: (this.config.maxStorageSize || 100) * 1024 * 1024,
        itemCount,
        lastCleanup: this.getLastCleanupTime()
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        usedSpace: 0,
        totalSpace: 0,
        itemCount: 0,
        lastCleanup: 0
      };
    }
  }

  // Automatic data cleanup
  async cleanup(): Promise<void> {
    try {
      const cutoffDate = Date.now() - ((this.config.cleanupThreshold || 90) * 24 * 60 * 60 * 1000);
      
      for (const storeName of this.STORES) {
        const allData = await this.getAll(storeName);
        const dataToKeep = allData.filter((item: any) => {
          const timestamp = item.timestamp || item.createdAt || item.startTime;
          return timestamp && timestamp > cutoffDate;
        });

        // Clear and re-add kept data
        await this.clear(storeName);
        for (const item of dataToKeep) {
          await this.set(storeName, item);
        }
      }

      this.setLastCleanupTime(Date.now());
      console.log('Data cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup data:', error);
    }
  }

  // Create backup
  async createBackup(): Promise<string> {
    try {
      const backup: any = {};
      
      for (const storeName of this.STORES) {
        backup[storeName] = await this.getAll(storeName);
      }

      backup.metadata = {
        version: '1.0.0',
        timestamp: Date.now(),
        config: this.config
      };

      const backupString = JSON.stringify(backup, null, 2);
      const encryptedBackup = this.encrypt(backupString);
      
      return encryptedBackup;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  // Restore from backup
  async restoreBackup(backupData: string): Promise<void> {
    try {
      const decryptedBackup = this.decrypt(backupData);
      const backup = JSON.parse(decryptedBackup);

      // Clear existing data
      for (const storeName of this.STORES) {
        await this.clear(storeName);
      }

      // Restore data
      for (const [storeName, data] of Object.entries(backup)) {
        if (this.STORES.includes(storeName) && Array.isArray(data)) {
          for (const item of data) {
            await this.set(storeName, item);
          }
        }
      }

      console.log('Backup restored successfully');
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw error;
    }
  }

  // Data processing methods
  private async processDataForStorage<T>(data: T): Promise<any> {
    let processedData = { ...data };

    // Add metadata
    processedData = {
      ...processedData,
      _storedAt: Date.now(),
      _version: '1.0.0'
    };

    // Compress if enabled
    if (this.config.compressionEnabled) {
      processedData = this.compress(processedData);
    }

    // Encrypt
    processedData = this.encrypt(JSON.stringify(processedData));

    return processedData;
  }

  private async processDataFromStorage<T>(data: any): Promise<T | null> {
    try {
      // Decrypt
      let decryptedData = this.decrypt(data);
      
      // Parse JSON
      let parsedData = JSON.parse(decryptedData);

      // Decompress if needed
      if (this.config.compressionEnabled && parsedData._compressed) {
        parsedData = this.decompress(parsedData);
      }

      // Remove metadata
      const { _storedAt, _version, _compressed, ...cleanData } = parsedData;
      
      return cleanData as T;
    } catch (error) {
      console.error('Failed to process data from storage:', error);
      return null;
    }
  }

  // Encryption methods
  private encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.config.encryptionKey!).toString();
  }

  private decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.config.encryptionKey!);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // Compression methods
  private compress(data: any): any {
    // Simple compression by removing null/undefined values and shortening keys
    const compressed: any = { _compressed: true };
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        // Shorten common keys
        const shortKey = this.getShortKey(key);
        compressed[shortKey] = value;
      }
    });
    
    return compressed;
  }

  private decompress(data: any): any {
    const decompressed: any = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (key !== '_compressed') {
        const fullKey = this.getFullKey(key);
        decompressed[fullKey] = value;
      }
    });
    
    return decompressed;
  }

  private getShortKey(key: string): string {
    const keyMap: { [key: string]: string } = {
      'content': 'c',
      'timestamp': 't',
      'createdAt': 'ca',
      'updatedAt': 'ua',
      'status': 's',
      'priority': 'p',
      'energy': 'e',
      'type': 'ty',
      'description': 'd',
      'title': 'ti'
    };
    
    return keyMap[key] || key;
  }

  private getFullKey(shortKey: string): string {
    const reverseKeyMap: { [key: string]: string } = {
      'c': 'content',
      't': 'timestamp',
      'ca': 'createdAt',
      'ua': 'updatedAt',
      's': 'status',
      'p': 'priority',
      'e': 'energy',
      'ty': 'type',
      'd': 'description',
      'ti': 'title'
    };
    
    return reverseKeyMap[shortKey] || shortKey;
  }

  // IndexedDB methods
  private async setIndexedDB(storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getIndexedDB(storeName: string, id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllIndexedDB(storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteIndexedDB(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async clearIndexedDB(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getIndexedDBStats(): Promise<{ usedSpace: number; itemCount: number }> {
    let totalSize = 0;
    let totalCount = 0;

    for (const storeName of this.STORES) {
      const data = await this.getAllIndexedDB(storeName);
      totalCount += data.length;
      totalSize += JSON.stringify(data).length;
    }

    return { usedSpace: totalSize, itemCount: totalCount };
  }

  // localStorage methods (fallback)
  private setLocalStorage(storeName: string, data: any): void {
    const key = `nudgeme_${storeName}_${data.id}`;
    localStorage.setItem(key, JSON.stringify(data));
  }

  private getLocalStorage(storeName: string, id: string): any {
    const key = `nudgeme_${storeName}_${id}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  private getAllLocalStorage(storeName: string): any[] {
    const data: any[] = [];
    const prefix = `nudgeme_${storeName}_`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const item = localStorage.getItem(key);
        if (item) {
          data.push(JSON.parse(item));
        }
      }
    }
    
    return data;
  }

  private deleteLocalStorage(storeName: string, id: string): void {
    const key = `nudgeme_${storeName}_${id}`;
    localStorage.removeItem(key);
  }

  private clearLocalStorage(storeName: string): void {
    const prefix = `nudgeme_${storeName}_`;
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  private getLocalStorageStats(): { usedSpace: number; itemCount: number } {
    let totalSize = 0;
    let totalCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('nudgeme_')) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
          totalCount++;
        }
      }
    }
    
    return { usedSpace: totalSize, itemCount: totalCount };
  }

  // Utility methods
  private getLastCleanupTime(): number {
    return parseInt(localStorage.getItem('nudgeme_last_cleanup') || '0');
  }

  private setLastCleanupTime(timestamp: number): void {
    localStorage.setItem('nudgeme_last_cleanup', timestamp.toString());
  }
}

// Create and export singleton instance
export const storage = new AdvancedStorage();

// Export types and utilities
export { AdvancedStorage };
export type { StorageConfig, StorageStats }; 