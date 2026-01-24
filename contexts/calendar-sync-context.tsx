import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type CalendarSyncContextType = {
  calendarSyncEnabled: boolean;
  setCalendarSyncEnabled: (enabled: boolean) => void;
};

const CalendarSyncContext = createContext<CalendarSyncContextType | undefined>(undefined);

export function CalendarSyncProvider({ children }: { children: ReactNode }) {
  const [calendarSyncEnabled, setCalendarSyncEnabledState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('calendarSyncEnabled').then((value) => {
      if (value !== null) {
        setCalendarSyncEnabledState(value === 'true');
      }
    });
  }, []);

  const setCalendarSyncEnabled = (enabled: boolean) => {
    setCalendarSyncEnabledState(enabled);
    AsyncStorage.setItem('calendarSyncEnabled', enabled.toString());
  };

  return (
    <CalendarSyncContext.Provider value={{ calendarSyncEnabled, setCalendarSyncEnabled }}>
      {children}
    </CalendarSyncContext.Provider>
  );
}

export function useCalendarSync() {
  const context = useContext(CalendarSyncContext);
  if (!context) {
    throw new Error('useCalendarSync must be used within CalendarSyncProvider');
  }
  return context;
}
