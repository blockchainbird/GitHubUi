/**
 * Utility for converting technical loading messages to user-friendly ones
 * Used across components to maintain consistency
 */

/**
 * Convert technical proxy/loading messages to user-friendly messages
 * @param {string} message - The technical message from the loading process
 * @returns {string} - User-friendly message
 */
export function convertToUserFriendlyMessage(message) {
  if (!message) {
    return 'Loading terms and definitions...'
  }

  // Local loading messages
  if (message.includes('Loading local terms from repository')) {
    return 'Searching repository for term definitions...'
  }
  if (message.includes('Reading') && message.includes('term definition files')) {
    const match = message.match(/Reading (\d+) term definition files/)
    if (match) {
      return `Reading ${match[1]} definition files...`
    }
  }
  if (message.includes('Found') && message.includes('local terms') && !message.includes('external')) {
    const match = message.match(/Found (\d+) local terms/)
    if (match) {
      return `✓ Found ${match[1]} local terms`
    }
  }
  if (message.includes('No local terms directory found')) {
    return 'No local terms directory found'
  }
  
  // External loading messages
  if (message.includes('Preparing to load external specifications')) {
    return 'Getting ready to fetch external references...'
  }
  if (message.includes('Loading external spec') && message.includes(':')) {
    const match = message.match(/Loading external spec (\d+)\/(\d+): (.+?)\.\.\./)
    if (match) {
      return `Fetching external reference ${match[1]} of ${match[2]}: ${match[3]}`
    }
  }
  if (message.includes('Checking proxy connectivity')) {
    const specMatch = message.match(/for (.+?)\.\.\./)
    if (specMatch) {
      return `Connecting to ${specMatch[1]}...`
    }
    return 'Establishing connection...'
  }
  if (message.includes('Fetching') && message.includes('attempt')) {
    const match = message.match(/Fetching (.+?) \(attempt (\d+)\/(\d+)\)/)
    if (match) {
      return `Downloading ${match[1]} (try ${match[2]} of ${match[3]})`
    }
  }
  if (message.includes('Processing terms from')) {
    const specMatch = message.match(/from (.+?)\.\.\./)
    if (specMatch) {
      return `Reading terms from ${specMatch[1]}...`
    }
    return 'Reading terms from external source...'
  }
  if (message.includes('Successfully loaded') && message.includes('terms from')) {
    const match = message.match(/(\d+) terms from (.+)/)
    if (match) {
      return `✓ Found ${match[1]} terms from ${match[2]}`
    }
  }
  if (message.includes('Connection failed') && message.includes('retrying')) {
    const specMatch = message.match(/for (.+?) \(/)
    if (specMatch) {
      return `Connection failed for ${specMatch[1]}, trying alternative...`
    }
    return 'Connection failed, trying alternative...'
  }
  if (message.includes('Failed to load') && message.includes('all connection attempts failed')) {
    const specMatch = message.match(/Failed to load (.+?) -/)
    if (specMatch) {
      return `⚠ Could not connect to ${specMatch[1]}`
    }
    return '⚠ Connection failed for external source'
  }
  if (message.includes('Successfully loaded') && message.includes('external terms')) {
    const match = message.match(/(\d+) external terms from (\d+) spec/)
    if (match) {
      return `✓ Successfully loaded ${match[1]} external terms from ${match[2]} source(s)`
    }
  }
  if (message.includes('Completed external spec processing - no terms found')) {
    return '✓ External sources checked - no additional terms found'
  }
  if (message.includes('Loading complete')) {
    // Keep completion messages as they are since they're already user-friendly
    return message
  }
  
  // Fallback to original message if no match
  return message
}

/**
 * Get a user-friendly loading message based on proxy info
 * @param {string} proxyInfo - The proxy info from the composable
 * @returns {string} - User-friendly loading message
 */
export function getLoadingMessage(proxyInfo) {
  if (proxyInfo) {
    return convertToUserFriendlyMessage(proxyInfo)
  }
  return 'Loading terms and definitions...'
}

/**
 * Get console-friendly messages that align with user-friendly messages
 * These provide more technical detail for developers while staying consistent
 */
export const consoleMessages = {
  // Local loading
  scanningFile: (filePath) => `🔍 Scanning file ${filePath} for terms...`,
  foundTerm: (termId, filePath) => `✅ Found term "${termId}" in ${filePath}`,
  extractedTerms: (count, filePath) => `📋 Extracted ${count} terms from ${filePath}`,
  loadedLocalTerms: (count) => `✅ Loaded ${count} terms from local directory`,
  
  // External loading
  checkingProxy: (spec) => `🔄 Checking proxy connectivity for ${spec}...`,
  proxyResponsive: (spec) => `✅ Proxy is responsive for ${spec}`,
  proxyCheckFailed: (spec) => `⚠️ Proxy status check failed for ${spec}, proceeding anyway`,
  loadingExternalSpec: (spec, page, proxyIndex, totalProxies) => 
    `🌐 Loading external spec: ${spec} from ${page} (proxy ${proxyIndex}/${totalProxies})`,
  loadedExternalTerms: (count, spec, proxyIndex) => 
    `✅ Successfully loaded ${count} terms from ${spec} using proxy ${proxyIndex}`,
  noTermsFound: (page, proxyIndex) => 
    `⚠️ No terms-and-definitions-list found in ${page} using proxy ${proxyIndex}`,
  proxyFailed: (proxyIndex, spec, error) => 
    `❌ Proxy ${proxyIndex} failed for ${spec}: ${error}`,
  allProxiesFailed: (spec) => 
    `🔴 All proxies failed for external spec ${spec}. Skipping.`,
  unableToLoad: (spec, page) => 
    `🔴 Unable to load external spec ${spec} from ${page} - all proxy methods failed`,
  
  // Cache and refresh
  refreshingTerms: () => '🔄 Refreshing terms - clearing cache...',
  cacheCleared: () => '🔄 Cache cleared, reloading from repository...',
  refreshComplete: (count) => `✅ Terms refresh complete - ${count} terms loaded`,
  
  // Errors
  errorLoadingFile: (filePath, error) => `❌ Error loading file ${filePath}: ${error}`,
  errorLoadingTerms: (error) => `❌ Error loading terms: ${error}`,
  errorParsingStoredTerms: (error) => `❌ Error parsing stored terms: ${error}`,
  termsDirectoryNotFound: (error) => `⚠️ Terms directory not found or inaccessible: ${error}`,
  initializationFailed: (error) => `⚠️ Failed to load terms during initialization: ${error}`
}
