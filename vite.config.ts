import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: undefined,
        inlineDynamicImports: true,
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]'
      }
    },
    assetsInlineLimit: 100000000, // This will inline all assets
    cssCodeSplit: false, // This will bundle all CSS into a single file
    minify: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './')
    }
  }
}) 