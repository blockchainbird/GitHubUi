/**
 * Simple utility to check if a file is in the terms directory
 * This is the ONLY condition that determines if a file is a terms file
 */

/**
 * Check if file is in terms directory based on specs config
 * @param {string} filePath - The file path to check
 * @param {Object} specsConfig - The specs configuration object
 * @returns {boolean} True if file is in terms directory
 */
export const isInTermsDirectory = (filePath, specsConfig) => {
  try {
    if (!specsConfig || !specsConfig.specs || specsConfig.specs.length === 0) {
      return false
    }

    if (!filePath) {
      return false
    }

    // Handle both string and array paths
    let pathString = filePath
    if (Array.isArray(filePath)) {
      pathString = filePath.join('/')
    }

    const config = specsConfig.specs[0]
    const specDir = config.spec_directory?.replace('./', '') || 'spec'
    const termsDir = config.spec_terms_directory || 'terms-definitions'
    const fullTermsPath = `${specDir}/${termsDir}`

    const normalizedTermsPath = fullTermsPath.replace(/^\/+|\/+$/g, '')
    const normalizedFilePath = decodeURIComponent(pathString).replace(/^\/+|\/+$/g, '')

    return normalizedFilePath.startsWith(normalizedTermsPath + '/') ||
           normalizedFilePath === normalizedTermsPath
  } catch (err) {
    console.error('Error checking if file is in terms directory:', err)
    return false
  }
}
