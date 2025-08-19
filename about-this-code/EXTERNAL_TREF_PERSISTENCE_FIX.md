# External TREF Persistence Fix

## Problem

After commit `55f9c74699a1c6233dbdb8376bedbee1da5b2701`, external term references (`tref`) were no longer persistent and showed "Definition not found for &lt;term&gt;" in the preview until manually refreshing external terms.

## Root Cause Analysis

**Before the optimization:**

- `initializeTerms()` was called on component mount
- This function loaded both specs config AND attempted to load all terms from localStorage cache
- External terms (fetched via HTTP from remote specs) were included in the cache and available for preview

**After the optimization:**

- Only `loadSpecsConfig()` was called to avoid expensive GitHub API calls for local terms
- `loadTermsForFile()` was only called for terms files, but this function only loaded local terms from the current file
- External terms were never loaded unless explicitly refreshing terms via the modal

## Solution

Created a new function `loadCachedTermsOnly()` that:

1. **Loads only external terms from localStorage cache** - doesn't cost PAT tokens since external terms are fetched via HTTP
2. **Preserves the optimization** - still avoids loading all local repository terms unnecessarily
3. **Ensures external terms are available for preview** - loads cached external terms on component mount

### Key Changes

#### 1. New Function: `loadCachedTermsOnly()`

```javascript
// Load cached terms (external terms from localStorage) without fetching local repository terms
const loadCachedTermsOnly = () => {
  const storageKey = `terms_${props.owner}_${props.repo}_${props.branch}`
  const stored = localStorage.getItem(storageKey)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (Date.now() - parsed.timestamp < 3600000) { // 1 hour cache
        // Only load external terms from cache to avoid overwriting local file terms
        const externalTerms = (parsed.terms || []).filter(term => term.external)
        if (externalTerms.length > 0) {
          terms.value = externalTerms
          filteredTerms.value = externalTerms
          console.log(`Loaded ${externalTerms.length} external terms from cache`)
          return true
        }
      }
    } catch (err) {
      console.error(consoleMessages.errorParsingStoredTerms(err.message))
    }
  }
  return false
}
```

#### 2. Enhanced `loadTermsForFile()` Function

- Now combines local file terms with cached external terms
- Preserves external terms when updating the cache
- Ensures both local and external terms are available

#### 3. Updated FileEditor Component

```javascript
onMounted(async () => {
  // Initialize specsConfig only
  await loadSpecsConfig()
  
  // Load cached external terms for preview functionality (doesn't cost PAT tokens)
  loadCachedTermsOnly()
  
  // Load file content
  await loadFileContent()
  
  // If terms file, load local terms and combine with external
  if (isTermsFileComputed.value) {
    await termsManagement.loadTermsForFile(decodedPath.value, content.value)
  }
})
```

## Benefits

1. **Preserves the PAT token optimization** - Still doesn't load all local repository terms unnecessarily
2. **Restores external term persistence** - External terms are loaded from cache and available immediately
3. **No additional HTTP costs** - External terms don't cost PAT tokens since they're fetched via regular HTTP
4. **Maintains user experience** - Preview functionality works immediately without requiring manual refresh

## Technical Details

- External terms are identified by the `term.external` property
- Cache key format: `terms_${owner}_${repo}_${branch}`
- Cache TTL: 1 hour (3600000ms)
- External terms are fetched from remote HTML pages via CORS proxies, not GitHub API
- Local terms are still loaded efficiently only when needed (single file or explicit refresh)

## Files Modified

- `src/composables/useTermsManagement.js` - Added `loadCachedTermsOnly()` function and enhanced `loadTermsForFile()`
- `src/components/FileEditor.vue` - Updated mount lifecycle to call `loadCachedTermsOnly()`

This fix ensures that external term references remain persistent and functional while preserving the performance optimization for local terms.
