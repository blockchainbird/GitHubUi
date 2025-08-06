# Notepad and Remote Changes Implementation

This document describes the implementation of the notepad functionality and remote changes detection for the Spec-Up-T Editor.

## Part A: Notepad Implementation

### Notepad Components

1. **Notepad.vue** - Main notepad component with:
   - Draggable floating window with blueish sticky note design
   - Expandable/resizable by dragging corner
   - Closed and opened states
   - Auto-save functionality with localStorage
   - Copy and clear functions
   - Auto-opens when content is added
   - Size management (max 500KB, auto-trim when exceeded)

2. **useNotepad.js** - Composable for notepad state management:
   - Global state management for notepad
   - Auto-save with debouncing
   - Content size monitoring and automatic trimming
   - Timestamp and separator handling for new content
   - Copy to clipboard functionality

### Integration Points

1. **MainNav.vue** - Added notepad toggle button accessible from navigation
2. **App.vue** - Added Notepad component to main app
3. **FileEditor.vue** - Added "To Notepad" button in toolbar

### Notepad Features

- **Auto-save**: Content is automatically saved to localStorage after every edit
- **Size Management**: Maximum 500KB storage with automatic trimming of oldest content in 50KB chunks
- **Visual Design**: Blueish sticky note appearance with smooth animations
- **Responsive**: Adapts to window resizing and stays within viewport
- **Timestamped Entries**: Each content addition includes timestamp and source information
- **Copy Function**: One-click copy of entire notepad content to clipboard
- **Clear Function**: Confirmation dialog before clearing all content

## Part B: Remote Changes Detection

### Remote Monitoring Components

1. **useRemoteFileMonitor.js** - Composable for monitoring remote file changes:
   - Periodic checks every minute when file is open
   - Check before commit operations
   - SHA-based change detection
   - Remote content fetching and replacement

### Integration in FileEditor

1. **Fresh Content Loading**: Modified `useFileContent.js` to always fetch fresh content from remote (no cached data)
2. **Remote Change Alert**: Added warning alert when remote changes are detected
3. **Content Migration**: When remote changes are accepted, current content moves to notepad with animation
4. **Commit Protection**: Prevents commits when remote changes are detected

### Remote Change Features

- **Real-time Monitoring**: Checks for remote changes every minute while file is open
- **Commit Protection**: Mandatory check before allowing commits
- **User Choice**: Option to accept remote changes or keep local version
- **Content Preservation**: Local changes are moved to notepad before loading remote version
- **Visual Animation**: Smooth animation when content moves to notepad
- **No Cache**: Always fetches latest content from GitHub.com (no localStorage caching)

## Technical Implementation Details

### Cache Busting

- Uses existing `apiUtils.js` cache-busting functionality
- Ensures fresh data from GitHub API with timestamp parameters
- No reliance on CORS-blocked cache headers

### State Management

- Global notepad state using Vue 3 Composition API
- Reactive monitoring of file changes
- Proper cleanup on component unmount

### Error Handling

- Authentication checks and redirects
- Graceful degradation when API calls fail
- User-friendly error messages

### Performance

- Debounced auto-save to prevent excessive localStorage writes
- Efficient SHA comparison for change detection
- Background monitoring without blocking UI

## User Experience

### Notepad Workflow

1. Click notepad icon in navigation to open/close
2. Content automatically saves as you type
3. Use "To Notepad" button in file editor to copy current content
4. Drag window to reposition, drag corner to resize
5. Copy or clear content with header buttons

### Remote Changes Workflow

1. Open file in editor (always loads fresh from remote)
2. System monitors for remote changes every minute
3. If remote change detected, warning alert appears
4. User can choose to load remote version or dismiss
5. When loading remote version, current content moves to notepad with animation
6. Before committing, system checks for remote changes and prevents commit if found

## Storage and Limits

- **Notepad Storage**: localStorage with 500KB maximum
- **Auto-trimming**: Removes oldest content in 50KB chunks when limit exceeded
- **Position/Size**: Window position and size persisted across sessions
- **Content Format**: Timestamped entries with separators for easy reading

## Browser Compatibility

- Uses modern browser APIs (localStorage, clipboard)
- Fallback for clipboard operations in older browsers
- CSS animations and transforms for smooth UX
- Responsive design for mobile and desktop

## Future Enhancements

Potential improvements that could be added:

- Export notepad content to file
- Search within notepad content
- Sync notepad across devices
- Rich text formatting
- Undo/redo functionality
- Multiple notepad tabs
- Integration with external note-taking services
