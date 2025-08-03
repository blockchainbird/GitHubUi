import { ref } from 'vue'

// Global state for GitHub Actions
const showActionsModal = ref(false)
const triggeringWorkflow = ref(false)

export function useGitHubActions() {
  const openActionsModal = () => {
    showActionsModal.value = true
  }

  const closeActionsModal = () => {
    showActionsModal.value = false
  }

  const setTriggeringWorkflow = (value) => {
    triggeringWorkflow.value = value
  }

  return {
    showActionsModal,
    triggeringWorkflow,
    openActionsModal,
    closeActionsModal,
    setTriggeringWorkflow
  }
}
