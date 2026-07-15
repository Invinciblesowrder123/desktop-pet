import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  moveWindow: (dx: number, dy: number) => {
    ipcRenderer.send('move-window', { dx, dy })
  },
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore, options)
  },
  getWindowPosition: () => ipcRenderer.invoke('get-window-position'),
  getModelsPath: () => ipcRenderer.invoke('get-models-path'),
  getExternalsPath: () => ipcRenderer.invoke('get-externals-path'),
  getModelFile: (sub: string) => ipcRenderer.invoke('get-model-file', sub),
  listModels: () => ipcRenderer.invoke('list-models'),
  getCurrentModel: () => ipcRenderer.invoke('get-current-model'),
  onSwitchModel: (cb: (dir: string) => void) => {
    const listener = (_e: unknown, dir: string) => cb(dir)
    ipcRenderer.on('switch-model', listener)
    return () => ipcRenderer.removeListener('switch-model', listener as any)
  },
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
  quitApp: () => ipcRenderer.send('quit-app'),
})
