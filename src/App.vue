<template>
  <div class="pet-container">
    <PetCanvas ref="petCanvasRef" @chat="onChat" @loaded="onLoaded" />
    <ChatBubble
      v-if="chatState.visible"
      :text="chatState.text"
      :position="chatState.position"
      @dismissed="chatState.visible = false"
    />
    <SettingsPanel ref="settingsRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue'
import PetCanvas from './components/pet/PetCanvas.vue'
import ChatBubble from './components/pet/ChatBubble.vue'
import SettingsPanel from './components/settings/SettingsPanel.vue'
import { DialogEngine } from './engine/DialogEngine'

const petCanvasRef = ref<InstanceType<typeof PetCanvas> | null>(null)
const settingsRef = ref<InstanceType<typeof SettingsPanel> | null>(null)

const chatState = reactive({
  visible: false,
  text: '',
  position: { x: 0, y: 0 },
})

const dialogEngine = new DialogEngine()
let idleTimer: ReturnType<typeof setInterval> | null = null

function onChat(text: string, position: { x: number; y: number }) {
  chatState.text = text
  chatState.position = position
  chatState.visible = true
}

function onLoaded() {
  // 切换形象会再次触发 loaded，先清理旧计时器避免重复
  if (idleTimer) { clearInterval(idleTimer); idleTimer = null }
  idleTimer = setInterval(() => {
    const dialog = dialogEngine.getIdleDialog()
    if (dialog) {
      onChat(dialog, { x: 200, y: 60 })
    }
    petCanvasRef.value?.playRandomIdle()
  }, 18000)
}

onUnmounted(() => {
  if (idleTimer) clearInterval(idleTimer)
})
</script>

<style>
@import './styles/main.css';
.pet-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: transparent;
  pointer-events: none;
}
</style>
