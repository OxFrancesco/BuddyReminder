import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getDatabase, closeDatabase } from './database';
import { logger } from '@/lib/logger';

interface DatabaseContextType {
  isReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextType>({ isReady: false });

export function useDatabaseReady(): boolean {
  return useContext(DatabaseContext).isReady;
}

interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await getDatabase();
        if (mounted) {
          setIsReady(true);
        }
      } catch (error) {
        logger.error('Failed to initialize database:', error);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DatabaseContext.Provider value={{ isReady }}>
      {children}
    </DatabaseContext.Provider>
  );
}
