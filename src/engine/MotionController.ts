import { Live2DModel, InternalModel, MotionPriority } from 'pixi-live2d-display'

const IDLE_MOTIONS = ['idle_00', 'idle_01', 'idle_02']

export class MotionController {
  private model: Live2DModel<InternalModel>
  private idleTimer: ReturnType<typeof setInterval> | null = null
  private idleInterval = 15000

  constructor(model: Live2DModel<InternalModel>) {
    this.model = model
  }

  startIdle() {
    this.playRandomIdle()
    this.idleTimer = setInterval(() => {
      this.playRandomIdle()
    }, this.idleInterval)
  }

  stopIdle() {
    if (this.idleTimer) {
      clearInterval(this.idleTimer)
      this.idleTimer = null
    }
  }

  playRandomIdle() {
    try {
      const idx = Math.floor(Math.random() * IDLE_MOTIONS.length)
      this.model.motion('idle', idx, MotionPriority.IDLE)
    } catch {
      // idle group may not exist
    }
  }

  playTap(area: string) {
    try {
      const idx = Math.floor(Math.random() * 3)
      if (area === 'head' || area === 'Head') {
        this.model.motion('flick_head', 0, MotionPriority.FORCE)
      } else {
        this.model.motion('tap_body', idx, MotionPriority.FORCE)
      }
    } catch {
      try {
        this.model.motion('tap_body', 0, MotionPriority.FORCE)
      } catch {
        // no tap motion available
      }
    }
  }

  setIdleInterval(ms: number) {
    this.idleInterval = ms
    if (this.idleTimer) {
      this.stopIdle()
      this.startIdle()
    }
  }

  destroy() {
    this.stopIdle()
  }
}
