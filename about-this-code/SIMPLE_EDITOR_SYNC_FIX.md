# Simple Editor Synchronization Fix

## Problem

The simple editor was not properly synchronized with the technical editor and preview. Specifically:

- The simple editor appeared "empty" when there was a definition loaded in the technical editor
- Editing in one mode was not synchronized across the three views (simple, technical, preview)

## Root Cause

The synchronization logic had several issues:

1. **Missing initial sync**: When switching to simple mode or loading a file, the `syncTechnicalToSimple` function was not properly populating the simple editor
2. **Race conditions**: The `isSyncing` flag was not properly handled in the `syncTechnicalToSimple` function
3. **Limited sync conditions**: The debounced sync functions only worked when `editMode === 'simple'`, preventing sync in split view
4. **Missing sync on content changes**: When content changed from external sources, it wasn't syncing to the simple editor

## Solution

Fixed the synchronization in several ways:

### 1. Enhanced `syncTechnicalToSimple` function

- Added proper `isSyncing` flag handling with try/finally
- Ensured the function works even when called from outside the simple editor context
- Improved error handling and content parsing

### 2. Improved `editMode` watcher

- Added comments to clarify when sync occurs
- Ensured sync happens when switching between modes

### 3. Enhanced content watcher

- Added sync to simple editor when content changes and we're in simple mode
- Only syncs when not already syncing to prevent infinite loops

### 4. Initial load synchronization

- Added sync call after file content is loaded for terms files
- Added sync call when switching between files (path watcher)

### 5. Relaxed sync conditions

- Removed `editMode === 'simple'` condition from debounced sync functions
- Changed condition to just check if it's a terms file, allowing sync in split view

## Files Modified

1. `/src/components/FileEditor.vue`: Enhanced synchronization watchers and lifecycle
2. `/src/composables/useSimpleEditor.js`: Fixed `syncTechnicalToSimple` function with proper flag handling

## Testing

To test the synchronization:

1. Open a terms file in the file editor
2. Switch between Simple, Technical, and Preview modes
3. Verify that content appears correctly in all modes
4. Edit content in simple mode and verify it syncs to technical/preview
5. Edit content in technical mode and verify it syncs to simple mode when switching
6. Test split view to ensure all three panes stay synchronized

## Technical Details

- Uses debounced synchronization to prevent excessive updates
- Implements proper race condition protection with `isSyncing` flag
- Maintains bidirectional sync between simple and technical editors
- Preview automatically updates via reactive computed properties
