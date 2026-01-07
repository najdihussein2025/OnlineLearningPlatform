import api from './api';

/**
 * Offline Video Service
 * Handles downloading, storing, and syncing offline video progress
 */

const DB_NAME = 'OfflineLearningDB';
const DB_VERSION = 1;
const STORE_VIDEOS = 'videos';
const STORE_PROGRESS = 'progress';
const STORE_COMPLETIONS = 'completions';
const STORE_SYNC_QUEUE = 'syncQueue';

let db = null;

/**
 * Initialize IndexedDB
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Videos store: stores downloaded video blobs
      if (!database.objectStoreNames.contains(STORE_VIDEOS)) {
        const videoStore = database.createObjectStore(STORE_VIDEOS, { keyPath: 'lessonId' });
        videoStore.createIndex('lessonId', 'lessonId', { unique: true });
        videoStore.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        videoStore.createIndex('expiresAt', 'expiresAt', { unique: false });
      }

      // Progress store: stores offline video progress
      if (!database.objectStoreNames.contains(STORE_PROGRESS)) {
        const progressStore = database.createObjectStore(STORE_PROGRESS, { keyPath: 'lessonId' });
        progressStore.createIndex('lessonId', 'lessonId', { unique: true });
        progressStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
      }

      // Completions store: stores offline lesson completions
      if (!database.objectStoreNames.contains(STORE_COMPLETIONS)) {
        const completionStore = database.createObjectStore(STORE_COMPLETIONS, { keyPath: 'lessonId' });
        completionStore.createIndex('lessonId', 'lessonId', { unique: true });
        completionStore.createIndex('completedAt', 'completedAt', { unique: false });
      }

      // Sync queue store: stores items waiting to be synced
      if (!database.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
        const syncStore = database.createObjectStore(STORE_SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('type', 'type', { unique: false });
        syncStore.createIndex('lessonId', 'lessonId', { unique: false });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

/**
 * Get device ID (simple fingerprint)
 */
const getDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    // Simple device fingerprint
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    deviceId = btoa(canvas.toDataURL() + navigator.userAgent + window.screen.width + window.screen.height);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

/**
 * Check if video is downloaded
 */
export const isVideoDownloaded = async (lessonId) => {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_VIDEOS], 'readonly');
    const store = transaction.objectStore(STORE_VIDEOS);
    const request = store.get(lessonId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const video = request.result;
        if (!video) {
          resolve(false);
          return;
        }
        // Check if expired
        if (video.expiresAt && new Date(video.expiresAt) < new Date()) {
          resolve(false);
          return;
        }
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error checking if video is downloaded:', error);
    return false;
  }
};

/**
 * Get downloaded video URL (blob URL)
 */
export const getDownloadedVideoUrl = async (lessonId) => {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_VIDEOS], 'readonly');
    const store = transaction.objectStore(STORE_VIDEOS);
    const request = store.get(lessonId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const video = request.result;
        if (!video || !video.blob) {
          resolve(null);
          return;
        }
        // Check if expired
        if (video.expiresAt && new Date(video.expiresAt) < new Date()) {
          resolve(null);
          return;
        }
        // Create blob URL
        const blobUrl = URL.createObjectURL(video.blob);
        resolve(blobUrl);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting downloaded video URL:', error);
    return null;
  }
};

/**
 * Download video for offline viewing
 */
export const downloadVideo = async (lessonId, onProgress) => {
  try {
    // Get download authorization from backend
    const deviceId = getDeviceId();
    const response = await api.get(`/student/lessons/${lessonId}/download-url`, {
      params: { deviceId }
    });

    const { downloadUrl, expiresAt } = response.data;

    // Download the video
    // Note: The downloadUrl from backend includes the token, so we use it directly
    // If the video is on a different domain, we may need CORS headers
    const videoResponse = await fetch(downloadUrl);

    if (!videoResponse.ok) {
      throw new Error('Failed to download video');
    }

    const contentLength = videoResponse.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    const reader = videoResponse.body.getReader();
    const chunks = [];
    let receivedLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedLength += value.length;

      if (onProgress && total > 0) {
        onProgress((receivedLength / total) * 100);
      }
    }

    // Combine chunks into blob
    const blob = new Blob(chunks, { type: 'video/mp4' });

    // Store in IndexedDB
    const database = await initDB();
    const transaction = database.transaction([STORE_VIDEOS], 'readwrite');
    const store = transaction.objectStore(STORE_VIDEOS);

    const videoData = {
      lessonId,
      blob,
      downloadedAt: new Date().toISOString(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null
    };

    await new Promise((resolve, reject) => {
      const request = store.put(videoData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return true;
  } catch (error) {
    console.error('Error downloading video:', error);
    throw error;
  }
};

/**
 * Delete downloaded video
 */
export const deleteDownloadedVideo = async (lessonId) => {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_VIDEOS], 'readwrite');
    const store = transaction.objectStore(STORE_VIDEOS);
    
    // Get existing video to revoke blob URL
    const getRequest = store.get(lessonId);
    await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const video = getRequest.result;
        if (video && video.blobUrl) {
          URL.revokeObjectURL(video.blobUrl);
        }
        resolve();
      };
      getRequest.onerror = () => reject(getRequest.error);
    });

    // Delete from store
    await new Promise((resolve, reject) => {
      const request = store.delete(lessonId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return true;
  } catch (error) {
    console.error('Error deleting downloaded video:', error);
    throw error;
  }
};

/**
 * Save offline video progress
 */
export const saveOfflineProgress = async (lessonId, lastWatchedSeconds) => {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_PROGRESS], 'readwrite');
    const store = transaction.objectStore(STORE_PROGRESS);

    const progressData = {
      lessonId,
      lastWatchedSeconds: Math.floor(lastWatchedSeconds),
      lastUpdated: new Date().toISOString()
    };

    await new Promise((resolve, reject) => {
      const request = store.put(progressData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Add to sync queue
    await addToSyncQueue('progress', {
      lessonId,
      lastWatchedSeconds: Math.floor(lastWatchedSeconds),
      watchedAt: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error saving offline progress:', error);
    throw error;
  }
};

/**
 * Get offline video progress
 */
export const getOfflineProgress = async (lessonId) => {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_PROGRESS], 'readonly');
    const store = transaction.objectStore(STORE_PROGRESS);
    const request = store.get(lessonId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const progress = request.result;
        resolve(progress ? progress.lastWatchedSeconds : 0);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting offline progress:', error);
    return 0;
  }
};

/**
 * Save offline lesson completion
 */
export const saveOfflineCompletion = async (lessonId) => {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_COMPLETIONS], 'readwrite');
    const store = transaction.objectStore(STORE_COMPLETIONS);

    const completionData = {
      lessonId,
      completedAt: new Date().toISOString()
    };

    await new Promise((resolve, reject) => {
      const request = store.put(completionData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Add to sync queue
    await addToSyncQueue('completion', { lessonId });

    return true;
  } catch (error) {
    console.error('Error saving offline completion:', error);
    throw error;
  }
};

/**
 * Check if lesson is completed offline
 */
export const isOfflineCompleted = async (lessonId) => {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_COMPLETIONS], 'readonly');
    const store = transaction.objectStore(STORE_COMPLETIONS);
    const request = store.get(lessonId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(!!request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error checking offline completion:', error);
    return false;
  }
};

/**
 * Add item to sync queue
 */
const addToSyncQueue = async (type, data) => {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORE_SYNC_QUEUE);

    const queueItem = {
      type,
      data,
      timestamp: new Date().toISOString(),
      synced: false
    };

    await new Promise((resolve, reject) => {
      const request = store.add(queueItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error adding to sync queue:', error);
  }
};

/**
 * Sync offline progress and completions with backend
 */
export const syncOfflineData = async () => {
  if (!navigator.onLine) {
    return { synced: false, reason: 'offline' };
  }

  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_SYNC_QUEUE, STORE_PROGRESS, STORE_COMPLETIONS], 'readwrite');
    const syncQueueStore = transaction.objectStore(STORE_SYNC_QUEUE);
    const progressStore = transaction.objectStore(STORE_PROGRESS);
    const completionStore = transaction.objectStore(STORE_COMPLETIONS);

    // Get all unsynced items
    const unsyncedItems = await new Promise((resolve, reject) => {
      const request = syncQueueStore.index('timestamp').getAll();
      request.onsuccess = () => {
        const items = request.result.filter(item => !item.synced);
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });

    if (unsyncedItems.length === 0) {
      return { synced: true, syncedCount: 0 };
    }

    // Group by type
    const progressUpdates = [];
    const completedLessonIds = [];

    for (const item of unsyncedItems) {
      if (item.type === 'progress') {
        progressUpdates.push({
          lessonId: item.data.lessonId,
          lastWatchedSeconds: item.data.lastWatchedSeconds,
          watchedAt: item.data.watchedAt
        });
      } else if (item.type === 'completion') {
        completedLessonIds.push(item.data.lessonId);
      }
    }

    // Sync with backend
    const response = await api.post('/student/lessons/offline-progress/sync', {
      progressUpdates,
      completedLessonIds
    });

    const { syncedProgressCount, syncedCompletionCount, failedLessonIds } = response.data;

    // Mark synced items as synced
    for (const item of unsyncedItems) {
      if (!failedLessonIds.includes(item.data.lessonId)) {
        item.synced = true;
        await new Promise((resolve, reject) => {
          const updateRequest = syncQueueStore.put(item);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        });
      }
    }

    // Clean up old synced items (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const allItems = await new Promise((resolve, reject) => {
      const request = syncQueueStore.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    for (const item of allItems) {
      if (item.synced && new Date(item.timestamp) < sevenDaysAgo) {
        await new Promise((resolve, reject) => {
          const deleteRequest = syncQueueStore.delete(item.id);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(deleteRequest.error);
        });
      }
    }

    return {
      synced: true,
      syncedProgressCount,
      syncedCompletionCount,
      failedLessonIds
    };
  } catch (error) {
    console.error('Error syncing offline data:', error);
    return { synced: false, error: error.message };
  }
};

/**
 * Check online/offline status
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Setup online/offline listeners
 */
export const setupOnlineListener = (onOnline, onOffline) => {
  window.addEventListener('online', () => {
    if (onOnline) onOnline();
    // Auto-sync when coming online
    syncOfflineData().catch(err => console.error('Auto-sync failed:', err));
  });

  window.addEventListener('offline', () => {
    if (onOffline) onOffline();
  });
};

