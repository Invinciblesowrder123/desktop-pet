import { DialogEngine } from './DialogEngine'
import { MoodSystem } from './MoodSystem'

interface IdleCallbacks {
  onChat: (text: string) => void
  onMotion: (motion: string) => void
}

export class IdleBehavior {
  private dialogEngine: DialogEngine
  private moodSystem: MoodSystem
  private callbacks: IdleCallbacks
  private chatTimer: ReturnType<typeof setInterval> | null = null
  private moodTimer: ReturnType<typeof setInterval> | null = null
  private chatInterval = 30000

  constructor(dialogEngine: DialogEngine, moodSystem: MoodSystem, callbacks: IdleCallbacks) {
    this.dialogEngine = dialogEngine
    this.moodSystem = moodSystem
    this.callbacks = callbacks
  }

  start() {
    this.chatTimer = setInterval(() => {
      const dialog = this.dialogEngine.getIdleDialog()
      if (dialog) {
        this.callbacks.onChat(dialog)
      }
    }, this.chatInterval)

    this.moodTimer = setInterval(() => {
      this.moodSystem.tick()
    }, 10000)
  }

  stop() {
    if (this.chatTimer) clearInterval(this.chatTimer)
    if (this.moodTimer) clearInterval(this.moodTimer)
  }

  setChatInterval(ms: number) {
    this.chatInterval = ms
    if (this.chatTimer) {
      this.stop()
      this.start()
    }
  }
}
