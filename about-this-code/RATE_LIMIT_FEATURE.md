# GitHub API Rate Limit Monitoring

## Overview

The GitHub API Rate Limit Monitoring feature provides real-time information about the user's remaining API calls and when they will reset. This helps users understand when they need to wait before making more API requests.

## Features

### 🔍 Real-Time Rate Limit Tracking

- **Automatic Detection**: Captures rate limit headers from all GitHub API responses
- **Live Updates**: Updates immediately after each API call
- **Persistent Display**: Shows current status in the navigation bar
- **Visual Indicators**: Color-coded badges to indicate rate limit status

### 📊 Rate Limit Information

- **Remaining Calls**: Shows exact number of API calls left
- **Total Limit**: Displays the total rate limit (usually 5000 for authenticated users)
- **Reset Time**: Shows time remaining until rate limit resets
- **Status Colors**:
  - **Blue**: Normal (100+ calls remaining)
  - **Yellow**: Low (10-99 calls remaining)
  - **Red**: Critical (<10 calls remaining, pulsing animation)

## Implementation Details

### Architecture

The rate limit monitoring system consists of three main components:

1. **Axios Interceptor** (`src/main.js`):
   - Intercepts all HTTP responses from GitHub API
   - Extracts rate limit headers (`x-ratelimit-remaining`, `x-ratelimit-reset`, `x-ratelimit-limit`)
   - Updates global rate limit state

2. **Rate Limit Composable** (`src/composables/useRateLimit.js`):
   - Manages global reactive state for rate limit information
   - Provides computed properties for status indicators
   - Handles time calculations and formatting

3. **Rate Limit Indicator Component** (`src/components/RateLimitIndicator.vue`):
   - Displays rate limit information in the navigation bar
   - Shows color-coded badge with remaining calls
   - Provides detailed tooltip with full information

### Code Quality Features

- **Low Cognitive Complexity**: Each function has a single responsibility
- **No Duplication**: Centralized rate limit management
- **Reactive Updates**: Uses Vue 3 Composition API for efficient reactivity
- **Error Resilience**: Gracefully handles missing or invalid headers

## Usage

### For Users

1. **Login**: The rate limit indicator appears after first API call
2. **Monitor**: Check the badge in the navigation bar to see remaining calls
3. **Plan Actions**: Use the information to plan when to perform API-intensive operations
4. **Wait When Needed**: If calls are exhausted, wait for the reset time shown in tooltip

### For Developers

```javascript
// Import the composable
import { useRateLimit } from '@/composables/useRateLimit'

// Use in any component
const {
  rateLimitRemaining,
  isRateLimitLow,
  isRateLimitCritical,
  formatTimeRemaining
} = useRateLimit()
```

## Technical Specifications

### GitHub API Headers

- `x-ratelimit-limit`: Total number of requests allowed per hour
- `x-ratelimit-remaining`: Number of requests remaining in current window
- `x-ratelimit-reset`: Unix timestamp when rate limit resets

### Rate Limit Thresholds

- **Normal**: 100+ calls remaining
- **Low**: 10-99 calls remaining  
- **Critical**: <10 calls remaining

### Performance Impact

- **Minimal Overhead**: Only processes headers from GitHub API responses
- **No Additional Requests**: Uses existing API call responses
- **Efficient Updates**: Reactive system only updates when values change

## Benefits

### 🎯 **User Experience**

- Prevents unexpected API limit errors
- Helps users plan their workflow
- Provides transparency into API usage

### 🔧 **Development Benefits**

- Centralized rate limit management
- Easy to extend for other rate limit types
- Follows Vue 3 best practices

### 📈 **Operational Benefits**

- Reduces support requests about rate limiting
- Helps identify high-usage patterns
- Improves overall application reliability

## File Structure

```text
src/
├── composables/
│   └── useRateLimit.js          # Rate limit state management
├── components/
│   ├── RateLimitIndicator.vue   # UI component for display
│   └── MainNav.vue              # Navigation bar (updated)
└── main.js                      # Axios interceptor (updated)
```

## Future Enhancements

- **Secondary Rate Limits**: Monitor search API and other specialized limits
- **Historical Tracking**: Show rate limit usage patterns over time
- **Notifications**: Alert users when approaching rate limit
- **Auto-Throttling**: Automatically slow down requests when limits are low

## Why These Files Should Stay

### `useRateLimit.js`

- **Core Functionality**: Provides essential rate limit tracking capability
- **Reusable**: Can be used by any component that needs rate limit information
- **Centralized**: Single source of truth for rate limit state

### `RateLimitIndicator.vue`

- **User Interface**: Essential for displaying rate limit information to users
- **Visual Feedback**: Provides immediate feedback about API usage status
- **Accessibility**: Includes proper tooltips and color coding

### Usage Instructions

1. **Monitor the Badge**: Look at the speedometer icon in the navigation bar
2. **Check Tooltip**: Hover over the badge for detailed information
3. **Plan Accordingly**: When calls are low, consider waiting for reset
4. **Color Meanings**: Blue=good, Yellow=caution, Red=critical

This feature enhances the user experience by providing transparency into GitHub API usage and helps prevent unexpected rate limit errors.
