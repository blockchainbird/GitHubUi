# Reference Sets Feature

## Overview

The External Specifications Manager now supports importing external specifications from curated reference sets hosted in the [spec-up-gs repository](https://github.com/blockchainbird/spec-up-gs/tree/main/external-reference-sets).

## How It Works

### 1. Reference Sets Location

External reference sets are stored in:

```text
https://github.com/blockchainbird/spec-up-gs/tree/main/external-reference-sets
```

Currently available sets:

- `set1.json` - External Reference Specifications for Glossaries (Set 1)
- `set2.json` - External Reference Specifications for Glossaries (Set 2)

### 2. Reference Set Structure

Each reference set follows this JSON structure:

```json
{
    "title": "Human-readable title",
    "description": "Description of the set",
    "creator": "Creator name",
    "date": "YYYY-MM-DD",
    "identifier": "unique_set_id",
    "type": "Dataset",
    "references": [
        {
            "external_spec": "spec_id",
            "gh_page": "https://example.github.io/spec/",
            "url": "https://github.com/user/repo",
            "terms_dir": "spec/terms-definitions"
        }
    ]
}
```

### 3. Using Reference Sets in the UI

#### Accessing Reference Sets

1. Navigate to the External Specifications Manager
2. Select the "Reference Sets" option (alongside "Single" and "Bulk Import")

#### Browsing Available Sets

- The system automatically fetches all available reference sets from the GitHub repository
- Each set displays its metadata: title, description, creator, date, and number of references
- Click the "Refresh Sets" button to reload available sets

#### Previewing a Reference Set

1. Click the "Preview" button on any reference set card
2. A modal will open showing:
   - Set metadata (title, description, creator, date, type)
   - Complete list of all references in the set
   - Links to GitHub pages and repositories

#### Importing References

1. **Quick Import**: Click the "Import" button directly on a reference set card
2. **Preview Import**: Click "Preview" first, then "Import References" in the modal

The system will:

- Validate all references before importing
- Check for duplicate specification IDs
- Show a confirmation with import results
- Skip duplicates and report how many were imported/skipped

## Technical Implementation

### Key Functions

#### `loadReferenceSets()`

- Fetches directory listing from GitHub API
- Loads metadata for each JSON file
- Handles errors gracefully

#### `selectReferenceSet(set)`

- Sets the selected reference set for preview
- Opens the preview modal

#### `importReferenceSet()`

- Validates references using existing validation logic
- Checks for duplicates against current external specs
- Imports non-duplicate, valid specifications
- Provides user feedback on import results

### Error Handling

- Network errors when fetching reference sets
- Invalid JSON structure in reference sets
- Validation errors in individual references
- Duplicate specification ID handling

### User Experience Features

- Loading states during fetch operations
- Clear error messages
- Preview functionality before importing
- Duplicate detection and user choice
- Import success/failure feedback

## Benefits

1. **Curated Collections**: Access to professionally curated sets of external specifications
2. **Time Saving**: Quick import of multiple related specifications
3. **Quality Assurance**: All references are pre-validated and tested
4. **Community Sharing**: Shared repository allows community contributions
5. **Version Control**: Reference sets are version controlled in GitHub

## Future Enhancements

Potential improvements:

- Custom reference set creation and sharing
- Reference set versioning support
- Advanced filtering and search
- Import history tracking
- Batch operations on imported sets

## File Purpose and Usage

This file documents the Reference Sets feature implementation. It should be kept as:

- **Documentation**: Explains the feature for developers and users
- **Integration Guide**: Shows how to use the feature effectively  
- **Technical Reference**: Documents the implementation details

The file helps maintain the feature by providing clear documentation of its purpose, structure, and usage patterns.
