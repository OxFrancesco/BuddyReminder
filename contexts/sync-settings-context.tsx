import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SyncMode = 'cloud' | 'local';

interface SyncSettingsContextType {
  syncMode: SyncMode;
  setSyncMode: (mode: SyncMode) => void;
  isCloudSyncEnabled: boolean;
}

const SyncSettingsContext = createContext<SyncSettingsContextType | undefined>(undefined);

export function SyncSettingsProvider({ children }: { children: React.ReactNode }) {
  const [syncMode, setSyncModeState] = useState<SyncMode>('cloud');

  useEffect(() => {
    loadSyncPreference();
  }, []);

  const loadSyncPreference = async () => {
    try {
      const saved = await AsyncStorage.getItem('syncMode');
      if (saved && ['cloud', 'local'].includes(saved)) {
        setSyncModeState(saved as SyncMode);
      }
    } catch (error) {
      console.log('Error loading sync preference:', error);
    }
  };

  const setSyncMode = async (mode: SyncMode) => {
    try {
      await AsyncStorage.setItem('syncMode', mode);
      setSyncModeState(mode);
    } catch (error) {
      console.log('Error saving sync preference:', error);
    }
  };

  return (
    <SyncSettingsContext.Provider value={{ 
      syncMode, 
      setSyncMode,
      isCloudSyncEnabled: syncMode === 'cloud'
    }}>
      {children}
    </SyncSettingsContext.Provider>
  );
}

export function useSyncSettings() {
  const context = useContext(SyncSettingsContext);
  if (context === undefined) {
    throw new Error('useSyncSettings must be used within a SyncSettingsProvider');
  }
  return context;
}
