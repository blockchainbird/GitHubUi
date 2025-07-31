# Version Notification System

## Overview

The version notification system automatically notifies users when a new version of the application has been deployed. It uses build timestamps to detect version changes and shows a non-intrusive notification toast.

## How It Works

### Build Information
- Build timestamps are generated during the build process using Vite's `define` feature
- The build information includes:
  - `timestamp`: ISO string of build time
  - `buildDate`: Formatted human-readable build date

### Version Detection
- The system compares the current build timestamp with the last seen version stored in localStorage
- When a new version is detected (different timestamp), a notification appears
- Users can acknowledge the update or dismiss the notification

### Storage
- Uses localStorage key `last_seen_version` to track acknowledged versions
- The system remembers which version the user has already seen

## Components

### useVersionCheck.js (Composable)
**Location:** `src/composables/useVersionCheck.js`

**Purpose:** Core logic for version checking and notification management

**Key Features:**
- Automatic version checking on app load
- Periodic checks every 30 minutes
- Local storage management for version tracking
- Non-intrusive notification system

**Methods:**
- `checkForUpdates()`: Manually check for version updates
- `dismissNotification()`: Hide the notification
- `acknowledgeUpdate()`: Mark current version as seen
- `markVersionAsSeen()`: Internal method to update localStorage

### VersionNotification.vue (Component)
**Location:** `src/components/VersionNotification.vue`

**Purpose:** UI component that displays the version notification toast

**Key Features:**
- Positioned as a toast in the top-right corner
- Responsive design for mobile devices
- Smooth animations for show/hide
- Two action buttons: "Got it" and dismiss

**Styling:**
- Uses Bootstrap classes for consistency
- Custom CSS for toast positioning and animations
- Gradient backgrounds and hover effects

### VersionDemo.vue (Demo Component)
**Location:** `src/components/VersionDemo.vue`

**Purpose:** Testing and demonstration component for the version system

**Key Features:**
- Simulate new version scenarios
- Clear version history for testing
- Display debug information
- Manual version checking controls

## Integration

### App.vue Integration
The `VersionNotification` component is included in the main `App.vue` template:

```vue
<template>
  <div>
    <MainNav />
    <main>
      <router-view />
    </main>
    <BackToTop />
    <VersionNotification />
  </div>
</template>
```

### Automatic Initialization
The version check system automatically initializes when any component uses the `useVersionCheck` composable, typically when the app loads.

## Usage Scenarios

### For Users
1. **Automatic Detection**: When a new version is deployed, users see a notification on their next page load or after the periodic check
2. **Acknowledgment**: Users can click "Got it" to acknowledge they've seen the update
3. **Dismissal**: Users can dismiss the notification with the X button

### For Developers
1. **Testing**: Use the `/version-demo` route to test version notification behavior
2. **Simulation**: Simulate new versions and test user interactions
3. **Debugging**: View internal state and localStorage values

## Configuration

### Check Interval
The system checks for updates every 30 minutes by default. This can be modified in `useVersionCheck.js`:

```javascript
const VERSION_CHECK_INTERVAL = 30 * 60 * 1000 // 30 minutes
```

### Storage Key
The localStorage key used to track seen versions:

```javascript
const LAST_SEEN_VERSION_KEY = 'last_seen_version'
```

## Technical Considerations

### Performance
- Minimal performance impact: only checks timestamps
- Uses localStorage for persistence
- Automatic cleanup of event listeners

### Browser Compatibility
- Requires localStorage support (all modern browsers)
- Uses standard Vue 3 Composition API
- Bootstrap 5 classes for styling

### Development Mode
- In development mode (build date shows "Development Mode"), notifications are suppressed
- This prevents unnecessary notifications during development

## Security & Privacy

### Data Storage
- Only stores version timestamps in localStorage
- No personal information is transmitted or stored
- No external API calls for version checking

### Privacy
- All version checking happens locally
- No user tracking or analytics specific to version notifications
- Respects user's decision to dismiss notifications

## Future Enhancements

### Potential Improvements
1. **Remote Version Checking**: Check against a remote API for more sophisticated version management
2. **Release Notes**: Show release notes or changelog when new versions are available
3. **Update Preferences**: Allow users to configure notification preferences
4. **Progressive Web App**: Integrate with PWA update mechanisms
5. **Notification History**: Keep a history of seen versions and updates

### Integration Points
- Could integrate with existing Google Analytics tracking
- Could work with service worker update notifications
- Could include links to release notes or changelog

## Testing

### Manual Testing
1. Visit `/version-demo` in the application
2. Use "Simulate New Version" to trigger notifications
3. Test acknowledgment and dismissal behaviors
4. Clear version history to reset state

### Automated Testing
The system is designed to be testable with unit tests for:
- Version comparison logic
- localStorage interactions
- Component state management
- User interaction handling

## Troubleshooting

### Common Issues
1. **Notifications not appearing**: Check if build date shows "Development Mode"
2. **Persistent notifications**: Clear localStorage or use the demo page to reset
3. **Missing build info**: Ensure Vite build process includes `__BUILD_INFO__` definition

### Debug Information
The version demo page provides comprehensive debug information including:
- Current version details
- localStorage contents
- Internal state values
- Raw data inspection
