import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CardType = 'note' | 'reminder' | 'task';

export interface CardCustomization {
  icon: string;
  color: string;
}

export interface CardCustomizations {
  note: CardCustomization;
  reminder: CardCustomization;
  task: CardCustomization;
}

const DEFAULT_CUSTOMIZATIONS: CardCustomizations = {
  note: { icon: 'doc.text', color: '#3b82f6' },
  reminder: { icon: 'bell', color: '#8b5cf6' },
  task: { icon: 'cpu', color: '#10b981' },
};

const STORAGE_KEY = '@card_customizations';

// Global listeners for customization changes
const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

export function useCardCustomization() {
  const [customizations, setCustomizations] = useState<CardCustomizations>(DEFAULT_CUSTOMIZATIONS);
  const [isLoading, setIsLoading] = useState(true);

  const loadCustomizations = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCustomizations(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load card customizations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomizations();
    listeners.add(loadCustomizations);
    return () => {
      listeners.delete(loadCustomizations);
    };
  }, [loadCustomizations]);

  const updateCustomization = async (type: CardType, customization: CardCustomization) => {
    try {
      const updated = { ...customizations, [type]: customization };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setCustomizations(updated);
      notifyListeners();
    } catch (error) {
      console.error('Failed to save card customization:', error);
    }
  };

  const resetToDefaults = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setCustomizations(DEFAULT_CUSTOMIZATIONS);
      notifyListeners();
    } catch (error) {
      console.error('Failed to reset customizations:', error);
    }
  };

  return {
    customizations,
    updateCustomization,
    resetToDefaults,
    isLoading,
  };
}
