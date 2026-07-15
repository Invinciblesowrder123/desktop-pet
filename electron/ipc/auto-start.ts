import { BrowserWindow } from 'electron'
import AutoLaunch from 'auto-launch'

const autoLauncher = new AutoLaunch({
  name: 'Desktop Pet',
})

export function createAutoStart(_mainWindow: BrowserWindow) {
  // Enable auto-start by default for first run
  autoLauncher.isEnabled().then((enabled: boolean) => {
    if (!enabled) {
      autoLauncher.enable().catch(() => {
        // Silently fail - user may not want this
      })
    }
  })
}
