# Development Log

## 2026-01-19

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
