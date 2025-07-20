// Cloud Sync Infrastructure for NudgeMe
import { storage } from './storage';

export interface SyncConfig {
  provider: 'firebase' | 'supabase' | 'custom';
  apiKey?: string;
  projectId?: string;
  endpoint?: string;
  syncInterval?: number; // minutes
  autoSync?: boolean;
  conflictResolution?: 'local' | 'remote' | 'manual' | 'timestamp';
  maxRetries?: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: number;
  pendingChanges: number;
  syncInProgress: boolean;
  error?: string;
}

export interface SyncConflict {
  id: string;
  storeName: string;
  localData: any;
  remoteData: any;
  localTimestamp: number;
  remoteTimestamp: number;
}

class CloudSync {
  private config: SyncConfig;
  private syncStatus: SyncStatus;
  private offlineQueue: Array<{
    id: string;
    action: 'create' | 'update' | 'delete';
    storeName: string;
    data?: any;
    timestamp: number;
  }> = [];
  private syncInterval?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(config: SyncConfig) {
    this.config = {
      syncInterval: 5, // 5 minutes
      autoSync: true,
      conflictResolution: 'timestamp',
      maxRetries: 3,
      ...config
    };

    this.syncStatus = {
      isOnline: navigator.onLine,
      lastSync: 0,
      pendingChanges: 0,
      syncInProgress: false
    };

    this.setupNetworkListeners();
  }

  // Initialize cloud sync
  async initialize(): Promise<void> {
    try {
      if (this.config.provider === 'firebase') {
        await this.initializeFirebase();
      } else if (this.config.provider === 'supabase') {
        await this.initializeSupabase();
      }

      this.isInitialized = true;
      
      if (this.config.autoSync) {
        this.startAutoSync();
      }

      // Process offline queue
      await this.processOfflineQueue();
      
      console.log('Cloud sync initialized successfully');
    } catch (error) {
      console.error('Failed to initialize cloud sync:', error);
      throw error;
    }
  }

  // Initialize Firebase
  private async initializeFirebase(): Promise<void> {
    if (!this.config.apiKey || !this.config.projectId) {
      throw new Error('Firebase configuration missing');
    }

    // Initialize Firebase (you would need to add firebase SDK)
    // const firebaseConfig = {
    //   apiKey: this.config.apiKey,
    //   projectId: this.config.projectId,
    //   // ... other config
    // };
    // firebase.initializeApp(firebaseConfig);
    
    console.log('Firebase initialized');
  }

  // Initialize Supabase
  private async initializeSupabase(): Promise<void> {
    if (!this.config.apiKey || !this.config.endpoint) {
      throw new Error('Supabase configuration missing');
    }

    // Initialize Supabase (you would need to add supabase SDK)
    // const supabase = createClient(this.config.endpoint, this.config.apiKey);
    
    console.log('Supabase initialized');
  }

  // Setup network listeners
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true;
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false;
    });
  }

  // Start automatic sync
  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.syncStatus.isOnline && !this.syncStatus.syncInProgress) {
        this.sync();
      }
    }, (this.config.syncInterval || 5) * 60 * 1000);
  }

  // Stop automatic sync
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
  }

  // Manual sync
  async sync(): Promise<void> {
    if (this.syncStatus.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    if (!this.isInitialized) {
      console.log('Cloud sync not initialized');
      return;
    }

    this.syncStatus.syncInProgress = true;
    this.syncStatus.error = undefined;

    try {
      // Sync local changes to cloud
      await this.syncToCloud();
      
      // Sync cloud changes to local
      await this.syncFromCloud();
      
      this.syncStatus.lastSync = Date.now();
      this.syncStatus.pendingChanges = this.offlineQueue.length;
      
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      this.syncStatus.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      this.syncStatus.syncInProgress = false;
    }
  }

  // Sync local changes to cloud
  private async syncToCloud(): Promise<void> {
    const stores = [
      'tasks', 'focusSessions', 'moods', 'sensoryCheckins',
      'socialEntries', 'distractions', 'goals', 'achievements',
      'challenges', 'priorityMatrices', 'reminders', 'integrations'
    ];

    for (const storeName of stores) {
      const localData = await storage.getAll(storeName);
      
      for (const item of localData) {
        try {
          await this.uploadToCloud(storeName, item);
        } catch (error) {
          console.error(`Failed to sync ${storeName}/${item.id}:`, error);
          this.addToOfflineQueue('update', storeName, item);
        }
      }
    }

    // Process offline queue
    await this.processOfflineQueue();
  }

  // Sync cloud changes to local
  private async syncFromCloud(): Promise<void> {
    const stores = [
      'tasks', 'focusSessions', 'moods', 'sensoryCheckins',
      'socialEntries', 'distractions', 'goals', 'achievements',
      'challenges', 'priorityMatrices', 'reminders', 'integrations'
    ];

    for (const storeName of stores) {
      try {
        const cloudData = await this.downloadFromCloud(storeName);
        
        for (const item of cloudData) {
          const localItem = await storage.get(storeName, item.id);
          
          if (!localItem) {
            // New item from cloud
            await storage.set(storeName, item);
          } else {
            // Check for conflicts
            const conflict = this.detectConflict(localItem, item);
            if (conflict) {
              await this.resolveConflict(conflict);
            } else {
              // Update local with cloud data
              await storage.set(storeName, item);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to sync ${storeName} from cloud:`, error);
      }
    }
  }

  // Upload data to cloud
  private async uploadToCloud(storeName: string, data: any): Promise<void> {
    if (this.config.provider === 'firebase') {
      return this.uploadToFirebase(storeName, data);
    } else if (this.config.provider === 'supabase') {
      return this.uploadToSupabase(storeName, data);
    } else {
      return this.uploadToCustom(storeName, data);
    }
  }

  // Download data from cloud
  private async downloadFromCloud(storeName: string): Promise<any[]> {
    if (this.config.provider === 'firebase') {
      return this.downloadFromFirebase(storeName);
    } else if (this.config.provider === 'supabase') {
      return this.downloadFromSupabase(storeName);
    } else {
      return this.downloadFromCustom(storeName);
    }
  }

  // Firebase upload
  private async uploadToFirebase(storeName: string, data: any): Promise<void> {
    // Implementation would use Firebase SDK
    // await firebase.firestore().collection(storeName).doc(data.id).set(data);
    console.log(`Uploading to Firebase: ${storeName}/${data.id}`);
  }

  // Firebase download
  private async downloadFromFirebase(storeName: string): Promise<any[]> {
    // Implementation would use Firebase SDK
    // const snapshot = await firebase.firestore().collection(storeName).get();
    // return snapshot.docs.map(doc => doc.data());
    console.log(`Downloading from Firebase: ${storeName}`);
    return [];
  }

  // Supabase upload
  private async uploadToSupabase(storeName: string, data: any): Promise<void> {
    // Implementation would use Supabase SDK
    // await supabase.from(storeName).upsert(data);
    console.log(`Uploading to Supabase: ${storeName}/${data.id}`);
  }

  // Supabase download
  private async downloadFromSupabase(storeName: string): Promise<any[]> {
    // Implementation would use Supabase SDK
    // const { data, error } = await supabase.from(storeName).select('*');
    // return data || [];
    console.log(`Downloading from Supabase: ${storeName}`);
    return [];
  }

  // Custom API upload
  private async uploadToCustom(storeName: string, data: any): Promise<void> {
    if (!this.config.endpoint) {
      throw new Error('Custom endpoint not configured');
    }

    const response = await fetch(`${this.config.endpoint}/${storeName}/${data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
  }

  // Custom API download
  private async downloadFromCustom(storeName: string): Promise<any[]> {
    if (!this.config.endpoint) {
      throw new Error('Custom endpoint not configured');
    }

    const response = await fetch(`${this.config.endpoint}/${storeName}`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Detect conflicts between local and remote data
  private detectConflict(localData: any, remoteData: any): SyncConflict | null {
    const localTimestamp = localData.updatedAt || localData.timestamp || localData.createdAt || 0;
    const remoteTimestamp = remoteData.updatedAt || remoteData.timestamp || remoteData.createdAt || 0;

    // If timestamps are different, there's a conflict
    if (Math.abs(localTimestamp - remoteTimestamp) > 1000) { // 1 second threshold
      return {
        id: localData.id,
        storeName: '', // Will be set by caller
        localData,
        remoteData,
        localTimestamp,
        remoteTimestamp
      };
    }

    return null;
  }

  // Resolve conflicts based on strategy
  private async resolveConflict(conflict: SyncConflict): Promise<void> {
    switch (this.config.conflictResolution) {
      case 'local':
        // Keep local data
        console.log(`Resolving conflict for ${conflict.id}: keeping local data`);
        break;

      case 'remote':
        // Keep remote data
        await storage.set(conflict.storeName, conflict.remoteData);
        console.log(`Resolving conflict for ${conflict.id}: keeping remote data`);
        break;

      case 'timestamp':
        // Keep newer data
        const keepLocal = conflict.localTimestamp > conflict.remoteTimestamp;
        if (!keepLocal) {
          await storage.set(conflict.storeName, conflict.remoteData);
        }
        console.log(`Resolving conflict for ${conflict.id}: keeping ${keepLocal ? 'local' : 'remote'} data`);
        break;

      case 'manual':
        // Store conflict for manual resolution
        await this.storeConflict(conflict);
        console.log(`Storing conflict for ${conflict.id} for manual resolution`);
        break;
    }
  }

  // Store conflict for manual resolution
  private async storeConflict(conflict: SyncConflict): Promise<void> {
    const conflicts = await storage.getAll('conflicts') || [];
    conflicts.push({
      ...conflict,
      createdAt: Date.now(),
      resolved: false
    });
    await storage.set('conflicts', conflicts);
  }

  // Add item to offline queue
  private addToOfflineQueue(action: 'create' | 'update' | 'delete', storeName: string, data?: any): void {
    this.offlineQueue.push({
      id: Date.now().toString(),
      action,
      storeName,
      data,
      timestamp: Date.now()
    });

    this.syncStatus.pendingChanges = this.offlineQueue.length;
    this.saveOfflineQueue();
  }

  // Process offline queue
  private async processOfflineQueue(): Promise<void> {
    if (!this.syncStatus.isOnline || this.offlineQueue.length === 0) {
      return;
    }

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const item of queue) {
      try {
        if (item.action === 'delete') {
          await this.deleteFromCloud(item.storeName, item.id);
        } else {
          await this.uploadToCloud(item.storeName, item.data);
        }
      } catch (error) {
        console.error('Failed to process offline queue item:', error);
        this.offlineQueue.push(item);
      }
    }

    this.syncStatus.pendingChanges = this.offlineQueue.length;
    this.saveOfflineQueue();
  }

  // Delete from cloud
  private async deleteFromCloud(storeName: string, id: string): Promise<void> {
    if (this.config.provider === 'firebase') {
      // await firebase.firestore().collection(storeName).doc(id).delete();
    } else if (this.config.provider === 'supabase') {
      // await supabase.from(storeName).delete().eq('id', id);
    } else {
      const response = await fetch(`${this.config.endpoint}/${storeName}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }
    }
  }

  // Save offline queue to storage
  private saveOfflineQueue(): void {
    localStorage.setItem('nudgeme_offline_queue', JSON.stringify(this.offlineQueue));
  }

  // Load offline queue from storage
  private loadOfflineQueue(): void {
    const saved = localStorage.getItem('nudgeme_offline_queue');
    if (saved) {
      this.offlineQueue = JSON.parse(saved);
      this.syncStatus.pendingChanges = this.offlineQueue.length;
    }
  }

  // Get sync status
  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Get pending conflicts
  async getConflicts(): Promise<SyncConflict[]> {
    const conflicts = await storage.getAll('conflicts') || [];
    return conflicts.filter((c: any) => !c.resolved);
  }

  // Resolve conflict manually
  async resolveConflictManually(conflictId: string, resolution: 'local' | 'remote' | 'merge'): Promise<void> {
    const conflicts = await storage.getAll('conflicts') || [];
    const conflict = conflicts.find((c: any) => c.id === conflictId);
    
    if (!conflict) {
      throw new Error('Conflict not found');
    }

    switch (resolution) {
      case 'local':
        // Keep local data, no action needed
        break;
      case 'remote':
        await storage.set(conflict.storeName, conflict.remoteData);
        break;
      case 'merge':
        const mergedData = this.mergeData(conflict.localData, conflict.remoteData);
        await storage.set(conflict.storeName, mergedData);
        break;
    }

    // Mark conflict as resolved
    const updatedConflicts = conflicts.map((c: any) => 
      c.id === conflictId ? { ...c, resolved: true, resolvedAt: Date.now() } : c
    );
    await storage.set('conflicts', updatedConflicts);
  }

  // Merge local and remote data
  private mergeData(localData: any, remoteData: any): any {
    // Simple merge strategy - combine arrays, keep newer timestamps
    const merged = { ...localData };
    
    Object.keys(remoteData).forEach(key => {
      if (Array.isArray(remoteData[key])) {
        merged[key] = [...(merged[key] || []), ...remoteData[key]];
      } else if (typeof remoteData[key] === 'object' && remoteData[key] !== null) {
        merged[key] = { ...(merged[key] || {}), ...remoteData[key] };
      } else {
        const localTimestamp = merged[key + 'At'] || merged[key + 'Timestamp'] || 0;
        const remoteTimestamp = remoteData[key + 'At'] || remoteData[key + 'Timestamp'] || 0;
        
        if (remoteTimestamp > localTimestamp) {
          merged[key] = remoteData[key];
        }
      }
    });

    return merged;
  }

  // Force sync
  async forceSync(): Promise<void> {
    this.stopAutoSync();
    await this.sync();
    if (this.config.autoSync) {
      this.startAutoSync();
    }
  }

  // Disconnect from cloud
  disconnect(): void {
    this.stopAutoSync();
    this.isInitialized = false;
    console.log('Disconnected from cloud sync');
  }
}

// Create and export singleton instance
export const cloudSync = new CloudSync({
  provider: 'custom',
  endpoint: process.env.REACT_APP_SYNC_ENDPOINT,
  apiKey: process.env.REACT_APP_SYNC_API_KEY
});

// Export types and utilities
export { CloudSync };
export type { SyncConfig, SyncStatus, SyncConflict }; 