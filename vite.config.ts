import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        manualChunks: undefined,
        inlineDynamicImports: true,
        entryFileNames: 'game.js',
        chunkFileNames: 'game.js',
        assetFileNames: '[name][extname]',
        format: 'iife',
        name: 'PokerSerpent'
      },
      external: []
    },
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    minify: true,
    target: 'es2015',
    lib: false
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './')
    }
  },
  base: './',
  publicDir: 'public'
}) 