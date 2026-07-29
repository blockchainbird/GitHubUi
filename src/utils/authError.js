/**
 * Decide whether a GitHub API error means the session token is invalid
 * and the user must re-authenticate.
 *
 * Important: GitHub often returns 403 for rate limits, SSO, missing resource
 * access, etc. Those must NOT clear the session or bounce to /login.
 */
export function isAuthenticationFailure(error) {
  const status = error?.response?.status
  if (status === 401) {
    return true
  }

  if (status !== 403) {
    return false
  }

  const message = String(
    error.response?.data?.message ||
    error.message ||
    ''
  ).toLowerCase()

  // Rate limiting is not an auth failure
  if (
    message.includes('rate limit') ||
    message.includes('secondary rate limit') ||
    error.response?.headers?.['x-ratelimit-remaining'] === '0'
  ) {
    return false
  }

  // Only treat 403 as auth failure for clear credential / auth messages
  return (
    message.includes('bad credentials') ||
    message.includes('requires authentication') ||
    message.includes('must be authenticated') ||
    message.includes('token expired') ||
    message.includes('token revoked') ||
    message.includes('invalid token')
  )
}
