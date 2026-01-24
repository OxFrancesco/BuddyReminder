import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useConvex } from 'convex/react';
import { useAuth } from '@clerk/clerk-expo';
import { useDatabaseReady } from '@/db/provider';
import { useSyncSettings } from '@/contexts/sync-settings-context';
import { syncAll, SyncResult } from '@/sync/sync-engine';
import { subscribeToItemChanges, getPendingChanges } from '@/db/items-repository';
import { logger } from '@/lib/logger';

interface SyncState {
  isSyncing: boolean;
  isOnline: boolean;
  lastSyncAt: number | null;
  pendingCount: number;
  lastError: string | null;
}

const SYNC_INTERVAL = 30000; // 30 seconds
const SYNC_DEBOUNCE = 2000; // 2 seconds after change

export function useSync(): SyncState & {
  syncNow: () => Promise<SyncResult | null>;
} {
  const convex = useConvex();
  const { userId } = useAuth();
  const isDbReady = useDatabaseReady();
  const { isCloudSyncEnabled } = useSyncSettings();

  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    isOnline: true,
    lastSyncAt: null,
    pendingCount: 0,
    lastError: null,
  });

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const isOnlineRef = useRef(state.isOnline);
  const isSyncingRef = useRef(state.isSyncing);
  const userIdRef = useRef<string | null>(userId ?? null);
  const isDbReadyRef = useRef(isDbReady);

  useEffect(() => {
    isOnlineRef.current = state.isOnline;
  }, [state.isOnline]);

  useEffect(() => {
    isSyncingRef.current = state.isSyncing;
  }, [state.isSyncing]);

  useEffect(() => {
    userIdRef.current = userId ?? null;
  }, [userId]);

  useEffect(() => {
    isDbReadyRef.current = isDbReady;
  }, [isDbReady]);

  // Perform sync
  const performSync = useCallback(async (): Promise<SyncResult | null> => {
    const currentUserId = userIdRef.current;
    const currentIsDbReady = isDbReadyRef.current;
    const currentIsOnline = isOnlineRef.current;
    const currentIsSyncing = isSyncingRef.current;

    logger.debug('[useSync] performSync called', {
      userId: !!currentUserId,
      isDbReady: currentIsDbReady,
      isOnline: currentIsOnline,
      isSyncing: currentIsSyncing,
      cloudSyncEnabled: isCloudSyncEnabled,
    });
    
    // Skip sync if cloud sync is disabled
    if (!isCloudSyncEnabled) {
      logger.debug('[useSync] performSync skipped - cloud sync disabled');
      return null;
    }
    
    if (!currentUserId || !currentIsDbReady || !currentIsOnline || currentIsSyncing) {
      logger.debug('[useSync] performSync skipped - conditions not met');
      return null;
    }

    logger.debug('[useSync] Starting sync...');
    isSyncingRef.current = true;
    setState((prev) => ({ ...prev, isSyncing: true, lastError: null }));

    try {
      const result = await syncAll(convex, currentUserId);
      logger.debug('[useSync] Sync completed:', result);

      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncAt: Date.now(),
          lastError: result.errors.length > 0 ? result.errors[0] : null,
        }));
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          isSyncing: false,
          lastError: message,
        }));
      }
      return null;
    } finally {
      isSyncingRef.current = false;
    }
  }, [convex, isCloudSyncEnabled]);

  // Debounced sync on data change
  const scheduleDebouncedSync = useCallback(() => {
    if (!isCloudSyncEnabled) {
      return;
    }
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      performSync();
    }, SYNC_DEBOUNCE);
  }, [performSync, isCloudSyncEnabled]);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    if (!userId || !isDbReady) return;
    try {
      const pending = await getPendingChanges(userId);
      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, pendingCount: pending.length }));
      }
    } catch (error) {
      logger.error('Failed to get pending count:', error);
    }
  }, [userId, isDbReady]);

  // Listen to network state
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState: NetInfoState) => {
      const isOnline = Boolean(netState.isConnected && netState.isInternetReachable);

      setState((prev) => {
        // If coming online and was offline, trigger sync
        if (isOnline && !prev.isOnline && isCloudSyncEnabled) {
          setTimeout(() => performSync(), 1000);
        }
        return { ...prev, isOnline };
      });
    });

    return () => unsubscribe();
  }, [performSync, isCloudSyncEnabled]);

  // Listen to app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && state.isOnline && isCloudSyncEnabled) {
        // Sync when app becomes active
        performSync();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [performSync, state.isOnline, isCloudSyncEnabled]);

  // Subscribe to local data changes
  useEffect(() => {
    const unsubscribe = subscribeToItemChanges(() => {
      updatePendingCount();
      if (state.isOnline && isCloudSyncEnabled) {
        scheduleDebouncedSync();
      }
    });
    return unsubscribe;
  }, [scheduleDebouncedSync, updatePendingCount, state.isOnline, isCloudSyncEnabled]);

  // Periodic sync interval
  useEffect(() => {
    if (isCloudSyncEnabled && state.isOnline && userId && isDbReady) {
      intervalRef.current = setInterval(() => {
        performSync();
      }, SYNC_INTERVAL);

      // Initial sync
      performSync();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isOnline, userId, isDbReady, performSync, isCloudSyncEnabled]);

  // Initial pending count
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    syncNow: performSync,
  };
}

// Simple hook to just get online status
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable));
    });

    return () => unsubscribe();
  }, []);

  return isOnline;
}
