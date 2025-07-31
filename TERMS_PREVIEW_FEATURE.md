# Terms Preview Feature

## Overview

The Terms Preview feature provides a simple, static view of all terms and definitions in a repository without any editing capabilities or complex interactions. It scans multiple sources for term definitions, including traditional terms directories and external specifications, giving users a comprehensive overview of all terminology used in the specification.

## Location

The "Terms Preview" button is located in the main navigation bar, visible only when viewing a repository (when repository context is available).

## Features

### Multiple Term Sources
- **Terms Directory**: Traditional `spec/terms-definitions` folder structure
- **External Specifications**: Terms referenced from other specifications

### Two View Modes
1. **Compact View**: Shows terms in a list format with truncated definitions
2. **Detailed View**: Shows terms in card format with full definitions and metadata

### Search and Filtering

- **Search**: Find terms by name, aliases, definition content, or source location
- **Filter by Source**:
  - All Terms
  - Local Terms (Terms Dir) - from traditional terms directory
  - External Terms - from other specifications

### Term Information Displayed

- **Term Name**: The primary identifier for the term
- **Aliases**: Alternative names for the same term
- **Definition**: The full definition content (supports HTML rendering)
- **Source Badge**: Visual indicator showing term origin:
  - 🗂️ **Terms**: From traditional terms directory (blue)
  -  **External**: From external specifications (green)
- **File Location**: Shows which file contains the term definition

## Implementation Details

### Components
- `TermsPreview.vue`: The main modal component
- Integrated into `MainNav.vue` for easy access

### Technology Stack
- **Vue 3**: Reactive framework
- **Bootstrap 5**: Modal system and styling
- **Existing Terms Management**: Reuses the `useTermsManagement` composable

### Data Loading
- Automatically loads terms when the modal is opened
- Uses caching from the existing terms management system
- Handles both local terms (from repository files) and external terms (from other specifications)

### Modal Behavior
- Opens via Bootstrap modal system
- Loads data on show event
- Cleans up state when closed
- Responsive design for mobile and desktop

## Usage Instructions

1. Navigate to any repository view in the application
2. Look for the "Terms Preview" button in the navigation bar (book icon)
3. Click the button to open the preview modal
4. Use the search box to find specific terms
5. Switch between compact and detailed views using the toggle buttons
6. Filter by term type (all, local, external) using the dropdown
7. Close the modal when finished

## Benefits

- **Comprehensive Coverage** - Finds ALL terms from everywhere in the repository
- **Smart Organization** - Groups terms by source with visual indicators
- **Flexible Filtering** - Filter by specific source types
- **Spec-Up-T Styling** - Uses authentic spec-up-t colors and design patterns
- **Multiple Terms per File** - Extracts all term definitions from each file
- **Performance Optimized** - Batch loading and intelligent caching
- **Error Resilient** - Gracefully handles missing directories
- **Responsive Design** - Mobile-friendly interface
- **Debug Logging** - Console output for troubleshooting

## Technical Improvements

### Enhanced Term Extraction
- **Multi-term Support**: Now extracts ALL terms from each file, not just the first one
- **Robust Parsing**: Better handling of term definition boundaries
- **Source Attribution**: Clear labeling of term origins (Terms Dir, Root, External)

### Styling Enhancements
- **Spec-Up-T Color Palette**: Authentic colors matching the original spec-up-t design
- **Professional Typography**: Improved readability with proper font hierarchy  
- **Visual Hierarchy**: Clear distinction between term types with badges and borders
- **Hover Effects**: Subtle animations for better user experience

### Debugging Features
- **Console Logging**: Detailed output showing:
  - Files being scanned
  - Terms found in each file
  - Loading progress and statistics
  - Error details when issues occur

## Technical Notes

- The component reuses existing terms loading logic for consistency
- Bootstrap modals provide native keyboard navigation and accessibility
- Caching ensures fast subsequent loads
- Error handling provides user feedback for loading issues
