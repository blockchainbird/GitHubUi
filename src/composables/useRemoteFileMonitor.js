/**
 * Composable for monitoring remote file changes
 * Handles checking for remote changes and notifications
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { getGitHubHeaders, addCacheBusting } from '../utils/apiUtils.js'
import { getNotepadInstance } from './useNotepad.js'

export function useRemoteFileMonitor(props) {
    // State
    const remoteFileSha = ref('')
    const lastKnownSha = ref('')
    const checkingRemote = ref(false)
    const remoteChangeDetected = ref(false)
    const remoteChangeMessage = ref('')
    const intervalId = ref(null)

    // Constants
    const CHECK_INTERVAL_MS = 60000 // 1 minute

    // Get current file info for API calls
    const decodedPath = computed(() => {
        return props.path ? decodeURIComponent(props.path) : ''
    })

    const { addContent: addToNotepad } = getNotepadInstance()

    // Check for authentication and redirect if needed
    const checkAuthAndRedirect = (error, router) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            localStorage.removeItem('github_token')
            localStorage.removeItem('github_user')
            if (router) {
                router.push('/login')
            }
            return true
        }
        return false
    }

    // Fetch remote file info without content (just SHA)
    const fetchRemoteFileSha = async () => {
        if (!props.owner || !props.repo || !props.branch || !decodedPath.value) {
            return null
        }

        try {
            const token = localStorage.getItem('github_token')
            const config = {
                headers: getGitHubHeaders(token)
            }

            const url = addCacheBusting(
                `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${decodedPath.value}?ref=${props.branch}`
            )

            const response = await axios.get(url, config)
            return response.data.sha
        } catch (error) {
            console.warn('Failed to fetch remote file SHA:', error)
            return null
        }
    }

    // Fetch remote file content
    const fetchRemoteFileContent = async () => {
        if (!props.owner || !props.repo || !props.branch || !decodedPath.value) {
            return null
        }

        try {
            const token = localStorage.getItem('github_token')
            const config = {
                headers: getGitHubHeaders(token)
            }

            const url = addCacheBusting(
                `https://api.github.com/repos/${props.owner}/${props.repo}/contents/${decodedPath.value}?ref=${props.branch}`
            )

            const response = await axios.get(url, config)

            // Decode content
            const binaryString = atob(response.data.content)
            const content = new TextDecoder('utf-8').decode(
                new Uint8Array([...binaryString].map(char => char.charCodeAt(0)))
            )

            return {
                content,
                sha: response.data.sha
            }
        } catch (error) {
            console.error('Failed to fetch remote file content:', error)
            return null
        }
    }

    // Initialize remote monitoring
    const initializeRemoteMonitoring = async (currentSha) => {
        // Set the initial SHA as our baseline
        lastKnownSha.value = currentSha
        remoteFileSha.value = currentSha

        // Start periodic checks
        startPeriodicChecks()
    }

    // Check for remote changes
    const checkForRemoteChanges = async (showProgress = false) => {
        if (checkingRemote.value) return false

        if (showProgress) {
            checkingRemote.value = true
        }

        try {
            const remoteSha = await fetchRemoteFileSha()

            if (!remoteSha) {
                return false
            }

            remoteFileSha.value = remoteSha

            // Check if remote file has changed
            if (lastKnownSha.value && remoteSha !== lastKnownSha.value) {
                remoteChangeDetected.value = true
                remoteChangeMessage.value = `This file has been modified remotely. The remote version will be loaded and your current changes moved to the notepad.`
                return true
            }

            return false
        } catch (error) {
            console.warn('Error checking for remote changes:', error)
            return false
        } finally {
            if (showProgress) {
                checkingRemote.value = false
            }
        }
    }

    // Handle remote change - move current content to notepad and load remote content
    const handleRemoteChange = async (currentContent, updateContentCallback) => {
        try {
            // Fetch the remote content
            const remoteData = await fetchRemoteFileContent()
            if (!remoteData) {
                throw new Error('Failed to fetch remote content')
            }

            // Move current content to notepad with animation trigger
            if (currentContent && currentContent.trim()) {
                addToNotepad(currentContent, 'File Editor (Remote Change)')
            }

            // Update the content with remote version
            updateContentCallback(remoteData.content, remoteData.sha)

            // Update our tracking
            lastKnownSha.value = remoteData.sha
            remoteFileSha.value = remoteData.sha

            // Clear the change flag
            remoteChangeDetected.value = false
            remoteChangeMessage.value = ''

            return true
        } catch (error) {
            console.error('Error handling remote change:', error)
            return false
        }
    }

    // Dismiss remote change notification (user chooses to ignore)
    const dismissRemoteChange = () => {
        // Update our tracking to the remote SHA to stop notifications
        lastKnownSha.value = remoteFileSha.value
        remoteChangeDetected.value = false
        remoteChangeMessage.value = ''
    }

    // Check before commit (force check)
    const checkBeforeCommit = async () => {
        return await checkForRemoteChanges(true)
    }

    // Start periodic remote checks
    const startPeriodicChecks = () => {
        if (intervalId.value) {
            clearInterval(intervalId.value)
        }

        intervalId.value = setInterval(async () => {
            await checkForRemoteChanges(false)
        }, CHECK_INTERVAL_MS)
    }

    // Stop periodic checks
    const stopPeriodicChecks = () => {
        if (intervalId.value) {
            clearInterval(intervalId.value)
            intervalId.value = null
        }
    }

    // Update tracking when file is saved
    const updateAfterSave = (newSha) => {
        lastKnownSha.value = newSha
        remoteFileSha.value = newSha
        remoteChangeDetected.value = false
        remoteChangeMessage.value = ''
    }

    // Cleanup on unmount
    onUnmounted(() => {
        stopPeriodicChecks()
    })

    return {
        // State
        remoteFileSha,
        lastKnownSha,
        checkingRemote,
        remoteChangeDetected,
        remoteChangeMessage,

        // Methods
        initializeRemoteMonitoring,
        checkForRemoteChanges,
        checkBeforeCommit,
        handleRemoteChange,
        dismissRemoteChange,
        updateAfterSave,
        startPeriodicChecks,
        stopPeriodicChecks,
        fetchRemoteFileContent
    }
}
