# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BuddyReminder is a React Native mobile app (Expo) for notes, reminders, and AI-assisted tasks. It uses Convex for real-time backend, Clerk for authentication, and supports iOS, Android, and web.

## Commands

```bash
# Development (runs Convex + Expo iOS in parallel)
make dev

# Individual processes
bunx convex dev              # Convex local dev server
npx expo start --ios         # iOS simulator
npx expo start --android     # Android emulator
npx expo start --web         # Web browser

# Linting
npm run lint

# Deploy Convex to production
bunx convex deploy
```

## Architecture

### App Structure (Expo Router - file-based routing)
```
app/
├── _layout.tsx              # Root layout with providers
├── (tabs)/                  # Tab navigation group
│   ├── _layout.tsx          # Tab navigator config
│   ├── index.tsx            # Inbox/home screen
│   └── explore.tsx          # Profile screen
└── modal.tsx                # Item detail/edit modal
```

### Backend (Convex)
- **Schema**: `convex/schema.ts` defines all tables
- **Functions**: `convex/items.ts` (CRUD), `convex/users.ts` (sync)
- **Auth**: Clerk JWT integration via `convex/auth.config.ts`
- **Generated types**: `convex/_generated/` (auto-generated, don't edit)

### Key Tables
- `users`: Synced from Clerk (clerkId indexed)
- `items`: Polymorphic - notes/reminders/tasks with type-specific fields
- `agentRuns`: AI task execution tracking
- `attachments`: File/image/voice/link references

### Authentication Flow
1. Clerk handles sign-in (`components/auth-screen.tsx`)
2. `useUserSync` hook syncs Clerk user to Convex on auth changes
3. Token cached in expo-secure-store
4. `ConvexProviderWithClerk` wraps app for seamless auth

### State Management
- Convex queries provide real-time subscriptions (auto-refetch)
- `useQuery(api.items.getUserItems)` for reading
- `useMutation(api.items.createItem)` for writing

## Key Files

| File | Purpose |
|------|---------|
| `components/auth-provider.tsx` | Clerk + Convex setup |
| `components/items-list.tsx` | Main items display with filtering |
| `components/quick-capture-modal.tsx` | Item creation form |
| `hooks/use-user-sync.ts` | Syncs Clerk user to Convex |
| `lib/notifications.ts` | Expo notifications helpers |
| `constants/theme.ts` | iOS-style color palette |

## Convex Patterns

### Queries with auth
```typescript
export const getUserItems = query({
  args: { type: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    // ... query logic
  },
});
```

### Mutations with user verification
```typescript
export const createItem = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    // Verify user owns resource before mutations
  },
});
```

## Environment Variables

```env
EXPO_PUBLIC_CONVEX_URL=         # Convex deployment URL
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=  # Clerk public key
```

## TypeScript

- Strict mode enabled
- Path alias: `@/*` maps to root (`import { X } from "@/components/X"`)
- Convex generates types in `convex/_generated/` - use `api` object for type-safe function calls
