import { createApp } from 'vue'
import App from './App.vue'

// PIXI 在 ESM 环境下会引用 require('url')，浏览器没有 require
// 提供一个 polyfill：把 'url' 重定向到 npm 的 url 包
import * as urlModule from 'url'
const urlPolyfill = urlModule as any
;(globalThis as any).require = (id: string) => {
  if (id === 'url') return urlPolyfill
  throw new Error(`[pet require polyfill] Unknown module: ${id}`)
}
;(globalThis as any).process = (globalThis as any).process || { env: { NODE_ENV: 'production' } }

const app = createApp(App)
app.mount('#app')
