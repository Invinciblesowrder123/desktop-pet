import { reactive } from 'vue'

interface ChatState {
  visible: boolean
  text: string
  position: { x: number; y: number }
}

const state = reactive<ChatState>({
  visible: false,
  text: '',
  position: { x: 0, y: 0 },
})

export function useChatSystem() {
  return state
}

export function showChat(text: string, position: { x: number; y: number }) {
  state.text = text
  state.position = position
  state.visible = true
}
