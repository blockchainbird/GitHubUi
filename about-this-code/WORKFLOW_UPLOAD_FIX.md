# Workflow Upload Fix - "Not Found" Error Resolution

## Problem Description

When running the Spec-Up-T Editor on a new test computer without proper Personal Access Token (PAT) setup, users encountered this error when creating new repositories:

```
# Workflow Upload Fix - "Not Found" Error Resolution

## Problem Description

When running the Spec-Up-T Editor and trying to create new repositories, users encountered this error:

```
Error: Failed to upload .github/workflows/initialize-spec-up-t.yml: Not Found
```

This error appeared even when users were logged in with Personal Access Tokens (PATs).

## Root Cause Analysis

The error occurred due to **flawed token detection logic** in the workflow upload system:

### 1. **Token Type Confusion**
- The app supports **two ways** to use Personal Access Tokens:
  - **Login PAT**: User enters PAT through login form → stored as `github_token` in localStorage
  - **Environment PAT**: Administrator sets PAT in `.env` file as `VITE_GITHUB_PAT`
- The original code only detected PATs when `VITE_GITHUB_PAT` environment variable existed
- Users logging in with PATs were incorrectly identified as using "OAuth tokens"

### 2. **PAT vs OAuth Token Differences**

#### **Personal Access Token (PAT)**
- **What it is**: A token manually created in GitHub Settings → Developer settings → Personal access tokens
- **Format**: Always starts with `ghp_` for classic tokens
- **Permissions**: User explicitly chooses scopes (like `repo`, `workflow`, etc.) when creating it
- **Usage**: Full control over GitHub API operations based on selected scopes
- **In this app**: Can be used as login token OR set as environment variable

#### **OAuth Token**  
- **What it is**: A token automatically created when logging in through GitHub's OAuth flow
- **Format**: Different format, doesn't start with `ghp_`
- **Permissions**: Limited to what the OAuth application was granted permission for
- **Usage**: User authentication and basic operations only
- **Limitations**: May not have permissions for sensitive operations like creating workflow files

### 3. **Detection Logic Problem**
The original logic was:
```javascript
const usingPAT = !!import.meta.env.VITE_GITHUB_PAT
```

This failed to detect PATs used through the login form, causing users with login PATs to receive OAuth-related error messages.

## Solution Implemented

### 1. **Improved Token Detection**

```javascript
// New detection logic that covers both PAT sources
const effectiveToken = import.meta.env.VITE_GITHUB_PAT || token

// Detect if we're using a PAT (either from env var or login token that starts with ghp_)
const isUsingPAT = !!import.meta.env.VITE_GITHUB_PAT || (token && token.startsWith('ghp_'))
```

### 2. **Context-Aware Error Messages**

**For OAuth tokens:**
```
Failed to create GitHub Actions workflow. This usually happens because your GitHub OAuth token doesn't have sufficient permissions to create workflow files.

To fix this issue:
1. Contact the administrator to set up a Personal Access Token (PAT) with 'repo' scope
2. Or manually create the workflow file in your repository later
```

**For PATs with permission issues:**
```
Failed to create GitHub Actions workflow. Even though you're using a Personal Access Token, there may be a permissions issue.

Possible causes:
1. Your PAT might not have the 'repo' scope enabled
2. The repository might have Actions disabled
3. There could be organization-level restrictions

Please check your token permissions or contact your GitHub administrator.
```

### 3. **Enhanced Error Handling**

```javascript
// Check for permission-related errors in uploadFile function
if (response.status === 403 || response.status === 404) {
  throw new Error(`Failed to upload ${filePath}: ${errorData.message}. This may be due to insufficient permissions. Please ensure you have a Personal Access Token (PAT) configured with 'repo' scope.`)
}
```

## How the Fix Works

### Token Detection Flow

1. **Check Environment PAT**: `import.meta.env.VITE_GITHUB_PAT`
2. **Check Login Token Format**: Does `token` start with `ghp_`?
3. **Determine Token Type**: PAT if either condition is true
4. **Provide Appropriate Error**: Different messages for PAT vs OAuth issues

### Error Handling Flow

1. **Attempt Upload**: Try to create workflow file
2. **Detect Error Type**: Check HTTP status (403/404 indicate permissions)
3. **Analyze Token Type**: Use improved detection logic
4. **Provide Guidance**: Give specific, actionable error messages

## Prevention and Setup

### For Users with PATs
If you have a PAT with proper `repo` scope and still get errors:

1. **Verify PAT Scopes**: 
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Ensure your token has `repo` scope checked
   
2. **Check Repository Actions**:
   - Repository Settings → Actions → General
   - Ensure Actions are enabled

3. **Organization Restrictions**:
   - Some organizations restrict workflow creation
   - Contact your GitHub organization admin

### For Administrators
To prevent this issue entirely:

1. **Set Environment PAT**:
   ```bash
   # Add to .env file
   VITE_GITHUB_PAT=ghp_your_personal_access_token_here
   ```

2. **PAT Requirements**:
   - Must have `repo` scope (full control of private repositories)
   - Should be from a user with appropriate organization permissions

## Technical Details

### Detection Pattern
- **Environment PAT**: `import.meta.env.VITE_GITHUB_PAT` exists
- **Login PAT**: `token.startsWith('ghp_')` is true
- **OAuth Token**: Neither of the above conditions is true

### Error Conditions
- **HTTP 403**: Forbidden (token lacks permissions)
- **HTTP 404**: Not Found (repository/path doesn't exist OR lacks permissions)
- **String patterns**: "insufficient permissions", "Not Found"

### Fallback Behavior
- **Critical workflows** (`initialize-spec-up-t.yml`): Fail with helpful error message
- **Non-critical workflows** (`menu.yml`): Continue with warning
- **Repository creation**: Always succeeds regardless of workflow upload status

## Testing Results

✅ **With Environment PAT**: Workflow files upload successfully  
✅ **With Login PAT**: Proper PAT detection and upload  
✅ **With OAuth Token**: Clear error message explaining limitations  
✅ **With Insufficient Permissions**: Specific guidance based on token type  

This fix resolves the confusion between token types and provides users with accurate, actionable guidance based on their actual authentication method.
```

## Root Cause Analysis

The error occurred due to **insufficient permissions** when using OAuth tokens to create GitHub Actions workflow files. Here's why:

### 1. **OAuth Token Limitations**
- Regular OAuth tokens from GitHub login may not have sufficient permissions to create files in the `.github/workflows` directory
- The GitHub API requires specific permissions to create workflow files
- OAuth tokens typically have user-level permissions but may lack repository workflow creation rights

### 2. **Missing PAT Configuration**
- The application was designed to use Personal Access Tokens (PAT) for workflow file uploads
- On new test computers, the `VITE_GITHUB_PAT` environment variable wasn't configured
- Without PAT, the system fell back to OAuth tokens which had insufficient permissions

### 3. **Directory Structure Issues**
- The `.github/workflows` directory might not exist in newly created repositories
- GitHub API expects the directory structure to be in place for file uploads

## Solution Implemented

### 1. **Enhanced Error Handling**

```javascript
// Improved uploadFile function with better error messages
const uploadFile = async (token, username, repoName, filePath, content, message) => {
  // ... upload logic ...
  
  if (!response.ok) {
    const errorData = await response.json()
    
    // Check for permission-related errors
    if (response.status === 403 || response.status === 404) {
      throw new Error(`Failed to upload ${filePath}: ${errorData.message}. This may be due to insufficient permissions. Please ensure you have a Personal Access Token (PAT) configured with 'repo' scope.`)
    }
    
    throw new Error(`Failed to upload ${filePath}: ${errorData.message}`)
  }
}
```

### 2. **PAT Fallback with User Guidance**

```javascript
// Try to use PAT token if available, otherwise fallback to OAuth token
const effectiveToken = import.meta.env.VITE_GITHUB_PAT || token
const usingPAT = !!import.meta.env.VITE_GITHUB_PAT

try {
  await uploadFile(effectiveToken, username, repoName, workflowPath, content, message)
  console.log(`Successfully uploaded workflow using ${usingPAT ? 'PAT' : 'OAuth token'}`)
} catch (error) {
  // Provide helpful error message for permission issues
  if (!usingPAT && (error.message.includes('insufficient permissions') || error.message.includes('Not Found'))) {
    throw new Error(`Failed to create GitHub Actions workflow. This usually happens because your GitHub OAuth token doesn't have sufficient permissions to create workflow files. 

To fix this issue:
1. Contact the administrator to set up a Personal Access Token (PAT) with 'repo' scope
2. Or manually create the workflow file in your repository later

The repository was created successfully, but you'll need to set up the workflow manually.`)
  }
  throw error
}
```

### 3. **Non-Critical Workflow Handling**

For the `menu.yml` workflow (which is less critical), the system now continues even if upload fails:

```javascript
try {
  await uploadFile(patToken, username, repoName, '.github/workflows/menu.yml', content, message)
} catch (uploadError) {
  if (!usingPAT && (uploadError.message.includes('insufficient permissions') || uploadError.message.includes('Not Found'))) {
    console.warn('Failed to upload menu.yml workflow file due to permissions. This is non-critical.')
    return // Don't fail the entire process
  }
  throw uploadError
}
```

## How to Prevent This Issue

### For Administrators

1. **Set up PAT in Environment Variables**:
   ```bash
   # Add to .env file
   VITE_GITHUB_PAT=ghp_your_personal_access_token_here
   ```

2. **PAT Requirements**:
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Select scopes: `repo` (full control of private repositories)
   - Generate and copy the token
   - Add it to your `.env` file as `VITE_GITHUB_PAT`

### For Users

If you encounter this error:

1. **Contact Administrator**: Ask them to set up the PAT as described above
2. **Manual Workaround**: The repository is still created successfully - you can manually add workflow files later
3. **Check Repository**: Your repository should be created and accessible, just without automated workflow setup

## Technical Details

### Error Conditions That Trigger This Fix

- HTTP 403 (Forbidden) responses from GitHub API
- HTTP 404 (Not Found) responses from GitHub API
- Error messages containing "insufficient permissions"
- Error messages containing "Not Found"

### Workflow File Types Affected

1. **`initialize-spec-up-t.yml`** (Critical): Used for project initialization
2. **`menu.yml`** (Non-critical): Used for ongoing project operations

### Fallback Behavior

- If PAT is available → Use PAT for all operations
- If PAT is not available → Use OAuth token with enhanced error messages
- If upload fails for critical workflows → Fail with helpful error message
- If upload fails for non-critical workflows → Continue with warning

## Testing

To test this fix:

1. **With PAT**: Set `VITE_GITHUB_PAT` and verify workflow files are uploaded successfully
2. **Without PAT**: Remove `VITE_GITHUB_PAT` and verify helpful error messages are shown
3. **Permission Issues**: Test with tokens that have insufficient permissions

## Benefits

1. **Better User Experience**: Clear error messages explaining what went wrong and how to fix it
2. **Graceful Degradation**: Repository creation succeeds even if workflow upload fails
3. **Flexible Authentication**: Works with both PAT and OAuth tokens
4. **Reduced Support Burden**: Users get actionable guidance instead of cryptic errors

This fix maintains the Copilot instructions by keeping cognitive complexity low and providing clear, actionable error handling.
