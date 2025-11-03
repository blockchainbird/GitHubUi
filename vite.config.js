import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [vue()],
    server: {
      port: 3000,
      open: true
    },
    // Optimize dependency handling for spec-up-t-healthcheck
    optimizeDeps: {
      include: ['spec-up-t-healthcheck/web', 'axios'],
      exclude: ['linkinator'] // Exclude Node.js-only packages
    },
    resolve: {
      dedupe: ['axios'], // Prevent duplicate axios instances between packages
      alias: {
        // Prevent Node.js stream modules from being bundled
        'node:stream': 'stream-browserify',
        'node:string_decoder': 'string_decoder'
      }
    },
    // sets the Rollup output option manualChunks to undefined during the build process. This disables code splitting for dynamic imports, so all code will be bundled into a single output file instead of splitting into multiple chunks. This can be useful if you want a single JavaScript file for deployment, but it may increase the bundle size and affect loading performance for larger apps.
    build: {
      rollupOptions: {
        output: {
          // Cache busting: Include hash in filenames to prevent stale caches
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
          manualChunks: undefined
        },
        // Mark Node.js-only modules and their dependencies as external
        // This prevents Rollup from trying to bundle them
        external: (id) => {
          // Exclude Node.js built-in modules
          if (id.startsWith('node:') || id === 'fs' || id === 'path' || id === 'fs/promises' || id === 'child_process') {
            return true;
          }
          // Exclude linkinator and its dependencies (Node.js only)
          if (id.includes('linkinator') || id.includes('htmlparser2')) {
            return true;
          }
          return false;
        }
      }
    }
  }
})
