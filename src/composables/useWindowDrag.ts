export function useWindowDrag(canvas: HTMLCanvasElement) {
  let isDragging = false
  let mouseDownPos = { x: 0, y: 0 }
  let mouseDownTime = 0
  const DRAG_THRESHOLD_PX = 5
  const DRAG_THRESHOLD_MS = 150

  function setupDrag() {
    canvas.addEventListener('mousedown', (e: MouseEvent) => {
      mouseDownPos = { x: e.screenX, y: e.screenY }
      mouseDownTime = Date.now()
      isDragging = false
    })

    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (Date.now() - mouseDownTime < DRAG_THRESHOLD_MS && !isDragging) {
        const dx = Math.abs(e.screenX - mouseDownPos.x)
        const dy = Math.abs(e.screenY - mouseDownPos.y)
        if (dx > DRAG_THRESHOLD_PX || dy > DRAG_THRESHOLD_PX) {
          isDragging = true
        }
      }

      if (mouseDownTime > 0 && Date.now() - mouseDownTime > DRAG_THRESHOLD_MS) {
        isDragging = true
      }

      if (isDragging && window.electronAPI) {
        window.electronAPI.moveWindow(
          e.screenX - mouseDownPos.x,
          e.screenY - mouseDownPos.y
        )
        mouseDownPos = { x: e.screenX, y: e.screenY }
      }
    })

    document.addEventListener('mouseup', () => {
      mouseDownTime = 0
      isDragging = false
    })
  }

  return { setupDrag }
}
