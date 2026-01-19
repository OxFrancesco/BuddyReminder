# Project Structure

## Directory Layout
```
BuddyReminder/
├── app/                          # Expo Router screens and navigation
│   ├── (tabs)/                   # Tab-based navigation screens
│   │   ├── index.tsx            # Home/Inbox screen
│   │   └── explore.tsx          # Explore/Settings screen
│   ├── _layout.tsx              # Root layout with theme provider
│   └── modal.tsx                # Modal screens (task details, etc.)
├── components/                   # Reusable UI components
│   ├── ui/                      # Base UI components
│   │   ├── collapsible.tsx      # Collapsible sections
│   │   └── icon-symbol.tsx      # Icon system
│   ├── capture/                 # Quick capture components
│   ├── reminders/               # Reminder-specific components
│   ├── tasks/                   # Agent task components
│   └── themed-*.tsx             # Theme-aware base components
├── constants/                    # App constants and configuration
│   ├── theme.ts                 # Color and font definitions
│   └── config.ts                # App configuration
├── hooks/                       # Custom React hooks
│   ├── use-color-scheme.ts      # Theme detection
│   ├── use-storage.ts           # Local storage management
│   └── use-agent-tasks.ts       # Agent task state management
├── lib/                         # Core business logic
│   ├── storage/                 # Data persistence layer
│   ├── notifications/           # Notification handling
│   ├── agents/                  # Agent integration
│   └── sync/                    # Cloud synchronization
├── types/                       # TypeScript type definitions
│   ├── items.ts                 # Note/Reminder/Task types
│   ├── agents.ts                # Agent execution types
│   └── navigation.ts            # Navigation type definitions
├── assets/                      # Static assets
│   └── images/                  # App icons and images
├── scripts/                     # Build and utility scripts
└── .kiro/                       # Kiro CLI configuration
    ├── steering/                # Project documentation
    └── prompts/                 # Custom development prompts
```

## File Naming Conventions
**Components**: PascalCase for React components (`QuickCapture.tsx`)
**Hooks**: camelCase with `use` prefix (`useAgentTasks.ts`)
**Types**: PascalCase for interfaces (`AgentTask`, `ReminderItem`)
**Constants**: SCREAMING_SNAKE_CASE for constants (`MAX_TASK_RUNTIME`)
**Utilities**: camelCase for utility functions (`formatDateTime.ts`)

## Module Organization
**Feature-Based Organization**:
- Each major feature (capture, reminders, tasks) has its own component folder
- Shared utilities in `/lib` with clear separation of concerns
- Type definitions centralized in `/types` for consistency
- Platform-specific code clearly marked with `.ios.tsx` or `.android.tsx`

**Import Organization**:
- External dependencies first
- Internal imports with `@/` path alias
- Relative imports last
- Type-only imports clearly marked

## Configuration Files
**Core Configuration**:
- `app.json` - Expo app configuration and build settings
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript compiler configuration
- `eslint.config.js` - Code linting rules

**Platform Configuration**:
- iOS: Info.plist modifications via Expo config plugins
- Android: AndroidManifest.xml modifications via Expo config plugins
- Notification permissions and background task configuration

## Documentation Structure
**Project Documentation**:
- `README.md` - Setup and development instructions
- `.kiro/steering/` - Product, technical, and structural documentation
- `DEVLOG.md` - Development timeline and decisions
- `docs/` - Detailed feature documentation and API references

**Code Documentation**:
- JSDoc comments for complex functions
- README files in major feature directories
- Type definitions serve as inline documentation

## Asset Organization
**Images and Icons**:
- App icons in multiple resolutions for iOS and Android
- Feature-specific images organized by screen/component
- Platform-specific assets clearly separated

**Fonts and Themes**:
- System fonts with platform-specific fallbacks
- Centralized theme configuration with light/dark mode support

## Build Artifacts
**Expo Build System**:
- `.expo/` - Expo CLI generated files (gitignored)
- `dist/` - Web build output (gitignored)
- Platform-specific builds handled by Expo Application Services (EAS)

**Development Artifacts**:
- `node_modules/` - Dependencies (gitignored)
- `.expo-shared/` - Expo shared configuration
- TypeScript compiled output handled by Metro bundler

## Environment-Specific Files
**Environment Configuration**:
- `.env.local` - Local development environment variables
- `.env.staging` - Staging environment configuration
- `.env.production` - Production environment configuration

**Platform Environments**:
- Development: Expo Go or Development Build
- Staging: Internal distribution via EAS
- Production: App Store and Google Play Store releases

**Agent Integration Environments**:
- Development: Local mock agent responses
- Staging: Sandbox Daytona workspaces
- Production: Full agent execution with safety constraints
