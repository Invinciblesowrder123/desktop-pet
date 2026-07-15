<template>
  <div
    class="chat-bubble"
    :class="{ 'chat-bubble--visible': showBubble }"
    :style="bubbleStyle"
  >
    <div class="chat-bubble__text">{{ displayedText }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps<{
  text: string
  position: { x: number; y: number }
}>()

const emit = defineEmits<{
  (e: 'dismissed'): void
}>()

const showBubble = ref(false)
const displayedText = ref('')
let typeTimer: ReturnType<typeof setInterval> | null = null
let dismissTimer: ReturnType<typeof setTimeout> | null = null

const bubbleStyle = computed(() => ({
  left: `${props.position.x}px`,
  top: `${props.position.y}px`,
}))

function startTypewriter() {
  displayedText.value = ''
  showBubble.value = true
  let i = 0
  const speed = 60

  if (typeTimer) clearInterval(typeTimer)
  typeTimer = setInterval(() => {
    if (i < props.text.length) {
      displayedText.value += props.text[i]
      i++
    } else {
      if (typeTimer) clearInterval(typeTimer)
      typeTimer = null
      dismissTimer = setTimeout(() => {
        showBubble.value = false
        setTimeout(() => emit('dismissed'), 300)
      }, 3000)
    }
  }, speed)
}

watch(() => props.text, () => {
  startTypewriter()
}, { immediate: true })

onUnmounted(() => {
  if (typeTimer) clearInterval(typeTimer)
  if (dismissTimer) clearTimeout(dismissTimer)
})
</script>

<style scoped>
.chat-bubble {
  position: absolute;
  transform: translate(-50%, -120%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 10;
}
.chat-bubble--visible {
  opacity: 1;
}
.chat-bubble__text {
  background: linear-gradient(135deg, #ffe0ec, #fff0f5);
  color: #6b4c6e;
  padding: 8px 16px;
  border-radius: 16px;
  font-size: 14px;
  max-width: 220px;
  min-height: 20px;
  word-wrap: break-word;
  box-shadow: 0 2px 12px rgba(255, 150, 180, 0.3);
  position: relative;
  white-space: pre-wrap;
}
.chat-bubble__text::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #fff0f5;
}
</style>
