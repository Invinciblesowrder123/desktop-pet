import * as PIXI from 'pixi.js'

export function useClickThrough(canvas: HTMLCanvasElement, app: PIXI.Application) {
  let lastCheckTime = 0
  const CHECK_INTERVAL = 50

  function setupClickThrough() {
    document.addEventListener('mousemove', (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastCheckTime < CHECK_INTERVAL) return
      lastCheckTime = now

      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      if (mouseX < 0 || mouseY < 0 || mouseX > rect.width || mouseY > rect.height) {
        window.electronAPI?.setIgnoreMouseEvents(true, { forward: true })
        return
      }

      let isOverPet = false
      try {
        for (const child of app.stage.children) {
          const obj = child as PIXI.DisplayObject
          const b = obj.getBounds()
          if (b.width > 0 && b.height > 0 &&
              mouseX >= b.x && mouseX <= b.x + b.width &&
              mouseY >= b.y && mouseY <= b.y + b.height) {
            isOverPet = true
            break
          }
        }
      } catch {
        isOverPet = true
      }

      window.electronAPI?.setIgnoreMouseEvents(!isOverPet, { forward: true })
    })
  }

  return { setupClickThrough }
}