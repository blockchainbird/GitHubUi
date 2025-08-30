/**
 * Composable for publish/unpublish functionality
 * Handles toggling draft status by renaming files
 */

import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { getGitHubHeaders, addCacheBusting } from '../utils/apiUtils.js'
import { secureTokenManager } from '../utils/secureTokenManager.js'

export function usePublishToggle(props, checkAuthAndRedirect) {
  const router = useRouter()
  const route = useRoute()

  const togglePublishStatus = async (content, fileSha, decodedPath, filename) => {
    try {
      const token = secureTokenManager.getToken()
      const config = {
        headers: getGitHubHeaders(token)
      }

      const currentPath = decodedPath
      const pathParts = currentPath.split('/')
      const currentFilename = pathParts[pathParts.length - 1]
      
      // Toggle underscore prefix
      let newFilename
      if (currentFilename.startsWith('_')) {
        newFilename = currentFilename.substring(1)
      } else {
        newFilename = '_' + currentFilename
      }
      
      const newPath = pathParts.slice(0, -1).concat(newFilename).join('/')
      const action = currentFilename.startsWith('_') ? 'Published' : 'Unpublished'
      const commitMsg = `${action} ${currentFilename} -> ${newFilename}`

      // Get latest SHA with cache-busting
      const currentFileUrl = addCacheBusting(
        `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${currentPath}?ref=${props.branch}`
      )
      const currentFileResponse = await axios.get(currentFileUrl, config)
      
      const latestSha = currentFileResponse.data.sha

      // Create new file
      const createData = {
        message: commitMsg,
        content: btoa(content),
        branch: props.branch
      }

      const createResponse = await axios.put(
        `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${newPath}`,
        createData,
        config
      )

      // Delete old file
      const deleteData = {
        message: commitMsg,
        sha: latestSha,
        branch: props.branch
      }

      await axios.delete(
        `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${currentPath}`,
        {
          ...config,
          data: deleteData
        }
      )

      // Store rename info for FileExplorer
      localStorage.setItem('recentlyRenamedFile', JSON.stringify({
        oldName: currentFilename,
        newName: newFilename,
        action: action.toLowerCase()
      }))

      // Store rename info for FileExplorer to detect and refresh
      const renameInfo = {
        oldName: currentFilename,
        newName: newFilename,
        action: action.toLowerCase()
      }
      localStorage.setItem('recentlyRenamedFile', JSON.stringify(renameInfo))

      // Navigate to new path
      const encodedNewPath = encodeURIComponent(newPath)
      let newRoute = `/editor/${props.owner}/${props.repo}/${props.branch}/${encodedNewPath}`
      
      if (route.query.dir) {
        newRoute += `?dir=${encodeURIComponent(route.query.dir)}`
      }
      
      await router.push(newRoute)

      return {
        success: true,
        message: `File ${action.toLowerCase()} successfully!`,
        newSha: createResponse.data.content.sha
      }

    } catch (err) {
      console.error('Error toggling publish status:', err)
      if (checkAuthAndRedirect(err)) {
        return { success: false, error: 'Authentication required' }
      }
      
      let errorMessage = 'Failed to change publish status. Please try again.'
      if (err.response?.status === 422) {
        errorMessage = 'File state conflict. The file may have been modified. Please refresh and try again.'
      } else if (err.response?.status === 409) {
        errorMessage = 'A file with the target name already exists. Please check the repository.'
      }
      
      return { success: false, error: errorMessage }
    }
  }

  return {
    togglePublishStatus
  }
}
