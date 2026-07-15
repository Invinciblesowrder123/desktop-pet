import { PetEngine } from './usePetEngine'
import { DialogEngine } from '../engine/DialogEngine'

const dialogEngine = new DialogEngine()

export function usePetInteraction(
  engine: PetEngine,
  onChat: (text: string, position: { x: number; y: number }) => void
) {
  let clickCount = 0
  let lastClickTime = 0
  const CLICK_RESET_MS = 2000
  const RAPID_CLICK_THRESHOLD = 5

  function setupInteraction() {
    const { model, width, height } = engine

    model.on('hit', (hitAreas: string[]) => {
      const now = Date.now()

      // Reset click count if too long between clicks
      if (now - lastClickTime > CLICK_RESET_MS) {
        clickCount = 0
      }
      clickCount++
      lastClickTime = now

      // Determine hit area
      const area = hitAreas.length > 0 ? hitAreas[0] : 'body'

      // Try to play a tap motion
      let motionPlayed = false
      try {
        const motionGroup = getMotionForArea(area, clickCount)
        model.motion(motionGroup)
        motionPlayed = true
      } catch {
        // Motion group doesn't exist for this model, try generic tap
        try {
          model.motion('tap_body')
          motionPlayed = true
        } catch {
          // No tap motion available at all
        }
      }

      // Get dialog response
      const dialog = dialogEngine.getResponse(
        area,
        clickCount,
        clickCount >= RAPID_CLICK_THRESHOLD
      )

      // Show chat bubble above the pet's head
      const bubbleX = width / 2
      const bubbleY = height * 0.15
      onChat(dialog, { x: bubbleX, y: bubbleY })
    })
  }

  function getMotionForArea(area: string, count: number): string {
    if (count >= RAPID_CLICK_THRESHOLD) {
      return 'flick_head' // rapid click reaction
    }

    const motionMap: Record<string, string> = {
      Head: 'tap_head',
      Body: 'tap_body',
      Arm: 'tap_arm',
      head: 'tap_head',
      body: 'tap_body',
      arm: 'tap_arm',
    }

    return motionMap[area] || 'tap_body'
  }

  return { setupInteraction, dialogEngine }
}
