import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen } from 'electron'
import { join, relative } from 'path'
import { readdir, readFile, writeFile } from 'fs/promises'

// 防止 ELECTRON_RUN_AS_NODE 环境变量泄漏导致 app 以 Node 模式启动
// 参考：https://github.com/electron/electron/issues/34836
if (process.env.ELECTRON_RUN_AS_NODE) {
  delete process.env.ELECTRON_RUN_AS_NODE
}

let petWindow: BrowserWindow | null = null
let tray: Tray | null = null

const isDev = !app.isPackaged && !!process.env.VITE_DEV_SERVER_URL
const isPackaged = app.isPackaged

// 默认形象目录名（对应 models/<name>/）
const DEFAULT_MODEL = 'hiyori_pro'
// 当前选中的形象目录名，运行时可由右键菜单切换
let currentModel = DEFAULT_MODEL

function modelsRootPath(): string {
  return isPackaged
    ? join(process.resourcesPath, 'app.asar.unpacked', 'models')
    : join(__dirname, '../models')
}

// 递归查找模型设置文件：优先 .model3.json（Cubism4），其次 .model.json（Cubism2）
// 返回找到文件的绝对路径，找不到返回 null。maxDepth 防止误入深层无关目录
async function findModelFileRecursive(dir: string, maxDepth = 4): Promise<string | null> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return null
  }
  // 优先当前层
  const files = entries.filter((e) => e.isFile()).map((e) => e.name)
  const m3 = files.find((f) => f.toLowerCase().endsWith('.model3.json'))
  if (m3) return join(dir, m3)
  const m2 = files.find((f) => f.toLowerCase().endsWith('.model.json'))
  if (m2) return join(dir, m2)
  if (maxDepth <= 0) return null
  // 递归子目录（深度优先，排除常见无关目录）
  for (const e of entries) {
    if (!e.isDirectory()) continue
    const name = e.name.toLowerCase()
    if (name === 'node_modules' || name.startsWith('.')) continue
    const found = await findModelFileRecursive(join(dir, e.name), maxDepth - 1)
    if (found) return found
  }
  return null
}

// 列出 models/ 下所有含模型文件的子目录名
async function listModelDirs(): Promise<string[]> {
  const root = modelsRootPath()
  let entries
  try {
    entries = await readdir(root, { withFileTypes: true })
  } catch {
    return []
  }
  const result: string[] = []
  for (const e of entries) {
    if (!e.isDirectory()) continue
    const found = await findModelFileRecursive(join(root, e.name))
    if (found) result.push(e.name)
  }
  return result
}

// 持久化当前形象选择，下次启动时恢复
function prefsPath(): string {
  return join(app.getPath('userData'), 'model-prefs.json')
}

async function loadModelPref(): Promise<string> {
  try {
    const data = JSON.parse(await readFile(prefsPath(), 'utf-8'))
    if (typeof data.model === 'string' && data.model) return data.model
  } catch {
    // 文件不存在或解析失败，忽略
  }
  return DEFAULT_MODEL
}

async function saveModelPref(name: string): Promise<void> {
  try {
    await writeFile(prefsPath(), JSON.stringify({ model: name }), 'utf-8')
  } catch {
    // 写入失败不影响运行
  }
}

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

  // 在 models/<sub>/ 下递归自动发现模型设置文件
  // 返回相对 models 根的子路径，例如 "hiyori_pro/runtime/hiyori_pro_t11.model3.json"；找不到返回空串
  ipcMain.handle('get-model-file', async (_event, sub: string) => {
    const root = modelsRootPath()
    const absPath = await findModelFileRecursive(join(root, sub || ''))
    if (!absPath) return ''
    return relative(root, absPath).replace(/\\/g, '/')
  })

  // 列出 models/ 下所有可用形象目录名
  ipcMain.handle('list-models', async () => {
    return listModelDirs()
  })

  // 返回当前选中的形象目录名
  ipcMain.handle('get-current-model', () => {
    return currentModel
  })

  ipcMain.on('show-context-menu', async () => {
    if (!petWindow) return
    const dirs = await listModelDirs()
    const submenu =
      dirs.length > 0
        ? dirs.map((name) => ({
            label: name,
            type: 'radio' as const,
            checked: name === currentModel,
            click: () => {
              if (name === currentModel) return
              currentModel = name
              saveModelPref(name)
              petWindow?.webContents.send('switch-model', name)
            },
          }))
        : [{ label: '（未找到模型）', enabled: false }]

    const menu = Menu.buildFromTemplate([
      {
        label: '切换形象',
        submenu,
      },
      { type: 'separator' },
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

app.whenReady().then(async () => {
  // 恢复上次选中的形象（若对应模型文件仍在）
  const saved = await loadModelPref()
  const dirs = await listModelDirs()
  if (dirs.includes(saved)) {
    currentModel = saved
  } else if (dirs.length > 0) {
    currentModel = dirs[0]
  }
  registerIpc()
  createPetWindow()
  createTray()
})

app.on('window-all-closed', () => {})

app.on('before-quit', () => {
  tray?.destroy()
  tray = null
})
