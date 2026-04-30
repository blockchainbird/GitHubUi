/**
 * Minimal Vue stub for Jest tests.
 *
 * This file stubs out the parts of the 'vue' package that utility modules
 * import (e.g. nextTick). It is placed here so Jest's moduleNameMapper can
 * resolve `import ... from 'vue'` without pulling in the full Vue runtime,
 * which is not needed when testing pure utility functions.
 */
export const nextTick = () => Promise.resolve();
