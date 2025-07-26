# Spec-Up-T Editor - User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Initial Setup](#initial-setup)
3. [Navigating the Interface](#navigating-the-interface)
4. [Working with Repositories](#working-with-repositories)
5. [File Management](#file-management)
6. [Editing Files](#editing-files)
7. [External Specifications](#external-specifications)
8. [Health Monitoring](#health-monitoring)
9. [Tips and Best Practices](#tips-and-best-practices)
10. [Common Workflows](#common-workflows)
11. [Troubleshooting](#troubleshooting)

## Getting Started

### What is the Spec-Up-T Editor?

The Spec-Up-T Editor is a web-based tool that allows you to edit and manage specification documents stored in GitHub repositories. Think of it as a specialized text editor that connects directly to GitHub, making it easy to collaborate on documentation and specifications without needing to install any software on your computer.

### Who Should Use This Guide?

This guide is for:

- **Specification writers** who need to create and edit documentation
- **Project managers** overseeing specification development
- **Team members** collaborating on documentation projects
- **Anyone** who needs to work with GitHub-hosted specification files

### What You'll Need

Before you start, make sure you have:

- A web browser (Chrome, Firefox, Safari, or Edge)
- A GitHub account
- Access to the repositories you want to edit
- A GitHub Personal Access Token (we'll help you create this)

## Initial Setup

### Step 1: Creating a GitHub Personal Access Token

A Personal Access Token is like a password that allows the Spec-Up-T Editor to access your GitHub repositories securely.

1. **Go to GitHub Settings**
   - Log into GitHub
   - Click your profile picture in the top right
   - Select "Settings" from the dropdown menu

2. **Navigate to Developer Settings**
   - Scroll down in the left sidebar
   - Click "Developer settings"

3. **Create a Personal Access Token**
   - Click "Personal access tokens" → "Tokens (classic)"
   - Click "Generate new token" → "Generate new token (classic)"

4. **Configure the Token**
   - **Note**: Enter a description like "Spec-Up-T Editor"
   - **Expiration**: Choose your preferred expiration (90 days recommended)
   - **Scopes**: Check these boxes:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `read:user` (Read user profile data)

5. **Generate and Save**
   - Click "Generate token"
   - **Important**: Copy the token immediately and save it somewhere safe
   - You won't be able to see it again!

### Step 2: First Login

1. **Open the Spec-Up-T Editor**
   - Navigate to the editor URL in your web browser

2. **Enter Your Token**
   - Paste your GitHub Personal Access Token in the login field
   - Click "Login with GitHub"

3. **Success!**
   - You should see the main dashboard
   - Your GitHub username will appear in the top navigation

## Navigating the Interface

### Main Navigation Bar

The top navigation bar contains several key buttons:

- **🏠 Home**: Returns you to the main dashboard
- **ℹ️ About**: Shows information about the editor and build details
- **📖 Documentation**: Links to the full documentation website
- **🔗 External Specs**: Manages external specification references (when in a repository)
- **👁️ View on GitHub**: Opens the current repository in GitHub (when in a repository)
- **💗 Health Check**: Runs repository health diagnostics (when in a repository)

### Main Dashboard

The dashboard is your starting point for accessing repositories:

- **Repository Access Form**: Enter GitHub username/organization and repository name
- **Branch Selection**: Choose which branch to work with
- **Recently Visited**: Quick access to repositories you've worked with recently

## Working with Repositories

### Accessing a Repository

1. **Enter Repository Information**
   - **GitHub Username/Organization**: The owner of the repository (e.g., "microsoft", "mycompany")
   - **Repository Name**: The name of the repository (e.g., "docs", "specifications")
   - **Branch**: Usually "main" or "master", but could be any branch name

2. **Repository Suggestions**
   - When you start typing in the repository field, you'll see suggestions
   - These are repositories you have access to
   - Click on any suggestion to auto-fill the field

3. **Branch Selection**
   - Click in the branch field to see available branches
   - You can filter branches by typing
   - Select the branch you want to work with

4. **Access the Repository**
   - Click "Access Repository"
   - If successful, you'll be taken to the file explorer

### Repository Structure

The editor looks for a `specs.json` file in your repository root to understand how your project is organized. This file tells the editor:

- Where your specification files are located
- What external specifications you reference
- How your documentation is structured

If no `specs.json` file exists, the editor defaults to looking in a `specs` folder.

## File Management

### File Explorer Interface

Once you access a repository, you'll see the file explorer with:

- **Current Directory Path**: Shows where you are in the repository
- **File Filters**: Buttons to filter by file type (All, Markdown, Images, JSON, Text)
- **Search Box**: Type to filter files by name
- **Create File Button**: Plus (+) icon to create new files
- **File List**: All files and folders in the current directory

### Navigating Folders

- **Enter Folders**: Click on any folder name to enter it
- **Go Up**: Use the "← Go Up" button to move up one directory level
- **Breadcrumb Navigation**: The path at the top shows your current location

### File Filtering

Use the filter buttons to show only specific types of files:

- **All**: Shows all files and folders
- **Markdown**: Only .md files (most specifications)
- **Images**: .png, .jpg, .gif, .svg files
- **JSON**: .json configuration files
- **Text**: .txt files

### Creating New Files

1. **Click the Plus (+) Button**
   - Located in the top right of the file list

2. **Enter File Details**
   - **File Name**: Include the extension (e.g., "new-spec.md")
   - **Initial Content**: Optionally add some starting content
   - **Commit Message**: Describe what you're creating

3. **Create the File**
   - Click "Create File"
   - The file will be created and highlighted in the list
   - You can immediately click on it to start editing

### Reordering Files and Folders

The Spec-Up-T Editor allows you to customize the order in which files and folders appear in your specification. This is useful for organizing content in a logical reading sequence.

#### When Reordering is Available

- **Root Directory Only**: Drag and drop functionality is only available in the root spec directory
- **Visual Indicators**: Look for grip handles (⋮⋮) next to file and folder names
- **Automatic Detection**: The system automatically detects when you're in a reorderable directory

#### How to Reorder Items

1. **Locate the Grip Handle**
   - Look for the vertical dots (⋮⋮) icon to the left of file and folder names
   - This handle only appears in the root spec directory

2. **Drag to Reorder**
   - Click and hold the grip handle
   - Drag the item to its new position in the list
   - Files and folders can be mixed in any order you prefer

3. **Visual Feedback**
   - The item being dragged becomes semi-transparent
   - You can drop the item at any position in the list

4. **Save Your Changes**
   - After reordering, a "Save Order" button will appear
   - Click this button to save your preferred order
   - The order is saved to your repository's `specs.json` file

#### Understanding the Order System

- **Unified Ordering**: Files and folders share the same ordering system
- **Persistent Storage**: Your custom order is remembered between sessions
- **Automatic Loading**: When you return to the repository, your saved order is restored
- **Special Handling**: The terms directory has special handling in the ordering system

#### Tips for Effective Ordering

1. **Logical Flow**: Arrange files in the order readers should encounter them
2. **Dependencies**: Place foundational documents before those that reference them
3. **Sections**: Group related files together for better organization
4. **Overview First**: Consider placing overview or introduction files at the top

#### Troubleshooting Order Issues

- **No Grip Handles**: Make sure you're in the root spec directory, not a subdirectory
- **Order Not Saving**: Ensure you have write permissions to the repository
- **Order Resets**: Check that the `specs.json` file in your repository is properly configured

## Editing Files

### Opening a File

- Simply click on any file name in the file explorer
- The file will open in the editor interface
- You'll see the file content and editing tools

### Editor Interface

The editor has two main modes:

#### Edit Mode

- **Toolbar**: Formatting buttons for common actions
- **Text Area**: Where you type and edit content
- **Live Formatting**: Basic markdown formatting is applied as you type

#### Preview Mode

- **Rendered View**: See how your markdown will look when published
- **Toggle Button**: Switch between Edit and Preview modes

### Editor Toolbar

The toolbar provides quick access to common formatting options:

- **Bold (B)**: Make selected text bold
- **Italic (I)**: Make selected text italic
- **Headers (H1-H6)**: Create headings of different sizes
- **Ordered List**: Create numbered lists
- **Unordered List**: Create bullet point lists
- **Link**: Insert hyperlinks
- **Code**: Format text as code

### Saving Your Changes

1. **Add a Commit Message**
   - In the commit message box, describe your changes
   - Be specific: "Add section on security requirements" is better than "Update file"

2. **Save to GitHub**
   - Click the "💾 Save to GitHub" button
   - Your changes will be committed directly to the repository
   - You'll see a success message when complete

### Working with Terms and Definitions

The editor has special support for managing terminology:

1. **Terms Panel**
   - Located on the right side of the editor
   - Shows terms from your current repository and external specifications

2. **Adding Terms**
   - Click "Add Term" in the terms panel
   - Enter the term name and any aliases
   - The term will be available for reference

3. **Using Terms**
   - Type `[[term-name]]` in your content to reference a term
   - The editor will help you find and link to defined terms

## External Specifications

External specifications allow you to reference terminology and content from other repositories.

### Accessing External Specs Manager

1. **Navigate to a Repository**
   - You must be working within a repository first

2. **Click "External Specs"**
   - Located in the top navigation bar
   - This opens the External Specifications Manager

### Adding External Specifications

#### Single Specification Method

1. **Choose "Single" Mode**
   - Click the "Single" tab

2. **Fill in the Details**
   - **Specification ID**: A unique name (e.g., "keri-spec", "toip-glossary")
   - **GitHub Page URL**: Where the spec is published (e.g., `https://example.github.io/spec/`)
   - **Repository URL**: The source GitHub repository
   - **Terms Directory**: Path to terms/definitions (e.g., "spec/terms-definitions")

3. **Add the Specification**
   - Click "Add Specification"
   - The spec will appear in your list

#### Bulk Import Method

1. **Choose "Bulk" Mode**
   - Click the "Bulk" tab

2. **JSON Input**
   - Select the "JSON Input" sub-tab
   - Paste a JSON array of external specifications
   - Click "Import from JSON"

3. **GitHub URL Import**
   - Select the "GitHub URL" sub-tab
   - Enter a URL to a JSON file containing external specs
   - Click "Import from URL"

### Managing External Specifications

- **Edit**: Click on any field in the table to edit it
- **Delete**: Use the delete button (🗑️) to remove a specification
- **Validation**: The system checks that URLs are valid and accessible

### Saving External Specs Changes

1. **Make Your Changes**
   - Add, edit, or remove external specifications as needed

2. **Save Changes**
   - Click "💾 Save Changes" in the top right
   - Enter a commit message describing your changes
   - Your specs.json file will be updated in the repository

## Health Monitoring

The Health Check feature helps you identify and fix problems with your repository configuration.

### Running a Health Check

1. **Navigate to a Repository**
   - You must be working within a repository

2. **Click "Health Check"**
   - Located in the top navigation bar
   - The health check will run automatically

### Understanding Health Check Results

Results are organized into categories, each with a color-coded status:

#### Status Types

- **✅ Green**: Everything is working correctly
- **⚠️ Yellow**: Warnings that should be addressed but don't prevent functionality
- **❌ Red**: Errors that need immediate attention

#### Check Categories

1. **Repository Information**
   - Verifies you can access the repository
   - Confirms the selected branch exists
   - Checks basic repository settings

2. **Specs Configuration**
   - Validates your specs.json file structure
   - Checks that specified directories exist
   - Verifies configuration syntax

3. **External Specifications**
   - Tests that external URLs are accessible
   - Validates GitHub repository links
   - Checks that terms directories exist in external repos

4. **File Structure**
   - Analyzes your repository organization
   - Checks for required files
   - Validates file naming conventions

5. **Git Configuration**
   - Reviews your .gitignore file
   - Checks repository settings
   - Validates branch configuration

### Acting on Health Check Results

1. **Prioritize Errors First**
   - Red errors should be fixed before continuing work
   - These often prevent core functionality

2. **Address Warnings**
   - Yellow warnings won't break functionality but should be addressed
   - They often indicate best practices or potential future issues

3. **Use the Recommendations**
   - Each issue includes specific guidance on how to fix it
   - Follow the provided steps to resolve problems

## Tips and Best Practices

### File Organization

1. **Use Clear File Names**
   - `user-authentication-spec.md` is better than `spec1.md`
   - Include version numbers when appropriate: `api-v2-specification.md`

2. **Organize with Folders**
   - Group related specifications in folders
   - Use consistent naming conventions

3. **Keep Related Files Together**
   - Store images and diagrams near the specifications that use them
   - Consider a `media` or `images` subfolder for each specification

4. **Order Files Logically**
   - Use the drag and drop feature to arrange files in reading order
   - Place foundational documents before dependent ones
   - Consider reader flow: overview → details → appendices
   - Save your custom order to persist it across sessions

### Writing Effective Specifications

1. **Use Descriptive Commit Messages**
   - "Add authentication requirements section" is better than "Update file"
   - Include context: "Fix typo in section 3.2" vs "Fix typo"

2. **Make Incremental Changes**
   - Save your work frequently
   - Don't make massive changes in a single commit

3. **Use the Preview Mode**
   - Always preview your markdown before saving
   - Check that links work and formatting is correct

### Working with Teams

1. **Coordinate Branch Usage**
   - Agree on which branch team members should use
   - Consider using feature branches for major changes

2. **Communicate Changes**
   - Use descriptive commit messages that others can understand
   - Consider discussing major changes before making them

3. **Regular Health Checks**
   - Run health checks periodically to catch issues early
   - Address warnings before they become errors

### Security Best Practices

1. **Protect Your Token**
   - Never share your Personal Access Token
   - Use tokens with minimal necessary permissions
   - Rotate tokens regularly (every 90 days recommended)

2. **Review Changes**
   - Always review your changes in preview mode
   - Double-check that you're editing the correct file and branch

3. **Backup Important Work**
   - Consider keeping local copies of important specifications
   - Use GitHub's built-in version history as a backup

## Common Workflows

### Workflow 1: Creating a New Specification

1. **Access your repository** using the dashboard
2. **Navigate to the appropriate folder** for specifications
3. **Create a new file** with a descriptive name ending in `.md`
4. **Add initial content** using the editor toolbar for formatting
5. **Save with a clear commit message** like "Create initial draft of user authentication spec"
6. **Run a health check** to ensure everything is properly configured
7. **Share the file location** with team members for review

### Workflow 2: Editing an Existing Specification

1. **Access your repository** and navigate to the file
2. **Open the file** by clicking on its name
3. **Make your changes** using the editor tools
4. **Use preview mode** to check formatting and appearance
5. **Save with a descriptive commit message** explaining what changed
6. **Notify team members** of the changes if needed

### Workflow 3: Setting Up External References

1. **Access the External Specs Manager** from the navigation
2. **Gather information** about the external specifications you want to reference:
   - GitHub repository URL
   - Published documentation URL
   - Location of terms/definitions
3. **Add each external specification** using the single or bulk import method
4. **Test the references** by checking that URLs are accessible
5. **Save your configuration** with an appropriate commit message
6. **Run a health check** to verify everything is working correctly

### Workflow 4: Collaborative Review Process

1. **Create or edit specifications** as normal
2. **Use descriptive commit messages** so reviewers understand changes
3. **Share the repository and file paths** with reviewers
4. **Reviewers access the same files** using their own tokens
5. **Make revisions** based on feedback
6. **Use the commit history** (available in GitHub) to track changes
7. **Run final health checks** before considering the specification complete

### Workflow 5: Organizing Specification Files

1. **Navigate to the root spec directory** where you can see all your specification files
2. **Look for the grip handles** (⋮⋮) next to file and folder names
3. **Plan your organization**:
   - Put overview/introduction documents first
   - Group related specifications together
   - Place appendices and references at the end
4. **Drag files and folders** to arrange them in logical reading order
5. **Save the order** by clicking the "Save Order" button that appears
6. **Test the organization** by reviewing how the files flow together
7. **Make adjustments** as needed and save again

### Workflow 6: Regular Maintenance

1. **Monthly health checks** on all active repositories
2. **Review and update external specifications** as needed
3. **Clean up unused files** and outdated content
4. **Update repository configuration** (specs.json) as your project evolves
5. **Review and adjust file ordering** as content evolves
6. **Rotate access tokens** every 90 days for security

## Troubleshooting

### Authentication Issues

**Problem**: "Invalid token" error message

**Solutions**:

1. Check that your token hasn't expired
2. Verify you copied the entire token (they're quite long)
3. Make sure your token has `repo` and `read:user` permissions
4. Try generating a new token if the old one doesn't work

**Problem**: "Access forbidden" error

**Solutions**:

1. Verify you have permission to access the repository
2. Check if the repository is private and your token has private repo access
3. Confirm you're a member of the organization (for organization repositories)
4. Ask the repository owner to verify your access permissions

### File Loading Problems

**Problem**: No files showing in the explorer

**Solutions**:

1. Check that you entered the correct repository information
2. Verify the branch name exists
3. Look for a specs.json file in the repository root
4. Try using "specs" as the directory if no specs.json exists
5. Check your internet connection

**Problem**: Can't save files

**Solutions**:

1. Verify you have write permissions to the repository
2. Check that the branch isn't protected
3. Make sure you entered a commit message
4. Try refreshing the page and logging in again

### External Specifications Problems

**Problem**: External specs not loading

**Solutions**:

1. Verify all URLs are correct and accessible
2. Check that the GitHub repositories are public or you have access
3. Confirm the terms directory paths are correct
4. Test URLs manually in your browser

**Problem**: Terms not appearing from external specs

**Solutions**:

1. Run a health check to identify configuration issues
2. Verify the external specification URLs are accessible
3. Check that the terms directory contains the expected files
4. Refresh the page to reload external references

### Performance Issues

**Problem**: Slow loading times

**Solutions**:

1. Check your internet connection speed
2. Try using a different branch if available
3. Clear your browser cache and cookies
4. Check if GitHub is experiencing service issues
5. Consider the size of your repository (very large repos may be slower)

### Getting Help

If you continue to experience issues:

1. **Run a Health Check**: This often identifies the root cause of problems
2. **Check the Browser Console**: Press F12 and look for error messages
3. **Try a Different Browser**: Sometimes browser-specific issues occur
4. **Clear Browser Data**: Clear cache, cookies, and local storage for the site
5. **Contact Support**: Reach out to your system administrator or the development team

Remember: Most issues are related to authentication, permissions, or repository configuration. The health check system is designed to help identify and resolve the majority of common problems.

---

## Files Created and Their Purpose

This user guide (`USER_GUIDE.md`) has been created to provide step-by-step instructions for end users of the Spec-Up-T Editor.

**Why this file should stay:**

1. **User-Focused**: Written specifically for end users, not developers or technical implementers
2. **Step-by-Step Instructions**: Provides detailed, actionable guidance for common tasks
3. **Workflow Examples**: Shows real-world usage patterns and scenarios
4. **Troubleshooting**: Addresses common user problems with practical solutions
5. **Onboarding**: Helps new users get started quickly and successfully

**How to use this file:**

1. **New Users**: Start with "Getting Started" and "Initial Setup" sections
2. **Occasional Users**: Focus on "Working with Repositories" and "File Management" sections
3. **Power Users**: Review "Common Workflows" and "Tips and Best Practices"
4. **Troubleshooting**: Reference the "Troubleshooting" section when problems arise
5. **Training**: Use as a training manual for teams adopting the tool

This user guide complements the technical documentation by focusing entirely on practical usage, making the Spec-Up-T Editor accessible to users of all technical levels while maintaining comprehensive coverage of all features and capabilities.
