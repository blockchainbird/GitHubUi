# Simple Editor Synchronization Fix - Simplified Approach

## Problem

The synchronization between the simple editor, technical editor, and preview was broken. The previous "optimized" solution with hash-based change detection was over-engineered and made things worse.

## Issues Identified

1. **Split view sync failure**: Technical editor changes not syncing to simple editor in split view
2. **Cursor jumping**: Enter key causing cursor to jump back in simple editor
3. **Over-engineered solution**: Hash-based change detection added complexity without solving core issues
4. **Sync loops**: Multiple overlapping sync mechanisms interfering with each other

## Simplified Solution

Reverted to a simpler, more reliable approach:

### 1. Removed Complex Hash System

- Eliminated hash-based change detection that was causing sync issues
- Removed `lastTechnicalContentHash` and `lastSimpleContentHash` tracking
- Simplified the sync functions to focus on core functionality

### 2. Streamlined Sync Functions

- **`syncSimpleToTechnicalDebounced`**: 300ms debounce for form changes
- **`syncTechnicalToSimpleDebounced`**: 150ms debounce for technical-to-simple sync
- Clear conditions: only sync when mode requires it (`simple` or `split`)

### 3. Fixed Split View Support

- Updated `syncTechnicalToSimpleDebounced` to check for both `'simple'` and `'split'` modes
- Technical editor changes now properly trigger simple editor updates in split view
- Mode transitions handle the correct combinations

### 4. Improved Enter Key Handling

- `handleDefinitionEnter` uses a 10ms timeout instead of complex async handling
- Prevents cursor jumping while maintaining sync functionality
- Simpler logic that's easier to debug

### 5. Cleaner Event Flow

- `handleContentChange` automatically triggers technical-to-simple sync
- Form changes trigger simple-to-technical sync with appropriate debouncing
- Mode watchers handle transitions cleanly with explicit conditions

## Key Changes

### `/src/composables/useSimpleEditor.js`

- Removed hash-based change detection
- Simplified sync functions with basic `isSyncing` protection
- Cleaner state management

### `/src/components/FileEditor.vue`

- Simplified debounced sync functions
- Fixed split view mode detection
- Improved Enter key handling with minimal timeout
- Cleaner event flow and watcher logic

## Expected Behavior

1. **Split view**: Changes in technical editor sync to simple editor within 150ms
2. **Simple mode**: Form changes sync to technical editor within 300ms  
3. **Mode switching**: Content properly transfers between modes
4. **Enter key**: Creates newline without cursor jumping
5. **No sync loops**: Clean separation of sync triggers

## Testing

To verify the fixes:

1. **Split view sync**:
   - Open terms file, switch to split view
   - Type in technical editor → simple editor should update
   - Edit simple form → technical editor should update

2. **Cursor behavior**:
   - Type in simple editor definition field
   - Press Enter → cursor stays in correct position
   - Continue typing → no jumping

3. **Mode switching**:
   - Load terms file, switch between modes
   - Content should appear correctly in all modes
   - No loss of data during transitions

## Principles Applied

- **Simplicity over optimization**: Removed complex features that didn't solve the core problem
- **Clear separation of concerns**: Each sync function has a specific purpose
- **Predictable behavior**: Straightforward conditions and timing
- **Easier debugging**: Simpler code paths make issues easier to trace
