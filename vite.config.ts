import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('markdown-it')) {
              return 'markdown';
            }
            if (id.includes('vue') || id.includes('vue-router')) {
              return 'vue-core';
            }
            if (id.includes('axios')) {
              return 'axios';
            }
            if (id.includes('radix-vue') || id.includes('lucide-vue-next')) {
              return 'ui-components';
            }
            if (id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'utils';
            }
            return 'vendor';
          }

          if (id.includes('src/views/HomeView')) {
            return 'home';
          }
          if (id.includes('src/views/LogView')) {
            return 'log';
          }
          if (id.includes('src/views/ApiDocsView')) {
            return 'api-docs';
          }
          if (id.includes('src/views/ImprintView')) {
            return 'imprint';
          }
          if (id.includes('src/views/PrivacyPolicyView')) {
            return 'privacy';
          }
        },
      }
    },
    chunkSizeWarningLimit: 500,
  }
})
