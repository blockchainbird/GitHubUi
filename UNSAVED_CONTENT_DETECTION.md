# Unsaved Content Detection Feature

## Overview

The FileEditor now includes intelligent unsaved content detection that warns users when they have made changes that haven't been autosaved yet. This provides better visibility into the autosave state and helps prevent data loss.

## Features

### 1. Real-time Unsaved Content Detection
- Tracks when content changes occur after the last autosave
- Provides immediate feedback about unsaved changes
- Distinguishes between autosaved content and truly unsaved content

### 2. Visual Indicators

#### Autosave Status Badge
- **"Autosaved"** - Content is safely autosaved
- **"Unsaved"** - Content has changed since last autosave
- Badge changes color from blue (info) to yellow (warning) when unsaved

#### Force Autosave Button
- **Blue outline** - Normal state
- **Yellow/Warning** - Unsaved content detected
- Icon changes from cloud upload to warning triangle
- Shows "Unsaved" text on larger screens

#### Warning Alert
- Appears after 30 seconds of unsaved changes
- Shows countdown to next automatic autosave
- Provides keyboard shortcut reminder (Ctrl/Cmd+S)

### 3. Smart Timing
- **Immediate detection** - Marks content as unsaved immediately when changed
- **30-second warning threshold** - Shows warning after 30 seconds of unsaved changes
- **60-second autosave cycle** - Automatic save every minute as before

## Technical Implementation

### New State Variables
```javascript
// Tracks if there's unsaved content since last autosave
const hasUnsavedContentSinceAutosave = ref(false)

// Timestamp of last content change
const lastContentChangeTimestamp = ref(null)
```

### New Computed Properties
```javascript
// Indicates if there's currently unsaved content
const hasUnsavedContent = computed(() => {
  return hasUnsavedContentSinceAutosave.value && 
         content.value !== lastSavedToLocalStorage.value &&
         content.value.trim() !== ''
})

// Shows warning for content unsaved for more than 30 seconds
const hasUnsavedContentWarning = computed(() => {
  return hasUnsavedContent.value && 
         timeSinceLastChange.value && 
         timeSinceLastChange.value > 30000 // 30 seconds
})
```

### Content Change Tracking
- Content watcher sets `hasUnsavedContentSinceAutosave = true` when changes detected
- Autosave operations reset `hasUnsavedContentSinceAutosave = false`
- Timestamp tracking enables time-based warning logic

## User Experience

### Normal Flow
1. User types content
2. "Autosaved" badge immediately changes to "Unsaved" (yellow)
3. Force autosave button becomes yellow with warning icon
4. After 60 seconds, content auto-saves and indicators return to normal

### Warning Flow
1. User types content and doesn't save for 30+ seconds
2. Warning alert appears: "Unsaved changes detected!"
3. Alert shows countdown to next autosave
4. User can force save with Ctrl/Cmd+S or wait for auto-save

### Manual Save Flow
1. User presses Ctrl/Cmd+S (force autosave)
2. All unsaved indicators immediately clear
3. "Autosaved" status shows normal blue state

## Benefits

1. **Improved Visibility** - Users always know if they have unsaved changes
2. **Data Loss Prevention** - Warning system reduces risk of losing work
3. **Better UX** - Clear visual feedback about autosave state
4. **Performance** - Lightweight detection with minimal overhead
5. **Accessibility** - Clear visual and textual indicators

## Code Changes

### useAutosave.js
- Added unsaved content state tracking
- Enhanced content change watcher
- New computed properties for warnings
- Reset flags in save/clear operations

### FileEditor.vue
- Updated template with new visual indicators
- Added warning alert component
- Enhanced autosave badge with conditional styling
- Modified force autosave button appearance

### Tests
- Added tests for unsaved content detection
- Verified warning threshold timing
- Tested state reset operations

## Future Enhancements

1. **Configurable Warning Threshold** - Allow users to set custom warning time
2. **Sound Notifications** - Optional audio alerts for long unsaved content
3. **Browser Tab Indicators** - Show unsaved state in page title
4. **Keyboard Shortcut Customization** - Allow custom save shortcuts
5. **Advanced Diff View** - Show exactly what content is unsaved
