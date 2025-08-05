# Spec-Up-T Editor - Comprehensive Documentation

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Installation & Setup](#installation--setup)
5. [Configuration](#configuration)
6. [User Guide](#user-guide)
7. [Components Documentation](#components-documentation)
8. [API Integration](#api-integration)
9. [Health Check System](#health-check-system)
10. [Security Considerations](#security-considerations)
11. [Development Guidelines](#development-guidelines)
12. [Troubleshooting](#troubleshooting)
13. [Contributing](#contributing)

## Overview

The **Spec-Up-T Editor** is a sophisticated web-based application built with Vue.js 3 that provides an intuitive interface for editing and managing specification files stored in GitHub repositories. It's designed specifically for teams working with structured documentation and specification formats, offering seamless GitHub integration and collaborative editing capabilities.

### Key Benefits

- **Zero Installation**: Web-based interface requiring no local software installation
- **GitHub Integration**: Direct read/write access to GitHub repositories via API
- **Collaborative**: Multiple users can work on the same repository
- **Spec-Focused**: Optimized for specification and documentation workflows
- **Health Monitoring**: Built-in repository health checking and validation

## Features

### Core Functionality

- **GitHub Authentication**: Secure login using GitHub Personal Access Tokens
- **Repository Management**: Browse and access GitHub repositories with branch selection
- **File Explorer**: Navigate through specification directories with advanced filtering
- **WYSIWYG Editor**: Rich text editor with markdown support and live preview
- **External Specifications**: Manage references to external specification repositories
- **Health Checking**: Comprehensive repository validation and health monitoring
- **Terms Management**: Built-in glossary and terminology management

### Advanced Features

- **Visited Repository History**: Automatic tracking of recently accessed repositories
- **Real-time File Creation**: Create new files directly through the interface
- **Commit Integration**: Direct Git commits with custom messages
- **Responsive Design**: Mobile-friendly interface using Bootstrap 5
- **Analytics Integration**: Optional Google Analytics tracking
- **Build Information**: Display build metadata and version information

## Architecture

### Technology Stack

- **Frontend Framework**: Vue.js 3 with Composition API
- **Routing**: Vue Router 4 for single-page application navigation
- **HTTP Client**: Axios for GitHub API communication
- **UI Framework**: Bootstrap 5 with Bootstrap Icons
- **Build Tool**: Vite for development and production builds
- **Styling**: SCSS with custom Bootstrap theme

### Project Structure

```text
src/
├── components/           # Vue components
│   ├── BackToTop.vue    # Scroll-to-top functionality
│   ├── ExternalSpecsManager.vue  # External specs management
│   ├── FileEditor.vue   # Main file editing interface
│   ├── FileExplorer.vue # Repository file browser
│   ├── HealthCheck.vue  # Repository health monitoring
│   ├── HomePage.vue     # Main dashboard
│   ├── LoginPage.vue    # GitHub authentication
│   ├── MainNav.vue      # Navigation component
│   └── Modal.vue        # Reusable modal component
├── composables/         # Vue composables
│   └── useGoogleAnalytics.js  # Analytics integration
├── generated/           # Generated build files
│   └── build-info-fallback.js
├── styles/              # Styling
│   └── custom-bootstrap.scss
├── types/               # TypeScript definitions
│   └── global.d.ts
├── utils/               # Utility functions
│   ├── build-info.js
│   ├── googleAnalytics.js
│   └── visitedRepos.js
├── App.vue             # Root component
└── main.js             # Application entry point
```

## Installation & Setup

### Prerequisites

- **Node.js**: Version 16 or higher
- **npm**: Comes with Node.js
- **GitHub Personal Access Token**: With repository permissions

### Local Development Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/blockchainbird/GitHubUi.git
   cd GitHubUi
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   ```bash
   cp .env.example .env
   ```
   
   Configure the following environment variables:

   ```env
   VITE_GA_MEASUREMENT_ID=your_google_analytics_id
   VITE_BASE_PATH=/
   ```

4. **Start Development Server**

   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Open browser to `http://localhost:3000`
   - Use your GitHub Personal Access Token to authenticate

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment

The application is designed to be deployed as a static site. The build output in the `dist/` directory can be served by any static file server or CDN.

## Configuration

### GitHub Token Setup

1. Navigate to [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Generate a new token with the following permissions:
   - `repo` (Full control of private repositories)
   - `read:user` (Read user profile data)

### Repository Configuration

The application looks for a `specs.json` file in the repository root with this structure:

```json
{
  "specs": [
    {
      "spec_directory": "docs",
      "external_specs": [
        {
          "external_spec": "unique_identifier",
          "gh_page": "https://example.github.io/spec/",
          "url": "https://github.com/user/repo",
          "terms_dir": "spec/terms-definitions"
        }
      ]
    }
  ]
}
```

**Configuration Options:**

- `spec_directory`: Directory containing specification files (default: "specs")
- `external_specs`: Array of external specification references
- `external_spec`: Unique identifier for the external specification
- `gh_page`: GitHub Pages URL where the spec is hosted
- `url`: Source repository URL
- `terms_dir`: Directory path for terms and definitions

## User Guide

### Getting Started

1. **Authentication**
   - Navigate to the login page
   - Enter your GitHub Personal Access Token
   - Click "Login with GitHub"

2. **Repository Access**
   - Enter GitHub username/organization and repository name
   - Select the appropriate branch
   - Click "Access Repository"

3. **File Management**
   - Browse files using the file explorer
   - Filter files by name or type
   - Create new files using the "+" button
   - Click on any file to open it in the editor

### File Editing Workflow

1. **Open File**: Click on a file in the explorer
2. **Edit Content**: Use the WYSIWYG editor with toolbar options
3. **Preview**: Toggle between Edit and Preview modes
4. **Save Changes**: Provide a commit message and save to GitHub

### External Specifications Management

1. **Access Manager**: Click "External Specs" in the navigation
2. **Add Specifications**: Use single or bulk import modes
3. **Configure References**: Set up GitHub Pages URLs and terms directories
4. **Save Changes**: Commit changes to the specs.json file

### Health Check System

1. **Run Health Check**: Click "Health Check" in the navigation
2. **Review Results**: Examine repository configuration and file integrity
3. **Address Issues**: Follow recommendations to fix identified problems

## Components Documentation

### MainNav.vue

**Purpose**: Main navigation component with context-aware buttons

**Features**:

- Home navigation
- About modal with build information
- Repository-specific actions (External Specs, Health Check, GitHub link)
- Dynamic button visibility based on current context

**Props**: None (uses route parameters)

**Key Methods**:

- `navigateToHealthCheck()`: Navigate to health check page
- `showRepoRelatedButtons`: Computed property for conditional button display

### LoginPage.vue

**Purpose**: GitHub authentication interface

**Features**:

- Secure token input with password masking
- Token validation via GitHub API
- Automatic redirect to intended destination
- Error handling and user feedback

**Events**:

- `@login`: Emitted when authentication succeeds

**Security**: Tokens are validated against GitHub API before storage

### HomePage.vue

**Purpose**: Main dashboard for repository selection

**Features**:
- Repository input with autocomplete
- Branch selection modal
- Recently visited repositories history
- Repository validation

**Key Features**:
- Dynamic repository fetching
- Branch filtering and selection
- Visit history management with local storage
- Responsive card-based layout

### FileExplorer.vue

**Purpose**: Repository file browser with advanced filtering

**Features**:
- Hierarchical file navigation
- Advanced filtering (All, Markdown, Images, etc.)
- File creation capabilities
- Recently created file highlighting

**Filtering Options**:
- All files
- Markdown files (.md)
- Image files (.png, .jpg, .gif, .svg)
- JSON files (.json)
- Text files (.txt)

**Key Methods**:
- `loadSpecFiles()`: Load files from current directory
- `createNewFile()`: Create new files via GitHub API
- `applyFilter()`: Apply selected file filters

### FileEditor.vue

**Purpose**: Main file editing interface with WYSIWYG capabilities

**Features**:
- Rich text editing with toolbar
- Live markdown preview
- Terms management integration
- Auto-save functionality
- Commit message customization

**Editor Capabilities**:
- Bold, italic, and basic formatting
- Header level selection
- List creation (ordered/unordered)
- Link insertion
- Code block support

**Terms Integration**:
- Automatic term detection
- External specification references
- Glossary management

### ExternalSpecsManager.vue

**Purpose**: Management interface for external specification references

**Features**:
- Single and bulk specification import
- JSON validation and parsing
- Duplicate detection and handling
- URL validation for external resources

**Import Methods**:
- **Single Mode**: Add specifications one at a time
- **Bulk JSON**: Import multiple specifications from JSON
- **GitHub URL**: Import from external GitHub JSON files

**Validation**:
- URL format validation
- Required field checking
- Duplicate identification
- JSON structure validation

### HealthCheck.vue

**Purpose**: Comprehensive repository health monitoring

**Health Check Categories**:

1. **Repository Information**
   - Repository accessibility
   - Branch existence
   - Basic metadata validation

2. **Specs Configuration**
   - specs.json existence and validity
   - Configuration structure validation
   - Directory path verification

3. **External Specifications**
   - URL accessibility testing
   - GitHub repository validation
   - Terms directory verification

4. **File Structure**
   - Required file presence
   - Directory structure validation
   - File naming conventions

5. **Git Configuration**
   - .gitignore completeness
   - Branch protection status
   - Repository settings

**Result Types**:
- ✅ **Success**: All checks passed
- ⚠️ **Warning**: Non-critical issues detected
- ❌ **Error**: Critical problems requiring attention

## API Integration

### GitHub API Usage

The application uses GitHub's REST API v3 for all repository operations:

**Authentication**:

```javascript
headers: {
  'Authorization': `token ${githubToken}`,
  'Accept': 'application/vnd.github.v3+json'
}
```

**Key API Endpoints**:

1. **User Authentication**

   ```http
   GET /user
   ```

2. **Repository Access**

   ```http
   GET /repos/:owner/:repo
   GET /repos/:owner/:repo/branches
   ```

3. **File Operations**

   ```http
   GET /repos/:owner/:repo/contents/:path
   PUT /repos/:owner/:repo/contents/:path
   ```

4. **Content Management**

   ```http
   GET /repos/:owner/:repo/contents/:path?ref=:branch
   ```

### Error Handling

The application implements comprehensive error handling:

- **401/403 Errors**: Automatic token refresh and login redirect
- **404 Errors**: Graceful fallback to default configurations
- **Rate Limiting**: Appropriate error messages and retry suggestions
- **Network Errors**: User-friendly error reporting

### Caching Strategy

- **Repository Metadata**: Cached in localStorage
- **File Content**: Session-based caching
- **User Preferences**: Persistent localStorage
- **Visit History**: Persistent with automatic cleanup

## Health Check Implementation

### Implementation Details

The health check system provides comprehensive repository validation through multiple check categories:

#### Check Categories

1. **Repository Validation**
   - Verifies repository accessibility
   - Confirms branch existence
   - Validates user permissions

2. **Configuration Validation**
   - Validates specs.json structure
   - Checks directory paths
   - Verifies external specification references

3. **File Structure Analysis**
   - Analyzes directory organization
   - Validates file naming conventions
   - Checks for required files

4. **External Resource Verification**
   - Tests external URL accessibility
   - Validates GitHub repository links
   - Checks terms directory existence

#### Health Check Results

Results are categorized into three types:

- **Success (✅)**: All validations passed
- **Warning (⚠️)**: Issues detected but not critical
- **Error (❌)**: Critical problems requiring immediate attention

#### Usage Recommendations

- Run health checks before major edits
- Address all errors before deployment
- Monitor warnings for potential issues
- Use health check results to guide repository maintenance

## Security Considerations

### Authentication Security

- **Token Storage**: Tokens stored in localStorage (consider sessionStorage for higher security)
- **Token Validation**: All tokens validated against GitHub API
- **Automatic Expiration**: Invalid tokens automatically cleared
- **Secure Transmission**: All API calls use HTTPS

### Data Protection

- **Client-Side Only**: No server-side data storage
- **Temporary Caching**: File content cached only during editing sessions
- **User Control**: Users maintain full control over their data

### Best Practices

1. **Token Management**:
   - Use tokens with minimal required permissions
   - Regularly rotate personal access tokens
   - Monitor token usage in GitHub settings

2. **Repository Access**:
   - Verify repository permissions before editing
   - Use branch protection for critical repositories
   - Maintain backup branches for important content

3. **Content Security**:
   - Review all commits before pushing
   - Use descriptive commit messages
   - Validate external links regularly

## Development Guidelines

### Code Quality Standards

Following the provided coding instructions:

1. **SonarQube Compliance**: All code must pass SonarQube analysis
2. **Cognitive Complexity**: Keep complexity below 15 per function
3. **Code Reduction**: Prefer removing code over adding when possible
4. **Duplication Avoidance**: Eliminate duplicate code while maintaining low complexity

### Component Development Guidelines

1. **Composition API**: Use Vue 3 Composition API for all new components
2. **TypeScript**: Gradually migrate to TypeScript for better type safety
3. **Single Responsibility**: Each component should have a single, clear purpose
4. **Props and Events**: Use clear prop interfaces and documented events

### File Organization

- **Components**: Group related functionality in single files
- **Composables**: Extract reusable logic into composables
- **Utils**: Create utility functions for common operations
- **Types**: Define TypeScript interfaces for complex data structures

### Testing Strategy

While tests are not currently implemented, consider:

1. **Unit Tests**: Test individual component logic
2. **Integration Tests**: Test GitHub API integration
3. **E2E Tests**: Test complete user workflows
4. **Visual Tests**: Ensure UI consistency across browsers

### Performance Optimization

1. **Lazy Loading**: Implement component and route lazy loading
2. **Caching**: Optimize API response caching
3. **Bundle Size**: Monitor and optimize bundle size
4. **Image Optimization**: Compress and optimize assets

## Troubleshooting

### Common Issues

#### Authentication Problems

**Issue**: "Invalid token" error

**Solutions**:

- Verify token has correct permissions (repo, read:user)
- Check token expiration date
- Regenerate token if necessary
- Clear browser cache and localStorage

**Issue**: "Access forbidden" error

**Solutions**:

- Verify repository permissions
- Check if repository is private and token has access
- Confirm organization membership for org repositories

#### File Loading Issues

**Issue**: Files not displaying in explorer
**Solutions**:
- Check specs.json configuration
- Verify spec_directory path
- Ensure branch exists and is accessible
- Check network connectivity

**Issue**: Cannot save files
**Solutions**:
- Verify write permissions to repository
- Check file path validity
- Ensure commit message is provided
- Verify branch is not protected

#### Health Check Failures

**Issue**: External specifications not accessible
**Solutions**:
- Verify external URLs are correct and accessible
- Check CORS settings for external resources
- Validate GitHub repository URLs
- Test URLs manually in browser

#### Performance Issues

**Issue**: Slow loading times
**Solutions**:
- Check internet connection
- Clear browser cache
- Verify GitHub API rate limits
- Consider using a different branch

### Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| 401 | Unauthorized | Check token validity |
| 403 | Forbidden | Verify repository permissions |
| 404 | Not Found | Check repository/file existence |
| 422 | Unprocessable Entity | Validate request data |
| 429 | Rate Limited | Wait and retry request |

### Debug Information

Enable debug mode by adding to localStorage:

```javascript
localStorage.setItem('debug', 'true')
```

This will enable:

- Console logging for API requests
- Detailed error information
- Performance timing data
- State change tracking

## Contributing

### Development Setup

1. **Fork the Repository**

   ```bash
   git clone https://github.com/your-username/GitHubUi.git
   cd GitHubUi
   ```

2. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Install Dependencies**

   ```bash
   npm install
   ```

4. **Start Development Server**

   ```bash
   npm run dev
   ```

### Contribution Guidelines

1. **Code Standards**:
   - Follow existing code style and conventions
   - Ensure SonarQube compliance
   - Keep cognitive complexity low
   - Add appropriate comments and documentation

2. **Commit Messages**:
   - Use descriptive commit messages
   - Follow conventional commit format
   - Reference issue numbers when applicable

3. **Pull Requests**:
   - Provide clear description of changes
   - Include screenshots for UI changes
   - Ensure all checks pass
   - Request review from maintainers

4. **Testing**:
   - Test changes thoroughly in development
   - Verify functionality across different browsers
   - Test with various repository configurations

### Feature Requests

To request new features:

1. Check existing issues for similar requests
2. Create detailed issue with use case description
3. Provide mockups or examples when applicable
4. Engage in discussion with maintainers

### Bug Reports

When reporting bugs:

1. Use the bug report template
2. Include detailed reproduction steps
3. Provide browser and environment information
4. Include screenshots or console errors
5. Test against latest version

---

## Files Created and Their Purpose

This documentation file (`DOCUMENTATION.md`) has been created to provide comprehensive guidance for users, developers, and contributors of the Spec-Up-T Editor project.

**Why this file should stay:**

1. **User Guidance**: Provides complete instructions for setup, configuration, and usage
2. **Developer Reference**: Serves as technical documentation for code maintenance and feature development
3. **Onboarding**: Helps new team members understand the project architecture and workflows
4. **Troubleshooting**: Contains solutions to common problems and debugging information
5. **Standards Documentation**: Defines coding standards and contribution guidelines

**How to use this file:**

1. **New Users**: Start with Overview and User Guide sections
2. **Developers**: Focus on Architecture, Components Documentation, and Development Guidelines
3. **Contributors**: Review Contributing section and development setup instructions
4. **Maintainers**: Use as reference for project standards and troubleshooting guide
5. **Documentation Updates**: Keep this file updated as features are added or changed

This comprehensive documentation ensures the project remains maintainable, accessible, and well-documented for all stakeholders while following the principle of creating necessary files that provide clear value to the project.
