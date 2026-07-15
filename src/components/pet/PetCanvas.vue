<template>
  <canvas ref="canvasRef" class="pet-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as PIXI from 'pixi.js'
import { Ticker } from 'pixi.js'
import { Live2DModel, InternalModel, MotionPriority } from 'pixi-live2d-display'
import { DialogEngine } from '../../engine/DialogEngine'
import { useWindowDrag } from '../../composables/useWindowDrag'
import { useClickThrough } from '../../composables/useClickThrough'

// 注册 Ticker 让 Live2D 模型能自动更新
Live2DModel.registerTicker(Ticker as any)

const canvasRef = ref<HTMLCanvasElement | null>(null)
const emit = defineEmits<{
  (e: 'chat', text: string, position: { x: number; y: number }): void
  (e: 'loaded'): void
}>()

// 默认模型目录：放在 models/hiyori_pro/ 下（Cubism4 粉发模型）
// 运行期可通过右键菜单“切换形象”更换，选择会被主进程持久化
const DEFAULT_MODEL_DIR = 'hiyori_pro'
// 当前实际加载的模型目录，由主进程偏好或右键菜单决定
let currentModelDir = DEFAULT_MODEL_DIR

let app: PIXI.Application | null = null
let model: Live2DModel<InternalModel> | null = null
const WIDTH = 500
const HEIGHT = 700
const dialogEngine = new DialogEngine()
let clickCount = 0
let lastClickTime = 0

// 尝试按一组候选动作组名播放，命中第一个存在的；idx 按候选轮转
async function tryMotion(candidates: string[], idx = 0, priority = MotionPriority.FORCE): Promise<boolean> {
  if (!model) return false
  for (const group of candidates) {
    try {
      await model.motion(group, idx, priority)
      return true
    } catch {
      // 该组不存在或越界，继续尝试下一个
    }
  }
  return false
}

function playRandomIdle() {
  // Cubism2 haru 用 'idle'，Cubism4 Hiyori 用 'Idle'
  tryMotion(['idle', 'Idle'], Math.floor(Math.random() * 3), MotionPriority.IDLE)
}

let idleInterval: ReturnType<typeof setInterval> | null = null

function showChat(text: string) {
  emit('chat', text, { x: WIDTH / 2, y: HEIGHT * 0.08 })
}

// 加载指定形象目录的模型。可在运行期多次调用以切换形象。
// 加载前会销毁当前模型（若有）。
async function loadModel(dir: string) {
  if (!app) return
  showChat(`正在加载 ${dir} ...请稍等~`)

  // 销毁旧模型
  if (model) {
    try {
      app.stage.removeChild(model as any)
      ;(model as any).destroy({ children: true, texture: true, baseTexture: true })
    } catch {
      // ignore
    }
    model = null
  }

  try {
    let modelPath: string
    if (window.electronAPI?.getModelFile) {
      const rel = await window.electronAPI.getModelFile(dir)
      if (!rel) {
        throw new Error(`在 models/${dir}/ 下未找到 .model3.json 或 .model.json`)
      }
      if (import.meta.env.DEV) {
        // 开发模式：通过 Vite 中间件以 http 提供，避免跨域拦截 file://
        modelPath = `/models/${rel}`
      } else {
        // 打包模式：页面来源 file://，直接读本地文件
        const modelsPath = await window.electronAPI.getModelsPath()
        const normalized = modelsPath.replace(/\\/g, '/').replace(/^\//, '')
        modelPath = 'file:///' + normalized + '/' + rel
      }
    } else {
      const prefix = import.meta.env.DEV ? '/models/' : './models/'
      const candidates = [
        'Hiyori.model3.json',
        'hiyori_pro_t11.model3.json',
        'hiyori.model3.json',
        'haru01.model.json',
      ]
      let found: string | null = null
      for (const c of candidates) {
        const url = `${prefix}${dir}/${c}`
        try {
          const ok = await fetch(url, { method: 'HEAD' })
          if (ok.ok) { found = url; break }
        } catch { /* ignore */ }
      }
      if (!found) throw new Error(`未在 ${prefix}${dir}/ 下找到模型文件`)
      modelPath = found
    }

    model = await Live2DModel.from(modelPath)

    model.anchor.set(0.5, 0.5)

    const margin = 20
    const im: any = (model as any).internalModel
    const modelW = Math.max(im?.width ?? im?.originalWidth ?? model.width, 1)
    const modelH = Math.max(im?.height ?? im?.originalHeight ?? model.height, 1)
    const fitScale = Math.min((WIDTH - margin * 2) / modelW, (HEIGHT - margin * 2) / modelH)
    model.scale.set(fitScale)

    model.x = WIDTH / 2
    model.y = HEIGHT / 2
    model.interactive = true
    model.cursor = 'pointer'

    app.stage.addChild(model as any)

    // 点击交互 — hit 事件由 pixi-live2d-display 触发
    // 根据点击区域触发不同动作。不同模型动作组名不同，逐一兼容：
    //   Haru(Cubism2):  flick_head / tap_body / pinch_in / pinch_out / shake
    //   Hiyori(Cubism4): FlickHead / TapBody
    model.on('hit', (hitAreas: string[]) => {
      const now = Date.now()
      if (now - lastClickTime > 2000) clickCount = 0
      clickCount++
      lastClickTime = now

      const raw = hitAreas.length > 0 ? hitAreas[0] : 'body'
      const area = raw.toLowerCase()
      const isHead = area.includes('head')

      if (isHead) {
        tryMotion(['flick_head', 'FlickHead', 'head'], 0)
        const dialogs = ['嘻嘻，别摸头啦~', '好痒呀！', '再摸就长不高了啦~', '唔...轻一点嘛']
        showChat(dialogs[Math.floor(Math.random() * dialogs.length)])
        return
      }

      // 点击身体：随机选择一组存在的互动动作
      const idx = Math.floor(Math.random() * 3)
      tryMotion(['tap_body', 'TapBody', 'pinch_in', 'shake', 'pinch_out'], idx)

      const dialog = dialogEngine.getResponse(isHead ? 'head' : 'body', clickCount, clickCount >= 5)
      showChat(dialog)
    })

    currentModelDir = dir
    emit('loaded')
  } catch (err: any) {
    console.error('[Pet] Failed to load model:', err.message || err)
    showChat('加载失败: ' + (err.message || '未知错误').substring(0, 30) + '... 请检查文件~')
  }
}

async function initPet() {
  if (!canvasRef.value) return

  app = new PIXI.Application({
    view: canvasRef.value,
    width: WIDTH,
    height: HEIGHT,
    backgroundAlpha: 0,
    antialias: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    preserveDrawingBuffer: true,
  })

  // Setup drag & click-through（仅一次）
  const { setupDrag } = useWindowDrag(canvasRef.value!)
  const { setupClickThrough } = useClickThrough(canvasRef.value!, app)
  setupDrag()
  setupClickThrough()

  // Right-click context menu（仅一次）
  canvasRef.value.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    window.electronAPI?.showContextMenu()
  })

  // 空闲时随机播放 idle 动作（仅一次，作用于当前 model）
  idleInterval = setInterval(() => {
    playRandomIdle()
  }, 8000 + Math.random() * 6000)

  // 监听右键菜单触发的形象切换
  window.electronAPI?.onSwitchModel?.((dir: string) => {
    loadModel(dir)
  })

  // 启动时加载主进程记录的当前形象（可能已从偏好恢复）
  let dir = DEFAULT_MODEL_DIR
  if (window.electronAPI?.getCurrentModel) {
    const saved = await window.electronAPI.getCurrentModel()
    if (saved) dir = saved
  }
  await loadModel(dir)
}

onMounted(() => {
  initPet()
})

defineExpose({ playRandomIdle })
</script>

<style scoped>
.pet-canvas {
  width: 100%;
  height: 100%;
  pointer-events: auto;
  cursor: pointer;
}
</style>
