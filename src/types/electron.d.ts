interface ElectronAPI {
  moveWindow: (dx: number, dy: number) => void
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => void
  getWindowPosition: () => Promise<[number, number]>
  getModelsPath: () => Promise<string>
  getExternalsPath: () => Promise<string>
  showContextMenu: () => void
  quitApp: () => void
}

interface Window {
  electronAPI: ElectronAPI
}
