# Terms File Detection Simplification

This document explains the refactoring of the terms file detection logic in the Spec-Up-T Editor.

## Changes Made

### 1. Created a new utility file: `src/utils/termsFileDetection.js`

- Contains a single function `isInTermsDirectory()` that determines if a file is a terms file
- **SINGLE CONDITION**: A file is considered a terms file if and only if it is located in the `spec_terms_directory` as defined in the specs configuration

### 2. Refactored `src/composables/useContentValidation.js`

- Removed the complex `checkIfInTermsDirectory()` function
- Now imports and uses the simplified `isInTermsDirectory()` utility
- Validation rules are only applied to files in the terms directory

### 3. Simplified `src/components/FileEditor.vue`

- Removed the `wasDetectedAsTermsFile` reactive reference and all its complex logic
- Replaced the complex `isTermsFileComputed` computed property with a simple one that only calls `isInTermsDirectory()`
- Removed all manual state tracking for terms file detection
- Cleaned up the path watcher to remove references to `wasDetectedAsTermsFile`

## Benefits

1. **Reduced Complexity**: Eliminated the cognitive overhead of multiple detection mechanisms
2. **Single Source of Truth**: One function determines if a file is a terms file
3. **No Duplication**: Removed duplicate logic between different components
4. **Cleaner Code**: Removed debugging console logs and complex state management
5. **Maintainable**: Easy to understand and modify the terms detection logic

## Current Status

✅ **Completed**:

- Simplified terms file detection to use only directory-based logic
- Removed complex state tracking and content-based detection
- Reduced cognitive complexity significantly
- **Fixed validation functionality**: Content validation now works correctly

✅ **How it Works**:

- **Single Condition**: A file is a terms file if and only if it's in the `spec_terms_directory`
- **No Filename Checks**: Filename content is irrelevant for detection
- **Validation Timing**: Validation waits for specs config to be loaded before running

## How it Works Now

The terms file detection is now based on a single, simple rule:

- If the file path is within the `spec_terms_directory` (as configured in the specs config), then it's a terms file
- Otherwise, it's not a terms file
- **Important**: Validation waits for the specs config to be loaded before running

This eliminates the need for:

- Content-based detection
- Filename pattern matching
- State tracking across component lifecycles
- Complex conditional logic

## Files Created

- `src/utils/termsFileDetection.js` - New utility for centralized terms file detection

## Why This File Should Stay

This utility file should remain because:

1. It provides a centralized location for terms file detection logic
2. It ensures consistency across all components that need to determine if a file is a terms file
3. It makes the codebase easier to maintain by having a single function to modify if the detection logic needs to change
4. It reduces code duplication and follows the DRY principle
5. It keeps cognitive complexity low by providing a simple, single-purpose utility
