interface ElectronAPI {
  moveWindow: (dx: number, dy: number) => void
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => void
  getWindowPosition: () => Promise<[number, number]>
  getModelsPath: () => Promise<string>
  getExternalsPath: () => Promise<string>
  getModelFile: (sub: string) => Promise<string>
  listModels: () => Promise<string[]>
  getCurrentModel: () => Promise<string>
  onSwitchModel: (cb: (dir: string) => void) => () => void
  showContextMenu: () => void
  quitApp: () => void
}

interface Window {
  electronAPI: ElectronAPI
}
