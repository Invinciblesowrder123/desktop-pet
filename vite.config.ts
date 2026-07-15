import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

// Plugin to copy externals and models to dist
function copyAssets() {
  return {
    name: 'copy-assets',
    closeBundle() {
      const distExternals = resolve(__dirname, 'dist/externals')
      const distModels = resolve(__dirname, 'dist/models')
      if (!existsSync(distExternals)) mkdirSync(distExternals, { recursive: true })
      if (!existsSync(distModels)) mkdirSync(distModels, { recursive: true })

      // Copy externals
      const externalsDir = resolve(__dirname, 'externals')
      const { readdirSync, cpSync } = require('fs') as typeof import('fs')
      if (existsSync(externalsDir)) {
        cpSync(externalsDir, distExternals, { recursive: true })
      }

      // Copy models
      const modelsDir = resolve(__dirname, 'models')
      if (existsSync(modelsDir)) {
        cpSync(modelsDir, distModels, { recursive: true })
      }
    },
  }
}

export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) { options.reload() },
        vite: {
          build: {
            outDir: 'dist-electron',
          },
        },
      },
    ]),
    renderer(),
    copyAssets(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'url': 'url/',
    },
  },
  define: {
    // PIXI 在 ESM 环境下会引用 require('url')，浏览器无 require
    // 通过 polyfill 替换为空实现
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  optimizeDeps: {
    include: ['url'],
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      external: [],
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
