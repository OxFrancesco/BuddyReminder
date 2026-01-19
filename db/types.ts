// Local database types - mirrors Convex schema with sync metadata

export type ItemType = 'note' | 'reminder' | 'task';
export type ItemStatus = 'open' | 'done' | 'archived';
export type SyncStatus = 'pending' | 'synced' | 'conflict';

export interface SnoozeState {
  snoozedUntil: number;
  snoozeCount: number;
}

export interface TaskSpec {
  goal: string;
  inputs?: string[];
  constraints?: string[];
  allowedTools?: string[];
  workspacePointers?: string[];
}

export interface LocalItem {
  id: string; // Local UUID
  convexId: string | null; // Convex _id after sync
  clerkUserId: string;
  type: ItemType;
  title: string;
  body: string | null;
  status: ItemStatus;
  isPinned: boolean;
  isDailyHighlight: boolean;
  triggerAt: number | null;
  timezone: string | null;
  repeatRule: string | null;
  snoozeState: SnoozeState | null;
  taskSpec: TaskSpec | null;
  executionPolicy: 'manual' | 'auto' | null;
  notificationId: string | null;
  syncStatus: SyncStatus;
  createdAt: number;
  updatedAt: number;
  syncedAt: number | null;
  deletedAt: number | null; // Soft delete for sync
}

export interface CreateItemInput {
  clerkUserId: string;
  type: ItemType;
  title: string;
  body?: string;
  isPinned?: boolean;
  isDailyHighlight?: boolean;
  triggerAt?: number;
  timezone?: string;
  repeatRule?: string;
  taskSpec?: TaskSpec;
  executionPolicy?: 'manual' | 'auto';
}

export interface UpdateItemInput {
  title?: string;
  body?: string;
  status?: ItemStatus;
  isPinned?: boolean;
  isDailyHighlight?: boolean;
  triggerAt?: number;
  snoozeState?: SnoozeState | null;
  notificationId?: string | null;
}

// For sync operations
export interface SyncChange {
  localId: string;
  convexId: string | null;
  operation: 'create' | 'update' | 'delete';
  data: Partial<LocalItem>;
  timestamp: number;
}
