# Google Analytics Configuration

This application includes Google Analytics 4 (GA4) integration for tracking user interactions and usage patterns.

## Setup

### 1. Get your GA4 Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property or use an existing one
3. Get your Measurement ID (format: `G-XXXXXXXXXX`)

### 2. Configure the Environment Variable

Add your Measurement ID to your environment configuration:

**For development:**
Create a `.env` file in the root directory:

```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**For production:**
Set the environment variable in your deployment environment:

```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. Disable Analytics (Optional)

To disable Google Analytics, simply leave the `VITE_GA_MEASUREMENT_ID` environment variable empty or remove it entirely.

## What's Tracked

The application automatically tracks:

- **Page Views**: All route changes and page navigation
- **User Login**: Successful GitHub authentication
- **Login Errors**: Failed authentication attempts
- **File Operations**: File viewing and saving with file type tracking

## Implementation Details

### Files Structure

- `/src/utils/googleAnalytics.js` - Core Google Analytics utility class
- `/src/composables/useGoogleAnalytics.js` - Vue composable for easy integration
- Analytics initialization in `/src/main.js`

### Usage in Components

```javascript
import { useGoogleAnalytics } from '../composables/useGoogleAnalytics.js'

export default {
  setup() {
    const { trackEvent, trackFileOperation } = useGoogleAnalytics()
    
    // Track custom events
    trackEvent('custom_event', { custom_parameter: 'value' })
    
    // Track file operations
    trackFileOperation('edit', 'markdown')
    
    return { trackEvent, trackFileOperation }
  }
}
```

### Privacy Considerations

- Analytics only runs when explicitly configured with a Measurement ID
- No personal data is collected beyond what Google Analytics standard implementation collects
- Debug mode is automatically enabled in development environment
- All tracking can be disabled by not setting the environment variable

## Available Methods

### Core Analytics (`googleAnalytics.js`)

- `init(measurementId)` - Initialize GA4 with measurement ID
- `trackPageView(path, title)` - Track page views
- `trackEvent(name, parameters)` - Track custom events
- `trackLogin(method)` - Track user logins
- `trackFileOperation(action, fileType)` - Track file operations
- `isEnabled()` - Check if analytics is active

### Vue Composable (`useGoogleAnalytics.js`)

- `initAnalytics()` - Initialize with automatic page tracking
- `trackEvent(name, parameters)` - Track custom events
- `trackLogin(method)` - Track logins
- `trackFileOperation(action, fileType)` - Track file operations
- `trackPageView(path, title)` - Manual page view tracking
- `isAnalyticsEnabled()` - Check if analytics is enabled

## Testing

To test the integration:

1. Set up GA4 Measurement ID in development
2. Open browser developer tools → Network tab
3. Navigate through the application
4. Look for requests to `googletagmanager.com` and `google-analytics.com`
5. Check the Google Analytics Real-Time reports in your GA4 dashboard

### Live Demo

The application includes a built-in demo component on the home page that allows you to:

- Check if Google Analytics is enabled
- Test custom event tracking
- Test file operation tracking

## Summary

✅ **Complete Google Analytics GA4 implementation with:**

- Configurable setup via environment variables
- Automatic page view tracking on route changes
- User authentication tracking
- File operation tracking (view, edit, save)
- Clean, modular architecture with utility class and Vue composable
- Privacy-focused (only runs when explicitly configured)
- Debug mode in development
- Live demo component for testing

**Files created/modified:**

- `src/utils/googleAnalytics.js` - Core GA4 utility
- `src/composables/useGoogleAnalytics.js` - Vue composable
- `src/components/GoogleAnalyticsDemo.vue` - Testing component
- `src/main.js` - Application initialization
- `src/components/LoginPage.vue` - Login tracking
- `src/components/FileEditor.vue` - File operation tracking
- `src/components/HomePage.vue` - Demo component integration
- `.env.example` - Configuration template
- `.env` - Local configuration

The implementation is production-ready and follows Vue.js best practices!
