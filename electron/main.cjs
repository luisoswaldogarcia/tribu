const { app, BrowserWindow, Notification, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.VITE_DEV_SERVER_URL
const dataPath = path.join(app.getPath('userData'), 'tribu-data.json')

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error)
})
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason)
})

const VALID_STATUSES = ['active', 'inactive', 'busy', 'waiting_input']
const VALID_MODES = ['plan', 'executor', 'advisor']
const VALID_EXECUTORS = ['opencode', 'kiro-cli']

function sanitizeBoardData(data) {
  if (!data || typeof data !== 'object') return null
  const result = {}
  if (Array.isArray(data.columns)) result.columns = data.columns
  if (Array.isArray(data.agents)) {
    result.agents = data.agents.flatMap((agent) => {
      if (!agent || typeof agent !== 'object') return []
      if (typeof agent.id !== 'string' || typeof agent.name !== 'string') return []
      const sanitized = {
        id: agent.id,
        name: agent.name,
        avatar: typeof agent.avatar === 'string' && agent.avatar ? agent.avatar : '🤖',
        status: VALID_STATUSES.includes(agent.status) ? agent.status : 'active',
        defaultMode: VALID_MODES.includes(agent.defaultMode) ? agent.defaultMode : 'executor',
      }
      if (typeof agent.model === 'string' && agent.model) sanitized.model = agent.model
      if (VALID_EXECUTORS.includes(agent.executor)) sanitized.executor = agent.executor
      if (typeof agent.context === 'string' && agent.context) sanitized.context = agent.context
      if (typeof agent.currentTaskId === 'string' && agent.currentTaskId) sanitized.currentTaskId = agent.currentTaskId
      return [sanitized]
    })
  }
  return result
}

function loadData() {
  try {
    if (fs.existsSync(dataPath)) {
      return sanitizeBoardData(JSON.parse(fs.readFileSync(dataPath, 'utf-8')))
    }
  } catch (error) {
    console.error('No se pudo cargar el tablero:', error.message)
  }
  return null
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(sanitizeBoardData(data), null, 2), 'utf-8')
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

ipcMain.on('notify', (_event, { title, body }) => {
  new Notification({ title, body }).show()
})

ipcMain.handle('load-board', () => loadData())
ipcMain.handle('save-board', (_event, data) => {
  saveData(data)
  return true
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
