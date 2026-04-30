/**
 * Tests for loadingMessages.js
 *
 * All functions here are pure string transformations — no DOM, no Vue, no
 * side effects — so they are tested directly without any mocking.
 */
import {
  convertToUserFriendlyMessage,
  getLoadingMessage,
  consoleMessages,
} from '../src/utils/loadingMessages.js';

// ---------------------------------------------------------------------------
// convertToUserFriendlyMessage
// ---------------------------------------------------------------------------
describe('convertToUserFriendlyMessage', () => {
  test('returns a default message for falsy input', () => {
    expect(convertToUserFriendlyMessage('')).toBe('Loading terms and definitions...');
    expect(convertToUserFriendlyMessage(null)).toBe('Loading terms and definitions...');
    expect(convertToUserFriendlyMessage(undefined)).toBe('Loading terms and definitions...');
  });

  test('converts "Loading local terms from repository" message', () => {
    expect(convertToUserFriendlyMessage('Loading local terms from repository')).toBe(
      'Searching repository for term definitions...'
    );
  });

  test('converts "Reading N term definition files" message', () => {
    expect(convertToUserFriendlyMessage('Reading 5 term definition files')).toBe(
      'Reading 5 definition files...'
    );
    expect(convertToUserFriendlyMessage('Reading 42 term definition files')).toBe(
      'Reading 42 definition files...'
    );
  });

  test('converts "Found N local terms" message', () => {
    expect(convertToUserFriendlyMessage('Found 10 local terms')).toBe('✓ Found 10 local terms');
  });

  test('does not confuse "Found N local terms" with external terms message', () => {
    // Message contains "external" — should fall through to fallback
    const msg = 'Found 3 local terms from external source';
    expect(convertToUserFriendlyMessage(msg)).not.toBe('✓ Found 3 local terms');
  });

  test('converts "No local terms directory found" message', () => {
    expect(convertToUserFriendlyMessage('No local terms directory found')).toBe(
      'No local terms directory found'
    );
  });

  test('converts "Preparing to load external specifications" message', () => {
    expect(convertToUserFriendlyMessage('Preparing to load external specifications')).toBe(
      'Getting ready to fetch external references...'
    );
  });

  test('converts "Loading external spec N/M: name..." message', () => {
    expect(
      convertToUserFriendlyMessage('Loading external spec 2/3: my-spec...')
    ).toBe('Fetching external reference 2 of 3: my-spec');
  });

  test('converts "Checking proxy connectivity for name..." message', () => {
    expect(convertToUserFriendlyMessage('Checking proxy connectivity for my-spec...')).toBe(
      'Connecting to my-spec...'
    );
  });

  test('returns generic connection message when spec name is absent in proxy check', () => {
    expect(convertToUserFriendlyMessage('Checking proxy connectivity')).toBe(
      'Establishing connection...'
    );
  });

  test('converts "Fetching name (attempt N/M)" message', () => {
    expect(convertToUserFriendlyMessage('Fetching my-spec (attempt 1/3)')).toBe(
      'Downloading my-spec (try 1 of 3)'
    );
  });

  test('converts "Processing terms from name..." message', () => {
    expect(convertToUserFriendlyMessage('Processing terms from my-spec...')).toBe(
      'Reading terms from my-spec...'
    );
  });

  test('returns generic message when spec name is absent in processing message', () => {
    expect(convertToUserFriendlyMessage('Processing terms from')).toBe(
      'Reading terms from external source...'
    );
  });

  test('converts "Successfully loaded N terms from name" message', () => {
    expect(convertToUserFriendlyMessage('Successfully loaded 7 terms from my-spec')).toBe(
      '✓ Found 7 terms from my-spec'
    );
  });

  test('converts "Connection failed ... retrying" message with spec name', () => {
    expect(
      convertToUserFriendlyMessage('Connection failed for my-spec (retrying)')
    ).toBe('Connection failed for my-spec, trying alternative...');
  });

  test('converts "Connection failed ... retrying" without spec name', () => {
    expect(convertToUserFriendlyMessage('Connection failed and retrying')).toBe(
      'Connection failed, trying alternative...'
    );
  });

  test('converts "Failed to load name - all connection attempts failed"', () => {
    expect(
      convertToUserFriendlyMessage('Failed to load my-spec - all connection attempts failed')
    ).toBe('⚠ Could not connect to my-spec');
  });

  test('converts "Failed to load ... all connection attempts failed" without spec name', () => {
    expect(
      convertToUserFriendlyMessage('Failed to load - all connection attempts failed')
    ).toBe('⚠ Connection failed for external source');
  });

  test('converts "Successfully loaded N external terms from N spec" message', () => {
    expect(
      convertToUserFriendlyMessage('Successfully loaded 12 external terms from 3 spec')
    ).toBe('✓ Successfully loaded 12 external terms from 3 source(s)');
  });

  test('converts "Completed external spec processing - no terms found" message', () => {
    expect(
      convertToUserFriendlyMessage('Completed external spec processing - no terms found')
    ).toBe('✓ External sources checked - no additional terms found');
  });

  test('passes through "Loading complete" messages unchanged', () => {
    const msg = 'Loading complete: 42 terms ready';
    expect(convertToUserFriendlyMessage(msg)).toBe(msg);
  });

  test('returns the original message when no pattern matches', () => {
    const msg = 'Some unknown technical message';
    expect(convertToUserFriendlyMessage(msg)).toBe(msg);
  });
});

// ---------------------------------------------------------------------------
// getLoadingMessage
// ---------------------------------------------------------------------------
describe('getLoadingMessage', () => {
  test('converts a truthy proxyInfo string', () => {
    expect(getLoadingMessage('Loading local terms from repository')).toBe(
      'Searching repository for term definitions...'
    );
  });

  test('returns default message when proxyInfo is falsy', () => {
    expect(getLoadingMessage(null)).toBe('Loading terms and definitions...');
    expect(getLoadingMessage('')).toBe('Loading terms and definitions...');
    expect(getLoadingMessage(undefined)).toBe('Loading terms and definitions...');
  });
});

// ---------------------------------------------------------------------------
// consoleMessages (template function smoke tests)
// ---------------------------------------------------------------------------
describe('consoleMessages', () => {
  test('scanningFile includes the file path', () => {
    expect(consoleMessages.scanningFile('spec/terms/foo.md')).toContain('spec/terms/foo.md');
  });

  test('foundTerm includes termId and filePath', () => {
    const msg = consoleMessages.foundTerm('my-term', 'spec/terms/foo.md');
    expect(msg).toContain('my-term');
    expect(msg).toContain('spec/terms/foo.md');
  });

  test('extractedTerms includes count and filePath', () => {
    const msg = consoleMessages.extractedTerms(5, 'spec/terms/foo.md');
    expect(msg).toContain('5');
    expect(msg).toContain('spec/terms/foo.md');
  });

  test('loadedLocalTerms includes count', () => {
    expect(consoleMessages.loadedLocalTerms(10)).toContain('10');
  });

  test('checkingProxy includes spec name', () => {
    expect(consoleMessages.checkingProxy('my-spec')).toContain('my-spec');
  });

  test('proxyResponsive includes spec name', () => {
    expect(consoleMessages.proxyResponsive('my-spec')).toContain('my-spec');
  });

  test('loadingExternalSpec includes spec, page, proxy indices', () => {
    const msg = consoleMessages.loadingExternalSpec('my-spec', 'https://example.com', 1, 3);
    expect(msg).toContain('my-spec');
    expect(msg).toContain('https://example.com');
    expect(msg).toContain('1');
    expect(msg).toContain('3');
  });

  test('loadedExternalTerms includes count, spec, proxy index', () => {
    const msg = consoleMessages.loadedExternalTerms(7, 'my-spec', 2);
    expect(msg).toContain('7');
    expect(msg).toContain('my-spec');
    expect(msg).toContain('2');
  });

  test('refreshComplete includes count', () => {
    expect(consoleMessages.refreshComplete(42)).toContain('42');
  });

  test('errorLoadingFile includes filePath and error', () => {
    const msg = consoleMessages.errorLoadingFile('foo.md', 'Not found');
    expect(msg).toContain('foo.md');
    expect(msg).toContain('Not found');
  });
});
