# Split View Feature Implementation

## Overview

The Split View feature has been added to the FileEditor component to allow users to view and work with all three editing modes simultaneously: Simple Editor, Technical Editor, and Preview, all displayed side by side.

## Key Features

### 1. New Split View Mode

- Added a fourth view mode called "Split View" alongside Simple, Technical, and Preview modes
- Accessible only to advanced users and only for terms files
- Uses a three-column layout with optimal space distribution

### 2. Full Viewport Width Utilization

- Modified container structure to use `container-fluid` instead of `container`
- Removes column width restrictions when in split view mode
- Utilizes full available viewport width for maximum screen real estate

### 3. Layout Distribution

- **Simple Editor**: 30% width (left column)
- **Technical Editor**: 40% width (middle column)
- **Preview**: 30% width (right column)
- Each pane has a minimum width to prevent content from becoming unusable

### 4. Responsive Design

- On screens smaller than 1200px, the split view automatically converts to a vertical stack
- Each pane becomes a fixed height section to maintain usability
- Maintains responsive behavior for mobile and tablet devices

## Implementation Details

### Components Modified

- **FileEditor.vue**: Main component with all split view logic and styling

### New UI Elements

- Split View button with three-column icon (`bi-layout-three-columns`)
- Individual pane headers for each section
- Specialized toolbar sizing for technical editor in split view

### CSS Features

- Flexible box layout with proper minimum widths
- Individual scroll areas for each pane
- Consistent header styling across all panes
- Smaller toolbar buttons in split view to save space

### Technical Considerations

- Added `splitEditorHeight` computed property for proper height management
- Maintained all existing functionality in individual view modes
- Preserved line number synchronization in technical editor
- Kept all editor features functional in the split view

## Usage

### Access Requirements

- Must be an advanced user
- Must be editing a terms file (file in terms directory)

### How to Use

1. Open a terms file in the editor
2. Click the "Split View" button (three-column icon) in the mode selector
3. All three views will be displayed simultaneously:
   - Edit content in Simple Editor (left)
   - See technical markup in Technical Editor (middle)
   - View rendered result in Preview (right)
4. Changes made in any view are synchronized across all views

### Benefits

- **Improved Workflow**: See all representations simultaneously
- **Better Understanding**: Understand the relationship between simple input, technical markup, and final output
- **Faster Editing**: No need to switch between modes to check results
- **Full Context**: Have complete visibility of the editing process

## Browser Compatibility

- Works on modern browsers that support CSS Flexbox
- Responsive design adapts to different screen sizes
- Gracefully degrades on smaller screens

## Future Enhancements

Potential improvements could include:

- Adjustable pane sizes with drag handles
- Collapsible panes for temporary focus
- Customizable layout preferences
- Full-screen mode for individual panes within split view

This feature provides a comprehensive editing experience while maintaining the simplicity and functionality of the existing individual view modes.
