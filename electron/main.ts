import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen } from 'electron'
import { join } from 'path'

// 防止 ELECTRON_RUN_AS_NODE 环境变量泄漏导致 app 以 Node 模式启动
// 参考：https://github.com/electron/electron/issues/34836
if (process.env.ELECTRON_RUN_AS_NODE) {
  delete process.env.ELECTRON_RUN_AS_NODE
}

let petWindow: BrowserWindow | null = null
let tray: Tray | null = null

const isDev = !app.isPackaged && !!process.env.VITE_DEV_SERVER_URL
const isPackaged = app.isPackaged

function createPetWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  petWindow = new BrowserWindow({
    width: 500,
    height: 720,
    x: width - 520,
    y: height - 750,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webgl: true,
      sandbox: false,
    },
  })

  petWindow.setVisibleOnAllWorkspaces(true)

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    petWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    petWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

function createTray() {
  try {
    const iconPath = isDev
      ? join(__dirname, '../resources/icon.png')
      : join(process.resourcesPath, 'icon.png')
    const trayIcon = nativeImage.createFromPath(iconPath)
    tray = new Tray(trayIcon.resize({ width: 16, height: 16 }))
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示/隐藏',
        click: () => {
          if (petWindow?.isVisible()) { petWindow.hide() } else { petWindow?.show() }
        },
      },
      { type: 'separator' },
      { label: '退出', click: () => app.quit() },
    ])
    tray.setToolTip('桌宠')
    tray.setContextMenu(contextMenu)
    tray.on('double-click', () => {
      if (petWindow?.isVisible()) { petWindow.hide() } else { petWindow?.show() }
    })
  } catch {
    // Tray creation may fail if icon is missing - that's OK
  }
}

function registerIpc() {
  ipcMain.on('move-window', (_event, { dx, dy }: { dx: number; dy: number }) => {
    if (!petWindow) return
    const [x, y] = petWindow.getPosition()
    petWindow.setPosition(x + dx, y + dy)
  })

  ipcMain.on('set-ignore-mouse-events', (_event, ignore: boolean, options?: { forward: boolean }) => {
    if (!petWindow) return
    petWindow.setIgnoreMouseEvents(ignore, options)
  })

  ipcMain.handle('get-window-position', () => {
    return petWindow?.getPosition() ?? [0, 0]
  })

  ipcMain.handle('get-models-path', () => {
    if (isPackaged) return join(process.resourcesPath, 'app.asar.unpacked', 'models')
    return join(__dirname, '../models')
  })

  ipcMain.handle('get-externals-path', () => {
    if (isPackaged) return join(process.resourcesPath, 'app.asar.unpacked', 'externals')
    return join(__dirname, '../externals')
  })

  ipcMain.on('show-context-menu', () => {
    if (!petWindow) return
    const menu = Menu.buildFromTemplate([
      {
        label: '隐藏桌宠',
        click: () => petWindow?.hide(),
      },
      {
        label: '窗口置顶',
        type: 'checkbox',
        checked: true,
        click: (mi) => {
          petWindow?.setAlwaysOnTop(mi.checked)
        },
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => app.quit(),
      },
    ])
    menu.popup({ window: petWindow })
  })

  ipcMain.on('quit-app', () => {
    app.quit()
  })
}

app.whenReady().then(() => {
  registerIpc()
  createPetWindow()
  createTray()
})

app.on('window-all-closed', () => {})

app.on('before-quit', () => {
  tray?.destroy()
  tray = null
})
