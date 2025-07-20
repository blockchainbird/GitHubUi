import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const basePath = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  base: basePath,
  plugins: [vue()],
  server: {
    port: 3000,
    open: true
  }
})
