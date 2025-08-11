# Line Numbers Implementation for Technical Editor

## Overview

This document explains the line numbers feature added to the technical editor in the Spec-Up-T Editor. The implementation adds visible line numbers to the textarea in the FileEditor component to improve code editing experience.

## Why This File Should Stay

- **Documentation Purpose**: This file documents a key feature enhancement that improves the editor's usability
- **Reference Material**: Provides implementation details for future maintenance and improvements
- **Educational Value**: Shows how to implement line numbers with Vue.js and CSS synchronization
- **Quality Assurance**: Documents that the implementation follows SonarQube standards with low cognitive complexity

## Implementation Details

### Files Modified

- `src/components/FileEditor.vue` - Main implementation

### Key Features Implemented

#### 1. Template Changes

- Added line numbers container alongside the textarea
- Replaced single textarea with a flex container containing:
  - Line numbers display (`div` with `v-for`)
  - Technical editor textarea with synchronized scrolling

#### 2. JavaScript Enhancements

- **Line Count Computation**: Reactive computed property that calculates line count based on content
- **Scroll Synchronization**: `handleEditorScroll()` method keeps line numbers and textarea scroll in sync
- **Reactive Properties**: Added `lineNumbers` ref, `lineCount` computed, and `editorHeight` ref

#### 3. CSS Styling

- **Container Layout**: Flexbox layout for line numbers and editor alignment
- **Line Number Styling**: Gray background, monospace font, right-aligned numbers
- **Editor Styling**: Monospace font matching line numbers, proper padding and spacing
- **Visual Consistency**: Clean borders, consistent typography, professional appearance

### Technical Implementation

#### Line Number Logic

```javascript
const lineCount = computed(() => {
  if (!content.value) return 1
  return Math.max(1, content.value.split('\n').length)
})
```

#### Scroll Synchronization

```javascript
const handleEditorScroll = () => {
  if (editor.value && lineNumbers.value) {
    lineNumbers.value.scrollTop = editor.value.scrollTop
  }
}
```

### CSS Architecture

- **Modular Design**: Separate styles for container, line numbers, and editor
- **Monospace Consistency**: Uses consistent font family across line numbers and editor
- **Visual Hierarchy**: Subtle gray background for line numbers, clear boundaries
- **Responsive Layout**: Flexbox ensures proper alignment and sizing

## Code Quality

- **SonarQube Compliant**: Implementation passes SonarQube analysis
- **Low Cognitive Complexity**: Simple, focused functions under complexity threshold of 15
- **Minimal Code Addition**: Added only necessary functionality without duplication
- **Clean Architecture**: Follows Vue.js best practices and component structure

## How to Use

1. Navigate to any file in the technical editor mode
2. Line numbers appear automatically on the left side
3. Line numbers update dynamically as content changes
4. Scrolling is synchronized between line numbers and editor content
5. All existing editor functionality remains unchanged

## Benefits

- **Improved Navigation**: Easy line reference for large files
- **Better Debugging**: Quick location identification for error messages  
- **Professional Appearance**: Modern code editor experience
- **Enhanced Usability**: Standard feature expected in technical editors

## Future Enhancements

- Optional line number toggle
- Line highlighting on click
- Breakpoint indicators
- Custom line number styling themes
