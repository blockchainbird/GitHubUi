// Simple notification utility to replace alert() calls
// This provides better UX and is more testable than browser alerts

export const useNotifications = () => {
  const notify = (message, type = 'info') => {
    // For now, we'll use console.warn/error for better debugging
    // In a full implementation, this would integrate with a toast/notification system
    
    if (type === 'error') {
      console.error('Notification:', message)
      // In production, you might want to use a toast library or custom notification component
      alert(message) // Temporary fallback
    } else if (type === 'warning') {
      console.warn('Notification:', message)
      alert(message) // Temporary fallback
    } else {
      console.info('Notification:', message)
      alert(message) // Temporary fallback
    }
  }

  const confirmAction = (message) => {
    console.info('Confirmation required:', message)
    return confirm(message) // Browser confirm for now
  }

  const notifySuccess = (message) => notify(message, 'success')
  const notifyError = (message) => notify(message, 'error')
  const notifyWarning = (message) => notify(message, 'warning')
  const notifyInfo = (message) => notify(message, 'info')

  return {
    notify,
    confirmAction,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo
  }
}
