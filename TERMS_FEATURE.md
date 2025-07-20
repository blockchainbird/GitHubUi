# Term Reference Feature

## Overview

The WYSIWYG editor now includes a **Term Reference** feature that allows you to easily insert references to terms defined in your specification documents and external specifications.

## How it works

### 1. Term Collection
- The feature reads the `specs.json` file from your repository root to get configuration
- It looks for terms in the `spec_directory/spec_terms_directory` path (e.g., `./spec/terms-definitions`)
- **NEW**: It also loads terms from external specifications listed in `external_specs`
- Terms are extracted from the first line of each file that matches this pattern:
  ```
  [[def: term-id, alias1, alias2, ...]]
  ```
- **External terms** are extracted from GitHub pages using `<dl class="terms-and-definitions-list">` elements

### 2. Caching
- Terms are cached in browser localStorage for 1 hour to reduce API calls
- Cache key includes repository owner, repo name, and branch to avoid conflicts
- Use the "Refresh Terms" button to force reload from repository

### 3. Usage in Editor
1. Click the bookmark icon (📖) in the editor toolbar
2. A modal opens showing all available terms
3. Use the search box to filter terms by name or alias
4. Click on any term to insert the appropriate reference:
   - Local terms: `[[ref: term-id]]`
   - External terms: `[[tref: external_spec, term-id]]`

### 4. External Specifications
The feature now supports external specifications defined in `specs.json`:
```json
"external_specs": [
  {
    "external_spec": "toip1",
    "gh_page": "https://henkvancann.github.io/ctwg-main-glossary/",
    "url": "https://github.com/henkvancann/ctwg-main-glossary",
    "terms_dir": "spec/terms-definitions"
  }
]
```

External terms are:
- Loaded from GitHub Pages specified in `gh_page`
- Extracted from `<dl class="terms-and-definitions-list">` elements
- Displayed with a green link icon and "External" badge
- Inserted as `[[tref: external_spec, term-id]]` format

### 5. Configuration
The feature expects a `specs.json` file in the repository root with this structure:
```json
{
  "specs": [
    {
      "spec_directory": "./spec",
      "spec_terms_directory": "terms-definitions"
    }
  ]
}
```

### 5. Term Definition Format
Term files should start with a definition line:
```
[[def: abandoned-identifier, abandoned identifier]]

The rest of the file contains the term definition...
```

Where:
- `abandoned-identifier` is the term ID used for references
- `abandoned identifier` is an alias (optional, can have multiple aliases separated by commas)

### 6. Error Handling
- If `specs.json` is not found, defaults to `./specs/terms-definitions`
- If terms directory doesn't exist, shows appropriate error message
- Network errors and rate limiting are handled gracefully
- Invalid term definitions are skipped silently

### 7. Features
- ✅ Automatic caching with 1-hour expiration
- ✅ Search/filter terms by name or alias
- ✅ Scrollable term list for large collections
- ✅ Branch-specific caching
- ✅ One-click term insertion at cursor position
- ✅ Visual feedback and loading states
- ✅ Error handling for missing directories/files

## Benefits
- Reduces manual typing and errors
- Ensures consistent term references across documents
- Saves GitHub API rate limits through intelligent caching
- Works with any branch of your repository
