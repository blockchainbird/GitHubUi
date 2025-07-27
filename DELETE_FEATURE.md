# File Deletion Feature

## Overview

The FileExplorer component now includes the ability to delete files directly from the GitHub repository through the web interface.

## How to Use

1. **Navigate to the File Explorer**: Go to any repository's file listing page
2. **Locate the File**: Find the file you want to delete in the file list
3. **Click Delete Button**: Each file row now has a red trash icon button on the right side
4. **Confirm Deletion**: A modal will appear asking for confirmation and a commit message
5. **Submit**: Click "Delete File" to permanently remove the file from the repository

## Features

- **Safety First**: Confirmation modal prevents accidental deletions
- **Custom Commit Messages**: Users can specify a commit message for the deletion
- **Real-time Updates**: The file list updates immediately after successful deletion
- **Error Handling**: Clear error messages if deletion fails
- **Permissions**: Only works if the user has write access to the repository

## Visual Indicators

- Delete buttons are subtle (semi-transparent) until you hover over a file row
- Only files have delete buttons, folders cannot be deleted through this interface
- The delete button is positioned to the right, separate from the file name click area

## Important Notes

- **Permanent Action**: Deleted files are removed from the repository permanently
- **Branch Specific**: Files are deleted from the current branch being viewed
- **GitHub Integration**: Uses GitHub API to perform actual file deletions
- **Authentication Required**: User must be logged in with appropriate permissions

## Why This File Should Stay

This documentation file explains the new delete functionality that was added to the FileExplorer component. It should remain in the project because:

1. **User Guide**: Helps users understand how to use the delete feature safely
2. **Developer Reference**: Documents the implementation for future maintenance
3. **Feature Documentation**: Part of the project's feature set documentation
4. **Safety Information**: Emphasizes the permanent nature of deletions

## How to Use This Documentation

- Include this information in your user guide or help documentation
- Reference this when training users on the file management features
- Update this file when making changes to the delete functionality
