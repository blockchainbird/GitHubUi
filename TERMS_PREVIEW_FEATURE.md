# Terms Preview Feature

## Overview
The Terms Preview feature provides a simple, static view of all terms and definitions in a repository without any editing capabilities or complex interactions. It's designed to give users a quick overview of the terminology used in the specification.

## Location
The "Terms Preview" button is located in the main navigation bar, visible only when viewing a repository (when repository context is available).

## Features

### Two View Modes
1. **Compact View**: Shows terms in a list format with truncated definitions
2. **Detailed View**: Shows terms in card format with full definitions and metadata

### Search and Filtering
- **Search**: Find terms by name, aliases, or definition content
- **Filter by Type**: 
  - All Terms
  - Local Terms Only (defined in the current repository)
  - External Terms Only (referenced from other specifications)

### Term Information Displayed
- **Term Name**: The primary identifier for the term
- **Aliases**: Alternative names for the same term
- **Definition**: The full definition content (supports HTML rendering)
- **Source**: Shows whether the term is local or from an external specification
- **External Spec Badge**: For external terms, shows which specification they come from

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

- **Quick Reference**: Instantly see all available terms without navigating through files
- **Search Functionality**: Find terms quickly across all definitions
- **No Editing Risk**: Pure read-only view prevents accidental modifications
- **Responsive Design**: Works well on both desktop and mobile devices
- **Consistent UI**: Follows the same design patterns as the rest of the application

## Technical Notes

- The component reuses existing terms loading logic for consistency
- Bootstrap modals provide native keyboard navigation and accessibility
- Caching ensures fast subsequent loads
- Error handling provides user feedback for loading issues
