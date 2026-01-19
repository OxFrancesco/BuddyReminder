import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useSync } from '@/hooks/use-sync';
import { useDatabaseReady } from '@/db/provider';
import { restorePinnedNotifications } from '@/lib/notification-manager';

interface SyncContextType {
  isSyncing: boolean;
  isOnline: boolean;
  lastSyncAt: number | null;
  pendingCount: number;
  lastError: string | null;
  syncNow: () => Promise<unknown>;
}

const SyncContext = createContext<SyncContextType>({
  isSyncing: false,
  isOnline: true,
  lastSyncAt: null,
  pendingCount: 0,
  lastError: null,
  syncNow: async () => null,
});

export function useSyncStatus() {
  return useContext(SyncContext);
}

interface SyncProviderProps {
  children: ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  const { userId, isSignedIn } = useAuth();
  const isDbReady = useDatabaseReady();
  const syncState = useSync();

  // Restore pinned notifications on startup
  useEffect(() => {
    if (isDbReady && isSignedIn && userId) {
      restorePinnedNotifications(userId);
    }
  }, [isDbReady, isSignedIn, userId]);

  return (
    <SyncContext.Provider value={syncState}>
      {children}
    </SyncContext.Provider>
  );
}
