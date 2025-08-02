# Autosave Feature Implementation

## Overview

The autosave feature provides automatic backup of file content to localStorage while editing files in both the Technical and Simple editor modes. This safeguards against accidental data loss due to browser refreshes, tab closures, or navigation away from the editor.

## Key Features

### 1. Automatic Content Backup
- **Timing**: Content is automatically saved to localStorage every 10 seconds after the last edit
- **Scope**: Works in both "Technical" (markdown) and "Simple" (terms) editor modes
- **Storage**: Uses browser's localStorage with unique keys per file

### 2. Visual Indicators
- **Autosaved Badge**: Shows "Autosaved" badge in the file header when content has been automatically saved but not yet committed
- **Warning Alert**: Displays warning message indicating unsaved changes with timestamp of last autosave
- **Timestamp Display**: Shows the time when content was last autosaved

### 3. Recovery Mechanism
- **On Page Load**: Automatically detects if autosaved content exists and differs from repository version  
- **User Choice**: Prompts user to restore autosaved content or use repository version
- **Smart Detection**: Only prompts when autosaved content actually differs from current content

### 4. Cleanup Management
- **On Successful Commit**: Automatically clears autosaved data after successful file commit
- **Manual Clear**: Users can decline to restore autosaved content, which clears it
- **Storage Efficiency**: Uses unique keys to prevent conflicts between different files

## Technical Implementation

### Composable Architecture
The feature is implemented as a Vue 3 composable (`useAutosave.js`) following the existing pattern:

```javascript
// Usage in FileEditor.vue
const autosave = useAutosave(props, content, isNewFile)
const {
  hasAutosavedContent,
  autosaveTimeDisplay,
  autosaveTimestamp,
  saveToLocalStorage,
  clearAutosave,
  restoreFromAutosave,
  checkForAutosavedContent,
  initializeAutosave
} = autosave
```

### LocalStorage Key Structure
```
autosave_{owner}_{repo}_{branch}_{path}
```

Example: `autosave_blockchainbird_GitHubUi_main_src/components/FileEditor.vue`

### Data Structure
```javascript
{
  content: "file content here...",
  timestamp: 1659456789123,
  isNewFile: false
}
```

## User Experience

### Normal Editing Flow
1. User opens file editor
2. User starts typing/editing content
3. After 10 seconds of inactivity, content is automatically saved to localStorage
4. Visual indicators show autosave status
5. User commits changes normally
6. Autosaved data is automatically cleared

### Recovery Flow
1. User returns to editor (after refresh/navigation)
2. System detects autosaved content differs from repository
3. User sees confirmation dialog with timestamp
4. User chooses to restore or discard autosaved content
5. Editor loads chosen content

### Visual Feedback
- **Header Badge**: `🌩️ Autosaved` appears when content is locally saved but not committed
- **Warning Alert**: Shows detailed message about unsaved changes with timestamp
- **Tooltip**: Hover over badge shows full explanation of autosave status

## Code Quality Considerations

### SonarQube Compliance
- **Cognitive Complexity**: Keeps functions below 15 complexity threshold
- **Code Reuse**: Reuses existing patterns and utilities
- **Error Handling**: Proper try-catch blocks with console warnings
- **Type Safety**: Uses Vue 3's composition API with proper reactive references

### Performance Optimizations  
- **Debounced Saving**: 10-second delay prevents excessive localStorage writes
- **Smart Detection**: Only saves when content actually changes
- **Efficient Cleanup**: Removes intervals and event listeners on component unmount
- **Minimal DOM Impact**: Visual indicators use lightweight badges and alerts

## File Purpose and Retention

### Created Files

#### `/src/composables/useAutosave.js`
**Purpose**: Core autosave functionality as a reusable Vue 3 composable
**Why Keep**: 
- Provides essential data protection for users
- Follows established architectural patterns
- Can be reused in other editor components
- Handles complex localStorage management logic

#### `/test/autosave.test.js`  
**Purpose**: Unit tests for autosave functionality
**Why Keep**:
- Ensures feature reliability and prevents regressions
- Documents expected behavior through test cases
- Required for SonarQube code coverage requirements
- Enables safe refactoring in the future

**How to Use**:
```bash
# Run autosave tests
npm test -- autosave.test.js

# Run all tests including autosave
npm test
```

### Modified Files
- `FileEditor.vue`: Integrated autosave composable and UI indicators
  - Added import and composable usage
  - Added visual status indicators 
  - Added recovery dialog on mount
  - Added cleanup on successful commit

## Benefits

### For Users
- **Data Protection**: Never lose work due to accidental navigation or browser issues
- **Peace of Mind**: Clear indicators show when work is safely backed up
- **Control**: Choice to restore or discard autosaved content
- **Seamless**: Works automatically without user intervention

### For Developers  
- **Maintainable**: Clean composable architecture
- **Testable**: Comprehensive unit test coverage
- **Reusable**: Can be applied to other editor components
- **Compliant**: Meets SonarQube quality standards

## Future Enhancements

### Potential Improvements
- **Conflict Resolution**: Handle cases where repository content changed while editing
- **Multiple Versions**: Store multiple autosave versions for rollback
- **Cross-Tab Sync**: Synchronize autosave across multiple browser tabs
- **Cloud Backup**: Optional cloud storage integration for autosave data
- **Configurable Timing**: Allow users to adjust autosave frequency

### Migration Path
The current implementation provides a solid foundation for these enhancements while maintaining backward compatibility and clean separation of concerns.
