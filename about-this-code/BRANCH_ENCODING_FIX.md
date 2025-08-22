# Branch Name URL Encoding Fix

## Problem

Branch names containing forward slashes (like `integrate/main`) were breaking the Vue Router because the router was interpreting the slash as a path separator. This resulted in incorrect route parameter parsing and prevented the editor from working with hierarchical branch names.

## Root Cause

Vue Router path parameters like `:branch` in routes such as `/files/:owner/:repo/:branch` don't handle forward slashes within parameter values. When a URL like `/#/files/henkvancann/tswg-cesr-specification/integrate/main` was processed:

- `:owner` = "henkvancann" ✅
- `:repo` = "tswg-cesr-specification" ✅ 
- `:branch` = "integrate" ❌ (should be "integrate/main")
- "main" becomes unmatched, breaking the route

## Solution

Implemented URL encoding/decoding for branch names throughout the application:

### 1. Created Branch Utilities (`src/utils/branchUtils.js`)
- `decodeBranchName(branch)` - Safely decodes URL-encoded branch names
- `buildRoutePath(basePath, owner, repo, branch, additional)` - Builds routes with properly encoded branch names

### 2. Updated Navigation Components
- **HomePage.vue**: Encode branch names when navigating to repositories
- **MainNav.vue**: Updated all route-based navigation to handle encoded branches
- **FileExplorer.vue**: Decode branch for API calls, encode for navigation
- **FileEditor.vue**: Decode branch for internal use, maintain encoding for routes

### 3. Updated API Components  
- **AdminScreen.vue**: Decode branch names for GitHub API calls
- **TermsPreview.vue**: Handle branch decoding for navigation
- **useFileContent.js**: Updated to accept decoded branch parameter

### 4. Consistent Pattern
- **For navigation**: Use `buildRoutePath()` utility to ensure proper encoding
- **For API calls**: Use `decodedBranch.value` to get the actual branch name
- **For display**: Use decoded branch names for user-facing elements

## Characters That Could Cause Issues

Git allows these characters in branch names that could interfere with URLs:
- **Forward slash (/)** - Primary issue fixed ✅
- **Plus (+)** - Can interfere with URL encoding
- **Percent (%)** - Can interfere with URL encoding  
- **Question mark (?)** - Used for query parameters
- **Hash (#)** - Used for URL fragments
- **Ampersand (&)** - Used for query parameters

The implemented solution handles all of these through `encodeURIComponent()` and `decodeURIComponent()`.

## Testing

To test with a branch containing slashes:
1. Create a branch like `feature/new-feature` or `integrate/main`
2. Navigate to the repository through the UI
3. Verify the URL shows the encoded branch name (e.g., `integrate%2Fmain`)
4. Verify the application correctly displays and uses the decoded branch name internally
5. Verify GitHub API calls work correctly with the decoded branch name

## Benefits

- ✅ Hierarchical branch names now work correctly
- ✅ All special characters in branch names are handled safely
- ✅ Backward compatibility maintained for simple branch names
- ✅ Consistent encoding/decoding pattern across the application
- ✅ No breaking changes to existing functionality

## Example URLs

Before fix (broken):
```
/#/files/henkvancann/tswg-cesr-specification/integrate/main
```

After fix (working):
```
/#/files/henkvancann/tswg-cesr-specification/integrate%2Fmain
```

The branch name `integrate/main` is properly encoded as `integrate%2Fmain` in URLs and correctly decoded for internal use and API calls.
