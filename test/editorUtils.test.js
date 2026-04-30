/**
 * Tests for pure helper functions in editorUtils.js
 *
 * insertText / insertHeading / insertList all call nextTick and manipulate a
 * real textarea element, so they are integration-level and not tested here.
 * getFileExtension is a pure string function and is covered below.
 *
 * processTermReferences is already covered by markdownProcessor.test.js.
 */
import { getFileExtension } from '../src/utils/editorUtils.js';

describe('getFileExtension', () => {
  test('returns the extension of a simple file name', () => {
    expect(getFileExtension('README.md')).toBe('md');
  });

  test('returns the extension of a path with directories', () => {
    expect(getFileExtension('spec/terms/my-term.md')).toBe('md');
  });

  test('returns a lower-cased extension', () => {
    expect(getFileExtension('file.JSON')).toBe('json');
    expect(getFileExtension('archive.TAR')).toBe('tar');
  });

  test('returns the whole name lowercased when there is no dot', () => {
    // split('.').pop() on a dotless name returns the full name (no extension)
    // The function lowercases it but the result is truthy so it is returned as-is.
    expect(getFileExtension('Makefile')).toBe('makefile');
  });

  test('handles dotfiles (no extension)', () => {
    // ".gitignore".split('.') → ['', 'gitignore'] → pop → 'gitignore'
    expect(getFileExtension('.gitignore')).toBe('gitignore');
  });

  test('returns the last extension for files with multiple dots', () => {
    expect(getFileExtension('archive.tar.gz')).toBe('gz');
  });

  test('returns "unknown" for an empty string path', () => {
    // ''.split('.').pop() → '' → falsy → 'unknown'
    expect(getFileExtension('')).toBe('unknown');
  });

  test('handles common spec file extensions', () => {
    expect(getFileExtension('specs.json')).toBe('json');
    expect(getFileExtension('spec/overview.md')).toBe('md');
    expect(getFileExtension('assets/style.css')).toBe('css');
    expect(getFileExtension('scripts/build.js')).toBe('js');
  });
});
