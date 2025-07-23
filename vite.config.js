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
    // sets the Rollup output option manualChunks to undefined during the build process. This disables code splitting for dynamic imports, so all code will be bundled into a single output file instead of splitting into multiple chunks. This can be useful if you want a single JavaScript file for deployment, but it may increase the bundle size and affect loading performance for larger apps.
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    }
  }
})
