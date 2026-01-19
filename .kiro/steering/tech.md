# Technical Architecture

## Technology Stack
**Frontend**: React Native 0.81.5 + Expo SDK ~54.0.31 with new architecture
- React 19.1.0 with React Compiler enabled
- Expo Router for file-based navigation with typed routes
- React Native Reanimated for smooth animations
- TypeScript with strict mode for type safety

**Mobile Platform Integration**:
- iOS: Widgets, Shortcuts integration, Local notifications
- Android: Persistent notifications, WorkManager for background tasks
- WearOS: Companion app for quick capture

**Backend Services**:
- Authentication and user data storage
- Task scheduler for server-triggered agent runs
- Push notification service for cross-device sync
- Agent execution orchestration

**AI Agent Integration**:
- OpenCode agents running in Daytona workspaces
- Structured task execution with safety constraints
- Artifact storage and result streaming

## Architecture Overview
**Mobile-First Architecture** with server-side agent execution:
- **Presentation Layer**: React Native with Expo for cross-platform UI
- **State Management**: React hooks with context for local state
- **Data Layer**: Local SQLite + cloud sync for offline-first experience
- **Integration Layer**: Native modules for platform-specific features
- **Agent Execution**: Server-side Daytona workspace provisioning

**Key Patterns**:
- File-based routing with tab navigation
- Theme-aware components with light/dark mode
- Background task scheduling for reliable reminders
- Real-time updates for agent task execution

## Development Environment
**Package Manager**: Bun for fast dependency management
**Development Tools**:
- Expo CLI for development and building
- TypeScript compiler with strict mode
- ESLint with Expo configuration
- React Native Debugger for debugging

**Platform Development**:
- Expo Development Build for native module testing
- iOS Simulator and Android Emulator
- Physical devices for platform-specific feature testing

## Code Standards
**TypeScript Standards**:
- Strict mode enabled with comprehensive type checking
- Path aliases (`@/*`) for clean imports
- Interface definitions for all data models

**React Native Best Practices**:
- Functional components with hooks
- Performance optimization with React.memo and useMemo
- Platform-specific code organization
- Accessibility compliance (a11y)

**File Organization**:
- Feature-based folder structure
- Shared components in `/components`
- Platform-specific code clearly separated

## Testing Strategy
**Testing Framework**: Jest + React Native Testing Library
- Unit tests for business logic and utilities
- Component testing for UI interactions
- Integration tests for agent task flows
- End-to-end testing for critical user journeys

**Platform Testing**:
- iOS and Android device testing
- Widget and notification testing
- Background task reliability testing

## Deployment Process
**Mobile Deployment**:
- Expo Application Services (EAS) for building and distribution
- App Store Connect (iOS) and Google Play Console (Android)
- Over-the-air updates for non-native changes

**CI/CD Pipeline**:
- Automated testing on pull requests
- Staged deployments (development → staging → production)
- Automated security scanning and dependency updates

## Performance Requirements
**Mobile Performance**:
- App launch time <2 seconds
- Quick capture flow <3 seconds end-to-end
- Smooth 60fps animations and transitions
- Efficient memory usage for background operation

**Agent Execution**:
- Task execution results delivered within 30 seconds for simple tasks
- Real-time progress updates during long-running tasks
- Efficient workspace provisioning and cleanup

## Security Considerations
**Mobile Security**:
- Secure storage for authentication tokens
- Biometric authentication for sensitive operations
- Certificate pinning for API communications

**Agent Security**:
- Sandboxed workspace execution in Daytona
- Allowlist-based tool access for agents
- Human approval gates for side-effect actions
- Comprehensive audit logging
- Secrets handling with no token exposure in logs
- Budget and runtime limits per user/task
