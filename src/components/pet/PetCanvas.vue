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

let app: PIXI.Application | null = null
let model: Live2DModel<InternalModel> | null = null
const WIDTH = 500
const HEIGHT = 700
const dialogEngine = new DialogEngine()
let clickCount = 0
let lastClickTime = 0

const idleMotions = ['idle_00', 'idle_01', 'idle_02']

function playRandomIdle() {
  if (!model) return
  try {
    const idx = Math.floor(Math.random() * idleMotions.length)
    model.motion('idle', idx, MotionPriority.IDLE)
  } catch {
    // idle motion group may not exist
  }
}

let idleInterval: ReturnType<typeof setInterval> | null = null

function showChat(text: string) {
  emit('chat', text, { x: WIDTH / 2, y: HEIGHT * 0.08 })
}

async function initPet() {
  if (!canvasRef.value) return

  showChat('正在加载模型...请稍等~')

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

  try {
    let modelPath: string
    if (window.electronAPI?.getModelsPath) {
      const modelsPath = await window.electronAPI.getModelsPath()
      const normalized = modelsPath.replace(/\\/g, '/').replace(/^\//, '')
      modelPath = 'file:///' + normalized + '/haru/haru01.model.json'
    } else {
      modelPath = import.meta.env.DEV
        ? '/models/haru/haru01.model.json'
        : './models/haru/haru01.model.json'
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
    model.on('hit', (hitAreas: string[]) => {
      const now = Date.now()
      if (now - lastClickTime > 2000) clickCount = 0
      clickCount++
      lastClickTime = now

      const area = hitAreas.length > 0 ? hitAreas[0] : 'body'

      // 根据点击区域触发不同动作
      try {
        if (area === 'head') {
          // 摸头 -> 甩头动作
          model!.motion('flick_head', 0, MotionPriority.FORCE)
          const dialogs = ['嘻嘻，别摸头啦~', '好痒呀！', '再摸就长不高了啦~', '唔...轻一点嘛']
          showChat(dialogs[Math.floor(Math.random() * dialogs.length)])
          return
        }
        // 点击身体 -> 随机互动动作
        const bodyMotions = ['tap_body', 'pinch_in', 'pinch_out', 'shake']
        const motion = bodyMotions[Math.floor(Math.random() * bodyMotions.length)]
        const idx = motion === 'tap_body' ? Math.floor(Math.random() * 3) : 0
        model!.motion(motion, idx, MotionPriority.FORCE)
      } catch {
        // fallback
      }

      const dialog = dialogEngine.getResponse(area, clickCount, clickCount >= 5)
      showChat(dialog)
    })

    emit('loaded')

    // Setup drag & click-through
    const { setupDrag } = useWindowDrag(canvasRef.value!)
    const { setupClickThrough } = useClickThrough(canvasRef.value!, app)
    setupDrag()
    setupClickThrough()

    // Right-click context menu
    canvasRef.value!.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      window.electronAPI?.showContextMenu()
    })

    // 空闲时随机播放 idle 动作
    idleInterval = setInterval(() => {
      playRandomIdle()
    }, 8000 + Math.random() * 6000)

  } catch (err: any) {
    console.error('[Pet] Failed to load model:', err.message || err)
    showChat('加载失败: ' + (err.message || '未知错误').substring(0, 30) + '... 请检查文件~')
  }
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
