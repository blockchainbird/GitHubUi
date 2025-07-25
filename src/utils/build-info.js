// Utility to safely get build info
export const getBuildInfo = () => {
  try {
    // Try to import the generated build info
    import('./generated/build-info.js').then(module => module.BUILD_INFO);
  } catch (error) {
    // Return fallback info for development
    return {
      timestamp: new Date().toISOString(),
      buildDate: 'Development Mode'
    };
  }
};
