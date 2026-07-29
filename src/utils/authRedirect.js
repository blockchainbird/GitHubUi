const INTENDED_REDIRECT_KEY = 'intended_redirect'

/**
 * Read and clear the stored post-login destination.
 * Falls back to /home when nothing valid is stored.
 */
export function getPostLoginDestination() {
  const stored = localStorage.getItem(INTENDED_REDIRECT_KEY)
  if (stored) {
    localStorage.removeItem(INTENDED_REDIRECT_KEY)
  }

  if (stored && stored !== '/login' && !stored.startsWith('/login?')) {
    return stored
  }

  return '/home'
}

/**
 * Navigate away from login to the saved destination (or home).
 */
export function redirectAfterLogin(router) {
  const destination = getPostLoginDestination()
  router.replace(destination)
}
