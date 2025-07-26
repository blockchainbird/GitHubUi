# GitHub Actions Integration

## Overview

The GitHubUI web application now supports triggering GitHub Actions workflows directly from the browser. This enables you to run complex spec-up-t operations (like PDF/DOCX generation, freezing, and custom updates) that require server-side processing via GitHub's cloud infrastructure.

## How It Works

### GitHub Actions Workflow Dispatch API

The integration uses GitHub's **Workflow Dispatch API** to trigger workflows:

```javascript
POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches
```

### Authentication & Permissions

Your existing GitHub Personal Access Token automatically includes the necessary permissions:
- ✅ `repo` scope includes `actions:write` permission
- ✅ No additional token configuration required

### Workflow Selection Logic

The system intelligently selects workflows to trigger:

1. **Primary Selection**: Workflows with names containing:
   - "spec" (e.g., "Spec-Up-T Actions")
   - "build" (e.g., "Build Documentation")
   - "deploy" (e.g., "Deploy to Pages")

2. **Fallback**: If no matching workflows found, uses the first active workflow

3. **State Check**: Only triggers workflows that are:
   - ✅ Active (not disabled)
   - ✅ Support manual triggering (`workflow_dispatch`)

## Usage Instructions

### Step 1: Set Up GitHub Actions Workflow

1. **Copy the sample workflow** from `.github/workflows/spec-actions.yml` in this repository
2. **Add it to your spec repository** at `.github/workflows/spec-actions.yml`
3. **Customize the workflow** for your specific needs
4. **Commit and push** the workflow file

### Step 2: Trigger Workflows from Web App

1. **Navigate to your repository** in the GitHubUI web app
2. **Click the "Run Actions" button** (⚡ icon) in the file explorer
3. **Wait for confirmation** - you'll see a success message with the workflow name
4. **View results** by visiting your repository's Actions tab on GitHub

### Step 3: Monitor Workflow Execution

- **GitHub Actions Tab**: Visit `https://github.com/{owner}/{repo}/actions`
- **Workflow Runs**: See real-time progress and logs
- **Artifacts**: Download generated files (PDFs, DOCX, etc.)

## Supported Operations

The sample workflow supports all major spec-up-t operations:

### ✅ Available via GitHub Actions
- **`render`**: Generate HTML specification
- **`topdf`**: Create PDF documents
- **`todocx`**: Generate Word documents
- **`freeze`**: Create frozen snapshots
- **`custom-update`**: Run custom update scripts
- **`collectExternalReferences`**: Gather external references

### 🚫 Client-Side Only (No Actions Needed)
- **Basic reference collection**: Already implemented in web app
- **Simple rendering**: Basic HTML generation in browser

## Workflow Configuration

### Inputs Passed to Workflows

The web app automatically passes these inputs:

```yaml
inputs:
  repository: "owner/repo-name"
  branch: "main"
  triggered_by: "GitHubUI"
  action_type: "render"  # Default, can be customized
```

### Environment Variables Available

```yaml
# GitHub context
${{ github.repository }}     # "owner/repo"
${{ github.ref_name }}       # "main"
${{ github.event_name }}     # "workflow_dispatch"

# Custom inputs
${{ inputs.repository }}     # Passed from web app
${{ inputs.branch }}         # Current branch
${{ inputs.triggered_by }}   # "GitHubUI"
```

## Advanced Configuration

### Custom Workflow Selection

To ensure your workflow is selected, name it with one of these keywords:
- ✅ **"Spec Actions"**
- ✅ **"Build Documentation"** 
- ✅ **"Deploy Specification"**
- ✅ **"Spec-Up-T Workflow"**

### Multiple Workflows

If you have multiple workflows, the system will:
1. **Filter** by name keywords (spec, build, deploy)
2. **Select** the first matching active workflow
3. **Fall back** to the first available workflow if none match

### Workflow Customization

```yaml
name: My Custom Spec Workflow

on:
  workflow_dispatch:
    inputs:
      action_type:
        type: choice
        options: [render, topdf, todocx, freeze]
        default: render

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Process based on input
        run: |
          case "${{ inputs.action_type }}" in
            "topdf") spec-up topdf ;;
            "todocx") spec-up todocx ;;
            "freeze") spec-up freeze ;;
            *) spec-up render ;;
          esac
```

## Error Handling

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "No workflows found" | No `.github/workflows/` files | Add workflow file to repository |
| "Cannot trigger workflow" | Workflow missing `workflow_dispatch` | Add `workflow_dispatch` trigger |
| "Workflow not found" | Workflow disabled or deleted | Check workflow is active |
| "422 Unprocessable Entity" | Invalid workflow configuration | Validate workflow YAML syntax |

### Troubleshooting

1. **Check Token Permissions**
   ```bash
   # Your token should have these scopes:
   repo              # ✅ Includes actions:write
   read:user         # ✅ For authentication
   ```

2. **Verify Workflow Configuration**
   ```yaml
   # Required trigger in your workflow:
   on:
     workflow_dispatch:  # ✅ Essential for manual triggering
   ```

3. **Check Workflow Status**
   - Visit repository's Actions tab
   - Ensure workflow is not disabled
   - Verify no syntax errors in YAML

## Benefits

### 🚀 **Performance**
- Server-side processing with full system resources
- No browser memory limitations
- Parallel processing capabilities

### 🔧 **Full Feature Set**
- Complete spec-up-t functionality
- PDF/DOCX generation with proper fonts
- Complex document processing

### 📊 **Monitoring**
- Full execution logs in GitHub Actions
- Artifact storage and download
- Email notifications on completion/failure

### 🔄 **Integration**
- Seamless workflow with existing GitHub repositories
- Automatic deployment to GitHub Pages
- Version control integration

## Best Practices

### 1. **Workflow Organization**
```yaml
# Use descriptive names
name: "Spec-Up-T Documentation Builder"

# Group related jobs
jobs:
  render:
    name: "📄 Render HTML"
  pdf:
    name: "🔄 Generate PDF"
  deploy:
    name: "🚀 Deploy to Pages"
```

### 2. **Efficient Triggers**
```yaml
# Trigger on relevant changes only
on:
  workflow_dispatch:
  push:
    paths: ['spec/**', '*.md', 'specs.json']
```

### 3. **Artifact Management**
```yaml
# Organize outputs
- uses: actions/upload-artifact@v4
  with:
    name: "documentation-${{ github.sha }}"
    path: |
      index.html
      *.pdf
      *.docx
    retention-days: 90
```

## Security Considerations

- ✅ **Uses existing GitHub token** - no additional credentials needed
- ✅ **Repository permissions respected** - only users with repo access can trigger
- ✅ **Workflow runs in secure GitHub environment**
- ✅ **All activity logged in GitHub Actions**

## Future Enhancements

### Planned Features
- [ ] **Workflow parameter input** - Allow custom parameters from web app
- [ ] **Real-time status updates** - Show workflow progress in web app
- [ ] **Result integration** - Display generated files directly in web app
- [ ] **Workflow templates** - Pre-built workflows for common scenarios

### Possible Integrations
- [ ] **Slack/Discord notifications** on completion
- [ ] **Email alerts** for workflow failures
- [ ] **Automatic pull request creation** for generated content
- [ ] **Integration with external documentation platforms**
