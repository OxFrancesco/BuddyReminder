# Development Log

## 2026-01-19

### UI/UX Improvements
- Fixed safe area handling for items list to prevent content appearing under dynamic island/notch
- Created comprehensive item edit modal with title and body editing
- Added item update mutation for editing content
- Reorganized item card layout: moved type indicator to bottom right corner, removed status text
- Implemented item deletion with confirmation dialog
- Created settings menu in item detail modal with type display, pin toggle, and delete action
- Optimized quick capture input size (reduced height by 75% for better space utilization)
- Repositioned notes field to bottom of edit screen for better UX

### Item Management Features
- Added navigation from item cards to detail/edit modal
- Integrated pin toggle functionality in item detail menu
- Added delete button with confirmation alert in item menu
- Enhanced item editing with real-time change detection and save button

### Sticky Notification Feature
- Added `isPinned` field to items schema
- Created notification system with `expo-notifications`
- Implemented pin toggle in quick capture modal and item detail menu
- Added `toggleItemPin` mutation for updating pin status
- Pinned notes create persistent notifications (sticky on Android)
- Pin indicator shows toggle switch in settings menu

### Development Workflow
- Created Makefile with `make dev` command
- Configured to run both `bunx convex dev` and `npx expo start --ios` in parallel
- Streamlined development startup process
