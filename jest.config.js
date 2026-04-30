/**
 * Jest configuration for GitHubUi (Spec-Up-T Editor)
 *
 * Uses --experimental-vm-modules for native ESM support.
 * Run tests with: node --experimental-vm-modules node_modules/.bin/jest
 *
 * Vue is mocked because this project's utility modules occasionally import
 * Vue helpers (e.g. nextTick) that are irrelevant to pure-logic tests.
 */
export default {
  testEnvironment: 'node',

  /**
   * Run browser-global stubs before any test module (and its ESM imports)
   * are evaluated. This allows modules that access navigator/screen/location
   * in their module-level code to be imported safely in Node.js.
   */
  setupFiles: ['<rootDir>/test/setup.js'],

  /** Discover tests only in the test/ folder */
  testMatch: ['<rootDir>/test/**/*.test.js'],

  /**
   * HealthCheck.test.js uses Vitest-specific imports and cannot run under Jest.
   * It is excluded here so the two test runners do not interfere with each other.
   */
  testPathIgnorePatterns: ['<rootDir>/test/HealthCheck.test.js'],

  /** Map the 'vue' package to a lightweight stub so imports don't fail */
  moduleNameMapper: {
    '^vue$': '<rootDir>/test/__mocks__/vue.js',
  },

  /** No transform needed — Jest runs native ESM via --experimental-vm-modules */
  transform: {},

  verbose: true,
};
