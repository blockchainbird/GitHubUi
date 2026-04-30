/**
 * Tests for termsFileDetection.js
 *
 * isInTermsDirectory is a pure function with no browser or Vue dependencies.
 * It determines whether a given file path belongs to the terms-definitions
 * directory derived from specs.json configuration.
 */
import { isInTermsDirectory } from '../src/utils/termsFileDetection.js';

/** A typical specs.json configuration object */
const defaultConfig = {
  specs: [
    {
      spec_directory: './spec',
      spec_terms_directory: 'terms-definitions',
    },
  ],
};

describe('isInTermsDirectory', () => {
  describe('returns false for missing or empty inputs', () => {
    test('returns false when specsConfig is null', () => {
      expect(isInTermsDirectory('spec/terms-definitions/foo.md', null)).toBe(false);
    });

    test('returns false when specsConfig has no specs array', () => {
      expect(isInTermsDirectory('spec/terms-definitions/foo.md', {})).toBe(false);
    });

    test('returns false when specs array is empty', () => {
      expect(isInTermsDirectory('spec/terms-definitions/foo.md', { specs: [] })).toBe(false);
    });

    test('returns false when filePath is null', () => {
      expect(isInTermsDirectory(null, defaultConfig)).toBe(false);
    });

    test('returns false when filePath is an empty string', () => {
      expect(isInTermsDirectory('', defaultConfig)).toBe(false);
    });
  });

  describe('detects files inside the terms directory', () => {
    test('returns true for a file directly inside the terms directory', () => {
      expect(
        isInTermsDirectory('spec/terms-definitions/my-term.md', defaultConfig)
      ).toBe(true);
    });

    test('returns true when the path exactly equals the terms directory', () => {
      expect(
        isInTermsDirectory('spec/terms-definitions', defaultConfig)
      ).toBe(true);
    });

    test('returns true when filePath is given as an array of segments', () => {
      expect(
        isInTermsDirectory(
          ['spec', 'terms-definitions', 'my-term.md'],
          defaultConfig
        )
      ).toBe(true);
    });

    test('strips leading slashes before comparing', () => {
      expect(
        isInTermsDirectory('/spec/terms-definitions/my-term.md', defaultConfig)
      ).toBe(true);
    });

    test('decodes percent-encoded characters in the path', () => {
      expect(
        isInTermsDirectory(
          'spec/terms-definitions/my%20term.md',
          defaultConfig
        )
      ).toBe(true);
    });
  });

  describe('rejects files outside the terms directory', () => {
    test('returns false for a file in the spec root', () => {
      expect(isInTermsDirectory('spec/introduction.md', defaultConfig)).toBe(false);
    });

    test('returns false for a file in a sibling directory', () => {
      expect(isInTermsDirectory('spec/sections/overview.md', defaultConfig)).toBe(false);
    });

    test('returns false for a path that only partially matches the directory name', () => {
      expect(
        isInTermsDirectory('spec/terms-definitions-extra/foo.md', defaultConfig)
      ).toBe(false);
    });
  });

  describe('respects custom spec_directory and spec_terms_directory', () => {
    const customConfig = {
      specs: [
        {
          spec_directory: './docs',
          spec_terms_directory: 'glossary',
        },
      ],
    };

    test('returns true for a file in the custom terms directory', () => {
      expect(isInTermsDirectory('docs/glossary/term.md', customConfig)).toBe(true);
    });

    test('returns false for the same file against the default config', () => {
      expect(isInTermsDirectory('docs/glossary/term.md', defaultConfig)).toBe(false);
    });

    test('uses default spec_directory "spec" when spec_directory is missing', () => {
      const configNoDir = { specs: [{ spec_terms_directory: 'terms-definitions' }] };
      expect(
        isInTermsDirectory('spec/terms-definitions/foo.md', configNoDir)
      ).toBe(true);
    });

    test('uses default terms directory "terms-definitions" when spec_terms_directory is missing', () => {
      const configNoTerms = { specs: [{ spec_directory: './spec' }] };
      expect(
        isInTermsDirectory('spec/terms-definitions/foo.md', configNoTerms)
      ).toBe(true);
    });
  });
});
