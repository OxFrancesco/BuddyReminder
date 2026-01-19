# Development Log

## 2026-01-19

### Cloud Sync Toggle
- Added sync settings context for managing cloud/local sync mode
- Created cloud sync toggle switch in profile settings
- Updated sync engine to respect cloud sync preference
- Set cloud sync to disabled by default for new users
- Sync preference persists in AsyncStorage
- Simple "Enabled/Disabled" status display

### Agent Task Execution Foundation (In Progress)
- Created agent execution infrastructure with Daytona workspace integration
- Added agent icon button in home screen header for spawning OpenCode instances
- Implemented agent modal with loading states and workspace URL display
- Created Convex backend function for agent workspace provisioning
- Added agent detail screen for viewing execution results
- Integrated with existing task type in items schema
- Foundation laid for delegating tasks to AI agents in sandboxed environments
- Comprehensive code review completed with security and performance considerations

## 2026-01-19 (Earlier)

### Theme System Implementation
- Created comprehensive theme context with persistent storage using AsyncStorage
- Updated color scheme hook to use theme context instead of system-only detection
- Added theme switcher in settings with Auto/Light/Dark modes
- Integrated theme provider in root layout for app-wide theme management
- Theme preferences persist across app restarts and update entire UI

### Daily Highlight Feature
- Added `isDailyHighlight` field to items schema for marking important items
- Created `toggleItemDailyHighlight` mutation for highlight state management
- Implemented golden border styling (#FFD700) for highlighted items with enhanced shadows
- Added sparkle icon next to titles of highlighted items in both list and modal
- Created beautiful toggle in item settings menu with sparkle icon and gold theming
- Daily highlights get premium visual treatment with liquid glass effects

### Liquid Glass Card Design
- Implemented liquid glass morphism using expo-blur BlurView component
- Added adaptive transparency backgrounds for light/dark themes
- Enhanced shadows and borders for floating card appearance
- Replaced all emojis with proper SF Symbols icons (doc.text, bell, cpu)
- Reorganized card layout with icon bubbles and improved typography hierarchy
- Removed redundant information (created dates, status text) for cleaner design

### Auto-Save Implementation
- Removed manual save buttons in favor of automatic persistence
- Implemented debounced auto-save (500ms delay) for title and body text changes
- Added instant save for toggle switches (pin, daily highlight)
- Enhanced user experience with seamless editing and no save anxiety
- Proper error handling for failed save operations

### UI/UX Polish
- Removed all emojis from the app (replaced with text labels and SF Symbols)
- Fixed duplicate type text in item details (was showing "Reminder reminder")
- Added native date/time picker to reschedule modal alongside natural language input
- Improved reschedule modal with two input methods: natural language and visual pickers
- Added reschedule option directly in item detail settings card

### Swipe Gestures
- Replaced checkboxes with swipe gestures for cleaner UX
- Swipe right → Mark as done (archives item)
- Swipe left → Reschedule (reminders only)
- Added animated swipe actions with icons and labels
- Created gestures help screen accessible from profile
- Added sign out button to profile

### Quick Actions for Items
- Added checkbox to mark items as done (archives them)
- Added reschedule button for reminders (calendar icon)
- Created reschedule modal with natural language input
- Added `updateItem` mutation for updating trigger times
- Checkbox appears on all items for quick completion
- Reschedule button only appears on reminders

### Natural Language Date/Time Parsing
- Integrated `chrono-node` for robust NLP parsing
- Now supports complex date/time expressions:
  - "tomorrow at 3pm"
  - "next Monday at 2:30pm"
  - "in 2 hours"
  - "Jan 25 at 9am"
  - "tonight at 8pm"
  - "next week"
- Automatically extracts date/time and cleans title
- Forward date parsing (assumes future dates)

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
