# Terms Preview URL Fragment Feature

This implementation adds URL fragment support to the Terms Preview feature. Here's how it works:

## Features Added

### 1. Standalone Terms Preview Page
- **URL**: `/terms-preview/{owner}/{repo}/{branch}`
- **Example**: `http://localhost:5173/#/terms-preview/blockchainbird/GitHubUi/main`
- Full-page view of terms and definitions
- No modal overlay - clean, dedicated page
- Back navigation to file explorer
- All the same functionality as the modal version

### 2. URL Fragment Modal Access
You can now open the terms preview modal from any page by adding these fragments to the URL:
- `#terms-preview` - Opens the terms preview modal
- `#terms` - Opens the terms preview modal  
- `#definitions` - Opens the terms preview modal
- `#glossary` - Opens the terms preview modal

**Examples:**
- `http://localhost:5173/#/files/owner/repo/branch#terms`
- `http://localhost:5173/#/external-specs/owner/repo/branch#definitions`
- Any page with repository context + `#terms-preview`

### 3. Enhanced Navigation
- **MainNav** now has two terms buttons:
  - "Quick Preview" - Opens modal (existing behavior)
  - "Terms" - Navigates to standalone page (new)
- **FileExplorer** now includes fragment handling for modal access
- Automatic fragment cleanup and URL management

## How to Test

### Test Standalone Page:
1. Navigate to any repository's file explorer
2. Click the "Terms" button in the navigation (not "Quick Preview")
3. You'll be taken to the full-page terms view
4. Use the "Back" button to return to files

### Test URL Fragments:
1. Navigate to any repository page (e.g., file explorer)
2. Add `#terms` to the end of the URL in your browser
3. Press Enter - the modal should open automatically
4. The fragment will be cleaned up from the URL

### Test Navigation:
1. Copy a standalone terms URL: `/terms-preview/owner/repo/branch`
2. Paste it directly in browser - should work as a direct link
3. Share the URL - others can access terms directly

## Implementation Details

### Files Modified:
- `src/main.js` - Added new route for standalone terms preview
- `src/components/TermsPreview.vue` - Dual mode (modal + standalone)
- `src/components/MainNav.vue` - Added standalone navigation button
- `src/components/FileExplorer.vue` - Added fragment handling
- `src/utils/urlFragments.js` - New utility for fragment management

### URL Structure:
- **Modal access**: Any repository page + fragment (`#terms`)
- **Standalone access**: Direct route (`/terms-preview/owner/repo/branch`)
- **Fragment cleanup**: Automatic URL cleaning after modal opens

### Browser Support:
- Uses modern `history.replaceState()` for URL management
- Compatible with Vue Router hash mode
- Works with browser back/forward navigation
- Supports direct URL sharing

This implementation makes the terms preview more accessible and shareable while maintaining backward compatibility with the existing modal functionality.
