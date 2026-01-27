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

export type AlarmDismissMethod = 'nfc' | 'code' | 'either';

export interface AlarmConfig {
  enabled: boolean;
  dismissMethod: AlarmDismissMethod;
  registeredNfcTagId?: string;
  dismissCode?: string;
  soundId?: string;
}

export interface NfcTag {
  id: string;
  convexId: string | null;
  clerkUserId: string;
  tagId: string;
  label: string;
  createdAt: number;
  syncStatus: SyncStatus;
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
  endAt: number | null;
  timezone: string | null;
  repeatRule: string | null;
  snoozeState: SnoozeState | null;
  alarmConfig: AlarmConfig | null;
  taskSpec: TaskSpec | null;
  executionPolicy: 'manual' | 'auto' | null;
  notificationId: string | null;
  googleCalendarEventId: string | null;
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
  endAt?: number;
  timezone?: string;
  repeatRule?: string;
  alarmConfig?: AlarmConfig;
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
  endAt?: number | null;
  snoozeState?: SnoozeState | null;
  alarmConfig?: AlarmConfig | null;
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
