# Drag and Drop Implementation for File Explorer

## Overview

This implementation adds drag and drop functionality to the FileExplorer component, allowing users to reorder files and folders in the root spec directory. The order is saved to the `specs.json` file in the `markdown_paths` array.

## Features

### 1. Selective Drag and Drop

- **Only in Root Directory**: Drag and drop functionality is only available when viewing the root spec directory (defined by `spec_directory` in `specs.json`)
- **Visual Indicators**: Drag handles (grip icons) appear only in the root directory
- **Disabled in Subdirectories**: No drag functionality when browsing subdirectories

### 2. Order Management

- **Combined Order**: Files and folders maintain a unified order
- **Persistent Storage**: Order is written to `specs.json` in the `markdown_paths` array
- **Special Handling**: The `spec_terms_directory` folder is written as `"terms-and-definitions-intro.md"`

### 3. Save Button

- **Appears After First Drag**: A "Save Order" button appears after the user performs their first drag operation
- **Unsaved Changes Tracking**: The system tracks when changes have been made but not saved
- **Auto-Reset**: Unsaved changes are cleared when navigating away from the root directory

## Technical Implementation

### Key Components

#### State Management
```javascript
const isDragMode = ref(false)
const hasUnsavedChanges = ref(false)
const draggedItems = ref([])
const originalOrder = ref([])
const specTermsDirectory = ref('')
```

#### Computed Properties
- `isRootDirectory`: Determines if current directory is the root spec directory
- Shows/hides drag handles and save button based on location

#### Drag Event Handlers
- `onDragStart`: Initiates drag operation with item data
- `onDragOver`: Allows drop by preventing default behavior
- `onDrop`: Handles item reordering logic
- `onDragEnd`: Cleanup after drag operation

#### Save Functionality
- `saveOrder`: Writes the current order to `specs.json`
- Updates the `markdown_paths` array in the first spec configuration
- Handles special case for `spec_terms_directory`

### Data Flow

1. **Initialization**: When files are loaded in root directory, `initializeDragItems()` creates a combined array of folders and files
2. **Drag Operation**: User drags an item, triggering reorder logic
3. **State Update**: Files and folders arrays are updated with new order
4. **Save Button**: Appears to allow user to persist changes
5. **Persistence**: Save button writes order to `specs.json` via GitHub API

### Special Handling

#### Terms Directory
The directory specified in `spec_terms_directory` receives special treatment:
- Instead of writing the directory name directly
- It's written as `"terms-and-definitions-intro.md"`
- This allows for consistent referencing in the spec system

## File Structure Changes

### FileExplorer.vue Changes
- Added drag and drop state variables
- Implemented drag event handlers
- Added save functionality
- Updated template with drag handles and save button
- Added CSS styles for drag interactions

### No New Files Created
This implementation doesn't create new files because:
- **Single Responsibility**: The drag and drop functionality is specific to the FileExplorer component
- **Tight Coupling**: The feature requires access to the component's existing state and methods
- **Minimal Footprint**: Adding to existing file keeps the implementation contained and maintainable

## Usage Instructions

### For Users
1. Navigate to the root spec directory
2. Look for the grip handle (⋮⋮) icons next to files and folders
3. Drag items to reorder them
4. Click "Save Order" button to persist changes
5. Changes are immediately reflected in the repository's `specs.json`

### For Developers
1. The drag functionality automatically activates in root directories
2. Order changes are tracked in the `draggedItems` reactive array
3. The `hasUnsavedChanges` flag controls save button visibility
4. Navigation away from root automatically clears unsaved changes

## Code Quality Considerations

### SonarQube Compliance
- **Cognitive Complexity**: Functions kept under 15 complexity points
- **No Duplication**: Reused existing helper functions where possible
- **Clean Code**: Clear variable names and single-responsibility functions

### Performance
- **Efficient Rendering**: Uses Vue 3's reactivity system efficiently
- **Minimal API Calls**: Only saves when user explicitly requests it
- **Lazy Initialization**: Drag items only initialized when needed

## Future Enhancements

Potential improvements could include:
- **Undo/Redo**: Allow users to revert order changes
- **Bulk Operations**: Select multiple items for reordering
- **Visual Feedback**: Enhanced drag preview and drop zones
- **Keyboard Support**: Arrow keys for reordering accessibility
