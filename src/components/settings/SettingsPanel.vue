<template>
  <div class="settings-overlay" v-if="visible" @click.self="close">
    <div class="settings-panel">
      <h2 class="settings-title">设置</h2>

      <div class="settings-section">
        <label class="settings-label">宠物大小</label>
        <input type="range" min="50" max="200" v-model.number="petScale" class="slider" />
        <span class="settings-value">{{ petScale }}%</span>
      </div>

      <div class="settings-section">
        <label class="settings-label">对话频率</label>
        <select v-model="chatFrequency" class="settings-select">
          <option value="high">活跃</option>
          <option value="medium">适中</option>
          <option value="low">安静</option>
        </select>
      </div>

      <div class="settings-section">
        <label class="settings-toggle">
          <input type="checkbox" v-model="alwaysOnTop" />
          <span>窗口置顶</span>
        </label>
      </div>

      <div class="settings-section">
        <label class="settings-toggle">
          <input type="checkbox" v-model="autoStart" />
          <span>开机自启</span>
        </label>
      </div>

      <button class="settings-close-btn" @click="close">关闭</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
const petScale = ref(100)
const chatFrequency = ref('medium')
const alwaysOnTop = ref(true)
const autoStart = ref(false)

function open() { visible.value = true }
function close() { visible.value = false }

defineExpose({ open, close })
</script>

<style scoped>
.settings-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
}
.settings-panel {
  background: linear-gradient(135deg, #fff0f5, #ffe0ec);
  border-radius: 20px;
  padding: 24px 28px;
  min-width: 280px;
  box-shadow: 0 8px 32px rgba(255,150,180,0.4);
}
.settings-title {
  text-align: center;
  color: #d4687c;
  font-size: 20px;
  margin-bottom: 20px;
}
.settings-section {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.settings-label { color: #6b4c6e; font-size: 14px; min-width: 70px; }
.settings-value { color: #d4687c; font-size: 13px; }
.slider { flex: 1; accent-color: #ffb6c1; }
.settings-select {
  flex: 1; padding: 4px 8px;
  border: 1px solid #ffb6c1; border-radius: 8px;
  background: white; color: #6b4c6e; font-size: 13px;
}
.settings-toggle {
  display: flex; align-items: center; gap: 8px;
  color: #6b4c6e; font-size: 14px; cursor: pointer;
}
.settings-close-btn {
  width: 100%; padding: 10px;
  background: linear-gradient(135deg, #ffb6c1, #ff91a4);
  color: white; border: none; border-radius: 12px;
  font-size: 16px; cursor: pointer; margin-top: 12px;
}
.settings-close-btn:hover { opacity: 0.9; }
</style>
