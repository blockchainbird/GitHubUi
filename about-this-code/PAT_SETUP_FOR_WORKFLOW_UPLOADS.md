# PAT Setup for Workflow File Uploads

## Overview

When creating new Spec-Up-T projects, the application now fetches the `menu.yml` workflow file directly from the boilerplate repository and uploads it using a Personal Access Token (PAT). This approach eliminates hardcoded workflow files and ensures we always use the latest template.

## How It Works

1. **Fetch from Boilerplate**: The app fetches `menu.yml` from the official boilerplate repository at:

   ```text
   https://raw.githubusercontent.com/blockchainbird/spec-up-t/master/src/install-from-boilerplate/boilerplate/.github/workflows/menu.yml
   ```

2. **Upload with PAT**: Uses a PAT token to upload the workflow file to the newly created repository via GitHub API.

3. **Fallback Behavior**: If no PAT is configured, falls back to using the user's OAuth token.

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# GitHub Personal Access Token for workflow file uploads
VITE_GITHUB_PAT=ghp_your_personal_access_token_here
```

### PAT Requirements

The PAT should have the following scopes:

- `repo` - Full control of private repositories (needed to create/modify workflow files)
- `workflow` - Update GitHub Action workflows (needed to create workflow files in .github/workflows/)

### Creating a PAT

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes: `repo` and `workflow`
4. Generate and copy the token
5. Add it to your `.env` file as `VITE_GITHUB_PAT`

## Code Changes Made

### Removed Hardcoded Workflows

The following hardcoded workflow files were removed:

- `render-specs.yml`
- `set-gh-pages.yml`

Only `menu.yml` is now fetched and uploaded from the boilerplate.

### New Functions Added

```javascript
const fetchMenuYmlFromBoilerplate = async () => {
  // Fetches menu.yml content from the official boilerplate repository
}

const addWorkflowFilesFromTemplate = async (token, username, repoName) => {
  // Uses PAT to upload the fetched workflow file
}
```

### Benefits

1. **Always Current**: Uses the latest workflow file from the boilerplate
2. **Reduced Maintenance**: No need to manually update hardcoded workflows
3. **Centralized Source**: Single source of truth for workflow files
4. **Secure**: Uses PAT for authenticated uploads
5. **Lower Cognitive Complexity**: Simplified code with fewer hardcoded strings

## Error Handling

- Network errors when fetching from boilerplate are caught and reported
- Upload errors are caught and include meaningful error messages
- Graceful fallback to OAuth token if PAT is not available

This implementation follows the Copilot instructions to remove code where possible while maintaining functionality and keeping cognitive complexity low.
