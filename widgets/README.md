# Add Card Widget

A simple iOS home screen widget that allows users to quickly add a new reminder card to BuddyReminder.

## Features

- **Quick Access**: Add the widget to your home screen for instant access
- **Deep Link**: Taps on the widget open the quick capture modal
- **Beautiful Design**: Gradient background with clear call-to-action

## Setup

The widget is automatically configured via the Voltra plugin in `app.json`. To rebuild with the widget:

```bash
npx expo prebuild --platform ios --clean
```

## Usage

1. Long press on your iOS home screen
2. Tap the "+" button to add a widget
3. Search for "BuddyReminder"
4. Select "Add Card" widget
5. Choose the small size and add to home screen

Tapping the widget will open the app and show the quick capture modal.

## Files

- `widgets/add-card-widget.tsx` - Widget UI component
- `widgets/add-card-initial.tsx` - Initial widget state
- `hooks/use-add-card-widget.ts` - Hook to update widget from app
