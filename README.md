# BuddyReminder

## TL;DR
Cross-platform mobile app for instant capture of notes, reminders, and AI-powered tasks. Capture in <3 seconds, delegate tasks to AI agents running in remote workspaces. Built with React Native + Expo, featuring lock screen widgets, smart reminders, and OpenCode agent integration for automated task execution.

## App Description

### Overview
BuddyReminder is designed for busy professionals and power users who need rapid task capture and intelligent delegation. The core value proposition is **"capture instantly" + "delegate automatically"** - users can jot down notes, set reminders, or create agent tasks from lock screen widgets in under 3 seconds, then have AI agents execute complex tasks in sandboxed remote workspaces.

### Target Users
- **Busy Individuals**: Need rapid capture, reminders, and recurring chore management
- **Builders/Operators**: Want to offload small tasks to AI agents (draft emails, research, code changes, file transforms)
- **On-the-go Users**: Use wearables for hands-free task capture and triage

### Core Features

#### Quick Capture System
- **Lock Screen Access**: Widgets and shortcuts for instant capture without unlocking device
- **Minimal Composer**: Single-field input optimized for speed (<3 seconds end-to-end)
- **Type Selection**: Choose between Note, Reminder, or Agent Task with templates
- **Unified Inbox**: All items in one place with clear visual distinction by type

#### Smart Reminders
- **Time-Based Notifications**: Schedule reminders with precise timing (±30 seconds accuracy)
- **Location-Based Triggers**: Reminders fire when entering/leaving specific locations
- **Snooze & Reschedule**: Quick actions to defer reminders with smart suggestions
- **Recurring Tasks**: Support for daily, weekly, monthly patterns with custom rules

#### AI Agent Tasks
- **Structured Task Delegation**: Define tasks with clear inputs, expected outputs, and constraints
- **OpenCode Agent Execution**: Tasks run in Daytona workspaces with full development environment
- **Safety Controls**: Allowlist-based tool access, human approval gates for side-effects
- **Real-Time Updates**: Progress notifications during long-running tasks
- **Artifact Storage**: Results include summaries, generated files, and execution logs
- **Audit Trail**: Comprehensive logging of all agent actions for transparency

#### Cross-Platform Support
- **iOS**: Native widgets, Shortcuts integration, local notifications
- **Android**: Persistent notifications, WorkManager for background tasks
- **WearOS**: Companion app for quick capture from smartwatch

### Key Differentiators
1. **Speed**: Median capture time <3 seconds from lock screen to saved item
2. **Agent Integration**: Full development workspace provisioning for complex tasks
3. **Safety First**: Transparent agent operations with user control and approval workflows
4. **Offline-First**: Local SQLite storage with cloud sync for reliable operation
5. **Platform Native**: Deep OS integration for seamless workflows

### User Journeys

#### Quick Capture Flow
1. User taps widget/notification/shortcut from lock screen
2. Minimal composer opens with single input field
3. User types content and selects type (Note/Reminder/Agent Task)
4. Item saved to unified Inbox in <3 seconds
5. Background sync to cloud when online

#### Agent Task Flow
1. User creates agent task with template or custom instructions
2. Task triggers at scheduled time or manual run
3. Backend provisions Daytona workspace + OpenCode instance
4. Agent executes with safety constraints and comprehensive logging
5. User receives notification with summary, artifacts, and approval options
6. User reviews results and approves/rejects side-effect actions
7. Workspace cleaned up automatically after completion

### Success Metrics
- **Speed**: Median capture time <3 seconds
- **Reliability**: Reminders fire within ±30 seconds of scheduled time
- **Agent Success**: >80% task completion rate with useful output
- **Retention**: D7 >40%, D30 >20%
- **Trust**: High user satisfaction with agent transparency and control

## Tech Stack

### Frontend Architecture
- **React Native**: 0.81.5 with new architecture enabled
- **Expo SDK**: ~54.0.31 for cross-platform development and OTA updates
- **React**: 19.1.0 with React Compiler for optimized performance
- **TypeScript**: Strict mode enabled for comprehensive type safety
- **Navigation**: Expo Router with file-based routing and typed routes
- **Animations**: React Native Reanimated for smooth 60fps interactions
- **State Management**: React hooks with context for local state
- **Styling**: Theme-aware components with light/dark mode support

### Mobile Platform Integration

#### iOS
- **Widgets**: Lock screen and home screen widgets for quick capture
- **Shortcuts**: Siri Shortcuts integration for voice-activated capture
- **Notifications**: Local notifications with custom actions (snooze, complete, reschedule)
- **Background Tasks**: Background fetch for sync and reminder scheduling

#### Android
- **Persistent Notifications**: Always-accessible quick capture notification
- **WorkManager**: Reliable background task scheduling for reminders
- **Widgets**: Home screen widgets with Material Design
- **Notifications**: Rich notifications with inline actions

#### WearOS
- **Companion App**: Quick capture from smartwatch
- **Voice Input**: Speech-to-text for hands-free capture
- **Complications**: Watch face complications for quick access

### Backend Services
- **Authentication**: User authentication and session management
- **Data Storage**: Cloud storage with offline-first sync
- **Task Scheduler**: Server-triggered agent runs at scheduled times
- **Push Notifications**: Cross-device sync notifications
- **Agent Orchestration**: Daytona workspace provisioning and management
- **Artifact Storage**: Secure storage for agent-generated files and results

### AI Agent Integration
- **OpenCode Agents**: Running in isolated Daytona workspaces
- **Workspace Provisioning**: Automatic environment setup with required tools
- **Safety Constraints**: Allowlist-based tool access, budget limits, runtime limits
- **Approval Gates**: Human-in-the-loop for side-effect actions
- **Audit Logging**: Comprehensive logging with no token exposure
- **Result Streaming**: Real-time progress updates during execution

### Development Tools
- **Package Manager**: Bun for fast dependency management
- **Build System**: Expo Application Services (EAS) for iOS and Android builds
- **Testing**: Jest + React Native Testing Library
- **Linting**: ESLint with Expo configuration
- **Debugging**: React Native Debugger, Flipper integration
- **CI/CD**: Automated testing and staged deployments

### Data Architecture
- **Local Storage**: SQLite for offline-first data persistence
- **Cloud Sync**: Incremental sync with conflict resolution
- **Type Definitions**: Centralized TypeScript types for consistency
- **Migration System**: Schema versioning for database updates

### Performance Targets
- **App Launch**: <2 seconds cold start
- **Quick Capture**: <3 seconds end-to-end
- **Animations**: Smooth 60fps transitions
- **Agent Tasks**: Results within 30 seconds for simple tasks
- **Memory**: Efficient usage for background operation

### Security
- **Secure Storage**: Encrypted storage for authentication tokens
- **Biometric Auth**: Face ID/Touch ID for sensitive operations
- **Certificate Pinning**: Secure API communications
- **Sandboxed Execution**: Agent tasks run in isolated workspaces
- **Secrets Management**: No token exposure in logs or artifacts

## Current Status

**Last Updated**: January 29, 2026

### Implemented Features
- ✅ Quick capture system (<3 seconds)
- ✅ Smart reminders with notifications
- ✅ Alarm system (iOS AlarmKit integration)
- ✅ NFC tag integration for dismissal
- ✅ Google Calendar sync
- ✅ Theme system (Auto/Light/Dark)
- ✅ Daily highlights with golden styling
- ✅ Liquid glass card design
- ✅ Swipe gestures for management
- ✅ Natural language date/time parsing
- ✅ iOS widgets with urgency indicators
- ✅ Deep linking & universal links
- ✅ Cloud sync toggle
- ✅ Offline-first architecture

### In Development
- 🚧 AI Agent task execution (foundation complete)
- 🚧 WearOS companion app
- 🚧 Android widgets
- 🚧 Location-based reminders

### Planned Features
- 📋 Recurring task patterns
- 📋 Task templates
- 📋 Collaboration features
- 📋 Advanced analytics

## How to Run

### Prerequisites
- **Node.js**: 18.x or higher
- **Bun**: Latest version (or npm/yarn as alternative)
- **Expo CLI**: Installed globally or via npx
- **iOS Development**: Xcode 14+ and iOS Simulator (macOS only)
- **Android Development**: Android Studio with SDK 33+ and emulator

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd BuddyReminder
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```
   
   Or with npm:
   ```bash
   npm install
   ```

3. **Environment configuration** (optional):
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

### Development

#### Start Development Server
```bash
npx expo start
```

This opens the Expo Dev Tools in your browser with options to:
- Press `i` to open iOS Simulator
- Press `a` to open Android Emulator
- Press `w` to open in web browser (limited functionality)
- Scan QR code with Expo Go app on physical device

#### Platform-Specific Development

**iOS Simulator**:
```bash
npx expo start --ios
```

**Android Emulator**:
```bash
npx expo start --android
```

**Clear Cache** (if experiencing issues):
```bash
npx expo start --clear
```

### Development Builds

For testing native features (widgets, notifications, background tasks):

**iOS**:
```bash
npx expo run:ios
```

**Android**:
```bash
npx expo run:android
```

**Custom Development Build**:
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Testing

**Run all tests**:
```bash
bun test
```

**Watch mode**:
```bash
bun test --watch
```

**Coverage report**:
```bash
bun test --coverage
```

### Building for Production

**iOS**:
```bash
eas build --profile production --platform ios
```

**Android**:
```bash
eas build --profile production --platform android
```

**Submit to App Stores**:
```bash
eas submit --platform ios
eas submit --platform android
```

### Project Structure

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
│   ├── capture/                 # Quick capture components
│   ├── reminders/               # Reminder-specific components
│   ├── tasks/                   # Agent task components
│   └── themed-*.tsx             # Theme-aware base components
├── lib/                         # Core business logic
│   ├── storage/                 # Data persistence layer
│   ├── notifications/           # Notification handling
│   ├── agents/                  # Agent integration
│   └── sync/                    # Cloud synchronization
├── types/                       # TypeScript type definitions
│   ├── items.ts                 # Note/Reminder/Task types
│   ├── agents.ts                # Agent execution types
│   └── navigation.ts            # Navigation type definitions
├── hooks/                       # Custom React hooks
│   ├── use-color-scheme.ts      # Theme detection
│   ├── use-storage.ts           # Local storage management
│   └── use-agent-tasks.ts       # Agent task state management
├── constants/                   # App constants and configuration
│   ├── theme.ts                 # Color and font definitions
│   └── config.ts                # App configuration
├── assets/                      # Static assets
│   └── images/                  # App icons and images
├── scripts/                     # Build and utility scripts
├── .kiro/                       # Kiro CLI configuration
│   ├── steering/                # Project documentation
│   │   ├── product.md          # Product overview and goals
│   │   ├── tech.md             # Technical architecture
│   │   └── structure.md        # File organization
│   └── prompts/                 # Custom development prompts
├── app.json                     # Expo app configuration
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

### Key Files and Directories

- **`app/`**: File-based routing with Expo Router. Each file becomes a screen.
- **`components/`**: Reusable UI components organized by feature.
- **`lib/`**: Core business logic separated from UI concerns.
- **`types/`**: Centralized TypeScript type definitions for consistency.
- **`hooks/`**: Custom React hooks for shared stateful logic.
- **`.kiro/steering/`**: Project documentation for AI-assisted development.

### Development Workflow

1. **Feature Development**: Create components in `components/`, add screens in `app/`
2. **Business Logic**: Implement in `lib/` with clear separation of concerns
3. **Type Safety**: Define types in `types/` before implementation
4. **Testing**: Write tests alongside implementation
5. **Documentation**: Update `.kiro/steering/` docs for significant changes

### Troubleshooting

**Metro bundler issues**:
```bash
npx expo start --clear
```

**iOS build issues**:
```bash
cd ios && pod install && cd ..
npx expo run:ios
```

**Android build issues**:
```bash
cd android && ./gradlew clean && cd ..
npx expo run:android
```

**Dependency issues**:
```bash
rm -rf node_modules bun.lockb
bun install
```

### Additional Resources

- **Expo Documentation**: https://docs.expo.dev
- **React Native Documentation**: https://reactnative.dev
- **Expo Router**: https://docs.expo.dev/router/introduction
- **EAS Build**: https://docs.expo.dev/build/introduction
- **Project Documentation**: See `.kiro/steering/` for detailed architecture docs
