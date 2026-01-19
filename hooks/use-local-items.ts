import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useDatabaseReady } from '@/db/provider';
import {
  getItemsByUser,
  getItemById,
  subscribeToItemChanges,
  createItem as repoCreateItem,
  updateItem as repoUpdateItem,
  deleteItem as repoDeleteItem,
  updateItemStatus as repoUpdateItemStatus,
  toggleItemPin as repoToggleItemPin,
  toggleItemDailyHighlight as repoToggleItemDailyHighlight,
  setNotificationId as repoSetNotificationId,
} from '@/db/items-repository';
import { LocalItem, CreateItemInput, UpdateItemInput, ItemType, ItemStatus } from '@/db/types';

// Hook to get all items for current user
export function useLocalItems(options?: {
  type?: ItemType;
  status?: ItemStatus;
  includeArchived?: boolean;
}): {
  items: LocalItem[];
  isLoading: boolean;
  refetch: () => Promise<void>;
} {
  const { userId } = useAuth();
  const isDbReady = useDatabaseReady();
  const [items, setItems] = useState<LocalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!userId || !isDbReady) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    try {
      const result = await getItemsByUser(userId, options);
      setItems(result);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isDbReady, options?.type, options?.status, options?.includeArchived]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Subscribe to changes
  useEffect(() => {
    const unsubscribe = subscribeToItemChanges(() => {
      fetchItems();
    });
    return unsubscribe;
  }, [fetchItems]);

  return { items, isLoading, refetch: fetchItems };
}

// Hook to get a single item by ID
export function useLocalItem(itemId: string | null): {
  item: LocalItem | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
} {
  const isDbReady = useDatabaseReady();
  const [item, setItem] = useState<LocalItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItem = useCallback(async () => {
    if (!itemId || !isDbReady) {
      setItem(null);
      setIsLoading(false);
      return;
    }

    try {
      const result = await getItemById(itemId);
      setItem(result);
    } catch (error) {
      console.error('Failed to fetch item:', error);
    } finally {
      setIsLoading(false);
    }
  }, [itemId, isDbReady]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  // Subscribe to changes
  useEffect(() => {
    const unsubscribe = subscribeToItemChanges(() => {
      fetchItem();
    });
    return unsubscribe;
  }, [fetchItem]);

  return { item, isLoading, refetch: fetchItem };
}

// Hook for item mutations
export function useLocalItemMutations() {
  const { userId } = useAuth();

  const createItem = useCallback(
    async (input: Omit<CreateItemInput, 'clerkUserId'>): Promise<LocalItem> => {
      if (!userId) throw new Error('Not authenticated');
      return repoCreateItem({ ...input, clerkUserId: userId });
    },
    [userId]
  );

  const updateItem = useCallback(
    async (itemId: string, updates: UpdateItemInput): Promise<LocalItem | null> => {
      return repoUpdateItem(itemId, updates);
    },
    []
  );

  const deleteItem = useCallback(async (itemId: string): Promise<void> => {
    return repoDeleteItem(itemId);
  }, []);

  const updateItemStatus = useCallback(
    async (itemId: string, status: ItemStatus): Promise<LocalItem | null> => {
      return repoUpdateItemStatus(itemId, status);
    },
    []
  );

  const toggleItemPin = useCallback(
    async (itemId: string, isPinned: boolean): Promise<LocalItem | null> => {
      return repoToggleItemPin(itemId, isPinned);
    },
    []
  );

  const toggleItemDailyHighlight = useCallback(
    async (itemId: string, isDailyHighlight: boolean): Promise<LocalItem | null> => {
      return repoToggleItemDailyHighlight(itemId, isDailyHighlight);
    },
    []
  );

  const setNotificationId = useCallback(
    async (itemId: string, notificationId: string | null): Promise<void> => {
      return repoSetNotificationId(itemId, notificationId);
    },
    []
  );

  return {
    createItem,
    updateItem,
    deleteItem,
    updateItemStatus,
    toggleItemPin,
    toggleItemDailyHighlight,
    setNotificationId,
  };
}
