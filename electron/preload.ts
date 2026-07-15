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
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
  quitApp: () => ipcRenderer.send('quit-app'),
})
