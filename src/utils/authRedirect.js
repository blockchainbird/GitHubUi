const INTENDED_REDIRECT_KEY = 'intended_redirect'

/** In-memory cache so double redirects after login don't fall back to /home. */
let cachedDestination = null

/**
 * Read the stored post-login destination without clearing it.
 */
export function peekPostLoginDestination() {
  if (cachedDestination) {
    return cachedDestination
  }

  const stored = localStorage.getItem(INTENDED_REDIRECT_KEY)
  if (stored && stored !== '/login' && !stored.startsWith('/login?')) {
    return stored
  }
  return '/home'
}

/**
 * Read and clear the stored post-login destination.
 * Falls back to /home when nothing valid is stored.
 */
export function getPostLoginDestination() {
  const destination = peekPostLoginDestination()
  cachedDestination = destination
  localStorage.removeItem(INTENDED_REDIRECT_KEY)
  return destination
}

/**
 * Navigate away from login to the saved destination (or home).
 * Uses hash assignment as a hard fallback if Vue Router stays on /login.
 */
export async function redirectAfterLogin(router) {
  const destination = getPostLoginDestination()

  try {
    if (router.currentRoute.value.path === '/login') {
      await router.replace(destination)
    }
  } catch (error) {
    console.error('Post-login router redirect failed:', error)
  }

  // Hard fallback: Vue Router sometimes leaves the URL on /login
  if (router.currentRoute.value.path === '/login' || router.currentRoute.value.path.startsWith('/login')) {
    const hash = destination.startsWith('/') ? `#${destination}` : `#/${destination}`
    globalThis.location.hash = hash
  }

  cachedDestination = null
}
