# Simple Editor Synchronization Fix & Optimization

## Problem

The simple editor had several synchronization issues:

- The simple editor appeared "empty" when there was a definition loaded in the technical editor
- Editing in one mode was not synchronized across the three views (simple, technical, preview)
- **Split view issue**: Writing in technical editor did not propagate to simple editor in split view
- **Cursor jumping**: In simple editor, pressing Enter would create a newline but then jump the cursor back

## Root Cause Analysis

The synchronization logic had multiple fundamental issues:

1. **Split view sync failure**: Content watcher only synced when `editMode === 'simple'`, but split view uses `editMode === 'split'`
2. **Race conditions**: Insufficient protection against sync loops and multiple simultaneous sync operations
3. **Cursor position loss**: Debounced sync functions would reset cursor position without preservation
4. **Inefficient sync triggers**: Multiple overlapping sync mechanisms causing unnecessary updates
5. **Missing change detection**: No hash-based change detection led to redundant sync operations

## Optimized Solution

Completely redesigned the synchronization system with the following improvements:

### 1. Hash-Based Change Detection

- Added content hashing to prevent unnecessary sync operations
- Tracks `lastTechnicalContentHash` and `lastSimpleContentHash`
- Only syncs when content actually changes, reducing CPU usage and preventing loops

### 2. Cursor Position Preservation

- Stores cursor position before sync operations
- Restores cursor position after content updates using `nextTick`
- Eliminates cursor jumping issues during typing

### 3. Split View Support

- Updated mode detection to include both `'simple'` and `'split'` modes
- Technical editor changes now properly sync to simple editor in split view
- Mode transitions handle all combinations (simple ↔ split ↔ technical)

### 4. Optimized Debouncing Strategy

- Reduced sync functions from multiple overlapping ones to two optimized functions
- `syncSimpleToTechnicalOptimized`: 300ms debounce with cursor preservation
- `syncTechnicalToSimpleOptimized`: 100ms debounce for responsive updates
- Immediate sync for Enter key to prevent cursor jumping

### 5. Atomic State Updates

- Simple editor state updates happen atomically to prevent multiple reactivity triggers
- Reduced cognitive complexity by consolidating sync logic

### 6. Improved Event Handling

- `handleContentChange` now triggers technical-to-simple sync automatically
- Eliminated redundant watchers and event handlers
- Cleaner separation between sync triggers and sync operations

## Files Modified

1. `/src/composables/useSimpleEditor.js`:
   - Added hash-based change detection
   - Optimized sync functions with proper race condition protection
   - Atomic state updates

2. `/src/components/FileEditor.vue`:
   - Simplified sync trigger logic
   - Added cursor position preservation
   - Fixed split view mode detection
   - Optimized debouncing strategy

3. `/about-this-code/SIMPLE_EDITOR_SYNC_FIX.md`: Updated documentation

## Performance Improvements

- **Reduced sync operations**: Hash-based change detection prevents unnecessary syncs
- **Lower CPU usage**: Eliminated redundant content parsing and DOM updates
- **Better responsiveness**: Optimized debounce timings for different scenarios
- **Memory efficiency**: Cleaned up overlapping event handlers and watchers

## Testing Scenarios

To verify the fixes:

1. **Split view sync**:
   - Switch to split view with a terms file
   - Type in technical editor → verify simple editor updates
   - Edit simple editor → verify technical editor updates

2. **Cursor preservation**:
   - Type in simple editor definition field
   - Press Enter → cursor should stay at correct position
   - Continue typing → no jumping or position reset

3. **Mode switching**:
   - Load terms file in technical mode
   - Switch to simple → content should appear parsed
   - Switch to split → both panes should be synchronized
   - Switch back to technical → content should be preserved

4. **Performance**:
   - Rapid typing should not cause visible lag
   - Content changes should be reflected quickly across all views
   - No infinite sync loops or racing conditions

## Technical Details

- **Hash function**: Uses `btoa()` with 16-character substring for efficient change detection
- **Sync protection**: `isSyncing` flag with proper try/finally blocks
- **Cursor preservation**: Stores `selectionStart` before sync, restores with `setSelectionRange`
- **Atomic updates**: Single object assignment to prevent multiple Vue reactivity triggers
- **Debounce timing**: 300ms for simple-to-technical (typing), 100ms for technical-to-simple (responsiveness)
