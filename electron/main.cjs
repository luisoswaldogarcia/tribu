const { app, BrowserWindow, Notification, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')

const isDev = process.env.VITE_DEV_SERVER_URL
const dataPath = path.join(app.getPath('userData'), 'tribu-data.json')

function loadData() {
  try {
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    }
  } catch {}
  return null
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8')
}

function discoverOpencodeConfigs() {
  const configs = []
  const home = os.homedir()

  const searchPaths = [
    path.join(home, 'second-brain', 'opencode.json'),
    path.join(home, '.opencode', 'tui.json'),
  ]

  for (const p of searchPaths) {
    try {
      if (fs.existsSync(p)) {
        const content = JSON.parse(fs.readFileSync(p, 'utf-8'))
        configs.push(content)
      }
    } catch {}
  }

  const rootOpenCodeDir = path.join(home, '.config', 'opencode')
  try {
    if (fs.existsSync(rootOpenCodeDir)) {
      const entries = fs.readdirSync(rootOpenCodeDir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'node_modules') {
          const cfgPath = path.join(rootOpenCodeDir, entry.name, 'opencode.json')
          try {
            if (fs.existsSync(cfgPath)) {
              configs.push(JSON.parse(fs.readFileSync(cfgPath, 'utf-8')))
            }
          } catch {}
        }
      }
    }
  } catch {}

  return configs
}

function extractModels() {
  const models = []
  const seen = new Set()
  const configs = discoverOpencodeConfigs()

  for (const cfg of configs) {
    if (cfg.providers) {
      for (const [providerId, provider] of Object.entries(cfg.providers)) {
        if (provider.models) {
          for (const [modelId, meta] of Object.entries(provider.models)) {
            const fullId = `${providerId}/${modelId}`
            if (!seen.has(fullId)) {
              seen.add(fullId)
              models.push({ id: fullId, name: meta.name || modelId })
            }
          }
        }
      }
    }
    if (cfg.provider) {
      for (const [providerId, provider] of Object.entries(cfg.provider)) {
        if (provider.models) {
          for (const [modelId, meta] of Object.entries(provider.models)) {
            const fullId = `${providerId}/${modelId}`
            if (!seen.has(fullId)) {
              seen.add(fullId)
              models.push({ id: fullId, name: meta.name || modelId })
            }
          }
        }
      }
    }
    if (cfg.model && !seen.has(cfg.model)) {
      seen.add(cfg.model)
      models.push({ id: cfg.model, name: cfg.model.split('/').pop() || cfg.model })
    }
    if (cfg.small_model && !seen.has(cfg.small_model)) {
      seen.add(cfg.small_model)
      models.push({ id: cfg.small_model, name: cfg.small_model.split('/').pop() || cfg.small_model })
    }
  }

  return models
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

ipcMain.handle('load-board', () => {
  return loadData()
})

ipcMain.handle('save-board', (_event, data) => {
  saveData(data)
  return true
})

ipcMain.handle('get-models', () => {
  return extractModels()
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
