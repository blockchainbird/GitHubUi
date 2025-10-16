/**
 * Web-based link checker for GitHubUi
 * 
 * This module provides browser-compatible link checking functionality
 * that uses the proxy.php to bypass CORS restrictions.
 * 
 * Unlike the Node.js version with linkinator, this version:
 * - Works entirely in the browser
 * - Uses fetch API with proxy.php for CORS bypass
 * - Provides basic link validation (HTTP status codes)
 * - Does not require local file access
 * 
 * Limitations:
 * - Cannot check file:// URLs (needs published URLs)
 * - Less comprehensive than linkinator
 * - Depends on proxy.php availability
 * 
 * @module webLinkChecker
 */

/**
 * Checks links in a published HTML page using browser fetch + proxy
 * 
 * @param {string} htmlUrl - URL of the published HTML page
 * @param {Object} options - Configuration options
 * @param {Function} [options.onProgress] - Progress callback
 * @param {number} [options.timeout=10000] - Request timeout in ms
 * @param {number} [options.maxLinks=100] - Maximum number of links to check
 * @returns {Promise<Object>} Link check results
 */
export async function checkPublishedPage(htmlUrl, options = {}) {
  const {
    onProgress = null,
    timeout = 10000,
    maxLinks = 100
  } = options;

  try {
    // Fetch the HTML page via proxy
    if (onProgress) {
      onProgress({ stage: 'fetching', message: 'Fetching HTML page...' });
    }

    const html = await fetchViaProxy(htmlUrl, timeout);
    
    // Extract links from HTML
    if (onProgress) {
      onProgress({ stage: 'extracting', message: 'Extracting links from HTML...' });
    }

    const links = extractLinksFromHtml(html, htmlUrl, maxLinks);
    
    if (onProgress) {
      onProgress({ 
        stage: 'extracted', 
        message: `Found ${links.length} links to check`,
        totalLinks: links.length 
      });
    }

    // Check each link
    const results = [];
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      
      if (onProgress) {
        onProgress({
          stage: 'checking',
          message: `Checking link ${i + 1}/${links.length}`,
          current: i + 1,
          total: links.length,
          currentLink: link
        });
      }

      const result = await checkSingleLink(link, timeout);
      results.push(result);

      // Small delay to avoid overwhelming the proxy
      await sleep(100);
    }

    // Categorize results
    const broken = results.filter(r => r.status === 'broken');
    const ok = results.filter(r => r.status === 'ok');
    const skipped = results.filter(r => r.status === 'skipped');
    const warnings = results.filter(r => r.status === 'warning');

    return {
      success: broken.length === 0,
      totalLinks: links.length,
      checked: results.length,
      broken: broken.length,
      ok: ok.length,
      skipped: skipped.length,
      warnings: warnings.length,
      results,
      brokenLinks: broken.map(r => ({
        url: r.url,
        statusCode: r.statusCode,
        error: r.error,
        message: r.message
      })),
      warningLinks: warnings.map(r => ({
        url: r.url,
        statusCode: r.statusCode,
        error: r.error,
        message: r.message || r.error
      })),
      summary: `Checked ${results.length} links: ${ok.length} OK, ${broken.length} broken, ${warnings.length} warnings`
    };

  } catch (error) {
    throw new Error(`Link checking failed: ${error.message}`);
  }
}

/**
 * Fetches content via proxy.php to bypass CORS
 * Falls back to direct fetch if proxy is not available (dev mode)
 * 
 * @param {string} url - URL to fetch
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<string>} Response text
 * @private
 */
async function fetchViaProxy(url, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Try proxy first (for production)
    const proxyUrl = `./proxy.php?url=${encodeURIComponent(url)}`;
    let response;
    
    try {
      response = await fetch(proxyUrl, {
        signal: controller.signal
      });
      
      // If proxy returns 404 (dev mode - PHP not available), try direct fetch
      if (response.status === 404) {
        console.warn('Proxy not available (dev mode), trying direct fetch...');
        response = await fetch(url, {
          signal: controller.signal,
          mode: 'cors' // Allow CORS
        });
      }
    } catch (proxyError) {
      // Proxy failed, try direct fetch
      console.warn('Proxy fetch failed, trying direct fetch:', proxyError.message);
      response = await fetch(url, {
        signal: controller.signal,
        mode: 'cors'
      });
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

/**
 * Extracts links from HTML content
 * 
 * @param {string} html - HTML content
 * @param {string} baseUrl - Base URL for resolving relative links
 * @param {number} maxLinks - Maximum number of links to extract
 * @returns {string[]} Array of absolute URLs
 * @private
 */
function extractLinksFromHtml(html, baseUrl, maxLinks) {
  const links = new Set();
  
  // Create a temporary DOM element to parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Extract links from <a> tags (most important for navigation)
  doc.querySelectorAll('a[href]').forEach(element => {
    const href = element.getAttribute('href');
    
    if (href) {
      // Skip certain protocols and fragments
      if (href.startsWith('mailto:') || 
          href.startsWith('tel:') || 
          href.startsWith('javascript:') ||
          href.startsWith('#')) {
        return;
      }
      
      // Resolve relative URLs
      try {
        const absoluteUrl = new URL(href, baseUrl);
        links.add(absoluteUrl.href);
      } catch (e) {
        // Invalid URL, skip it
      }
    }
  });
  
  // Return limited number of links
  const linksArray = Array.from(links);
  return linksArray.slice(0, maxLinks);
}

/**
 * Checks if a single link is accessible
 * 
 * @param {string} url - URL to check
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Object>} Check result
 * @private
 */
async function checkSingleLink(url, timeout) {
  // Skip checking certain URLs
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return {
      url,
      status: 'skipped',
      statusCode: 0,
      message: 'Localhost URL skipped'
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Try proxy first, fall back to direct fetch
    let response;
    let method = 'HEAD';
    
    try {
      const proxyUrl = `./proxy.php?url=${encodeURIComponent(url)}&method=HEAD`;
      response = await fetch(proxyUrl, {
        signal: controller.signal
      });
      
      // If proxy not available (404), try direct HEAD request
      if (response.status === 404) {
        console.warn('Proxy not available, trying direct HEAD request for:', url);
        response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          mode: 'cors'
        });
      }
      
      // Some sites (like Wikipedia) block HEAD but allow GET
      // If we get a 405 (Method Not Allowed) or 403, try GET instead
      if (response.status === 405 || response.status === 403) {
        console.warn('HEAD blocked for:', url, 'trying GET...');
        const getProxyUrl = `./proxy.php?url=${encodeURIComponent(url)}`;
        response = await fetch(getProxyUrl, {
          signal: controller.signal
        });
        method = 'GET';
      }
    } catch (proxyError) {
      // Proxy failed, try direct HEAD request
      console.warn('Proxy failed, trying direct HEAD for:', url);
      try {
        response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          mode: 'cors'
        });
      } catch (headError) {
        // HEAD failed, try GET as last resort (some sites block HEAD)
        console.warn('HEAD failed, trying GET for:', url);
        response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          mode: 'cors'
        });
        method = 'GET';
      }
    }

    clearTimeout(timeoutId);

    // Check response status
    const statusCode = response.status;
    
    // Redirects (300-399) should be treated as OK since they indicate the resource exists
    // and browsers/clients will automatically follow them to the correct location
    if (statusCode >= 200 && statusCode < 400) {
      const redirectMessage = statusCode >= 300 ? ` (redirects to final destination)` : '';
      return {
        url,
        status: 'ok',
        statusCode,
        message: `OK${redirectMessage}`
      };
    } else {
      return {
        url,
        status: 'broken',
        statusCode,
        message: `HTTP ${statusCode}`
      };
    }

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      return {
        url,
        status: 'broken',
        statusCode: 0,
        error: 'Timeout'
      };
    }
    
    // CORS errors in dev mode - mark as warning, not broken
    if (error.message && error.message.includes('CORS')) {
      return {
        url,
        status: 'warning',
        statusCode: 0,
        error: 'CORS blocked (dev mode - use production build to check via proxy)'
      };
    }
    
    return {
      url,
      status: 'warning',
      statusCode: 0,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Sleep utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 * @private
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simplified check for GitHub Pages URL
 * Just verifies the page is accessible
 * 
 * @param {string} ghPageUrl - GitHub Pages URL
 * @returns {Promise<Object>} Check result
 */
export async function checkGitHubPagesAccessibility(ghPageUrl) {
  try {
    const proxyUrl = `./proxy.php?url=${encodeURIComponent(ghPageUrl)}&method=HEAD`;
    const response = await fetch(proxyUrl, {
      method: 'GET'
    });

    const accessible = response.ok;
    
    return {
      success: accessible,
      statusCode: response.status,
      message: accessible 
        ? `GitHub Pages site is accessible at ${ghPageUrl}`
        : `GitHub Pages site returned HTTP ${response.status}`,
      url: ghPageUrl
    };

  } catch (error) {
    return {
      success: false,
      statusCode: 0,
      message: `Failed to access GitHub Pages: ${error.message}`,
      url: ghPageUrl,
      error: error.message
    };
  }
}

export default {
  checkPublishedPage,
  checkGitHubPagesAccessibility
};
