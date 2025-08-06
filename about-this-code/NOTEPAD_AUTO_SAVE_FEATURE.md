# Notepad Auto-Save Feature

## Overview

This feature automatically saves unsaved file content to the notepad when a user navigates away from the file editor without committing their changes.

## Implementation Details

### Triggered Events

The auto-save to notepad functionality is triggered in the following scenarios:

1. **Back Navigation** (`goBack` function)
   - When user clicks the back button and has unsaved changes
   - Content is saved with source: "File Editor ({fileName}) - Unsaved Changes"
   - Shows a confirmation dialog mentioning content has been saved to notepad

2. **Browser Navigation** (`beforeunload` event)
   - When user tries to close the browser tab or navigate away via browser controls
   - Content is saved silently (no message shown due to browser restrictions)

3. **File Switching** (path watcher)
   - When user navigates to a different file within the editor
   - Content is saved silently to avoid interrupting the workflow

4. **Component Unmount** (`onUnmounted` lifecycle)
   - When the entire FileEditor component is destroyed
   - Content is saved silently as a final safety net

### Code Changes Made

#### Modified Functions

- `goBack()`: Added content saving before navigation with user notification
- `handleBeforeUnload()`: Added content saving for browser navigation events
- Path watcher: Added content saving when switching between files
- `onUnmounted()`: Added content saving when component is destroyed

#### Conditions for Auto-Save

Content is saved to notepad only when:

- `hasChanges.value` is true (indicating unsaved changes)
- `content.value.trim()` is not empty (avoiding saving empty content)

#### Message Sources

- Manual copy: "File Editor ({fileName})" (existing functionality)
- Auto-save scenarios: "File Editor ({fileName}) - Unsaved Changes"

#### User Feedback

The notepad always shows a visual confirmation message when content is added via script:

- Manual operations: "Content copied to notepad!"
- Automatic operations: "Content auto-saved to notepad!"

This ensures users are always aware when their content has been preserved automatically.

## Benefits

1. **Data Loss Prevention**: Users never lose their work when navigating away
2. **User Experience**: Smooth workflow with clear visual feedback for all auto-save operations
3. **Consistency**: Uses the same notepad infrastructure as manual copy feature
4. **Cognitive Load Reduction**: Users don't need to remember to manually save to notepad
5. **Transparent Operation**: Users always know when content has been auto-saved via visual messages

## Technical Notes

- Follows the existing pattern established by the `copyToNotepad()` function
- Maintains low cognitive complexity by reusing existing notepad functionality
- No code duplication - leverages the `addContent` function from `useNotepad` composable
- SonarQube compliant with no new quality issues introduced
- **Smart Message Display**: Automatically shows confirmation messages for all script-initiated saves
- **Message Differentiation**: Different messages for manual vs automatic operations to provide context

## How to Use

This feature is automatic and requires no user action. When editing a file:

1. Make changes to the file content
2. Navigate away (back button, browser navigation, file switching, etc.)
3. Check the notepad - your unsaved content will be there with a timestamp

The notepad can be accessed by clicking the floating notepad button in the bottom-right corner of the screen.
