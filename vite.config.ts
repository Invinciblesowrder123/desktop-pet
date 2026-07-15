import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { createReadStream, statSync } from 'fs'

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

// Dev 中间件：把 /models/* 代理到项目根 models/ 目录
// 原因：开发模式下页面来源是 http://localhost:5173，Chromium 默认 webSecurity
//       会拦截跨域读取 file:// 资源，因此开发期改用 http 提供模型文件。
//       打包版页面来源也是 file://，同源可正常读取，无需此中间件。
function serveModelsInDev() {
  return {
    name: 'serve-models-in-dev',
    configureServer(server: any) {
      const root = resolve(__dirname, 'models')
      const mimes: Record<string, string> = {
        '.json': 'application/json',
        '.moc3': 'application/octet-stream',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
      }
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = String(req.url || '')
        if (!url.startsWith('/models/')) return next()
        let rel = decodeURIComponent(url.split('?')[0].replace(/^\/models\//, ''))
        // 安全：防止路径穿越
        const filePath = resolve(root, rel)
        if (!filePath.startsWith(root)) {
          res.statusCode = 403
          return res.end()
        }
        try {
          statSync(filePath)
        } catch {
          res.statusCode = 404
          return res.end()
        }
        const ext = filePath.toLowerCase().slice(filePath.lastIndexOf('.'))
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
        res.setHeader('Content-Type', mimes[ext] || 'application/octet-stream')
        createReadStream(filePath).pipe(res)
      })
    },
  }
}

export default defineConfig({
  plugins: [
    vue(),
    serveModelsInDev(),
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
