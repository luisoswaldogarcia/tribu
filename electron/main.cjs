const { app, BrowserWindow, Notification, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { spawn, execSync } = require('child_process')

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
  const opencodeModels = []
  const kiroModels = []
  const opencodeSeen = new Set()
  const kiroSeen = new Set()
  const configs = discoverOpencodeConfigs()

  for (const cfg of configs) {
    const providers = cfg.providers || cfg.provider || {}
    for (const [providerId, provider] of Object.entries(providers)) {
      if (provider.models) {
        for (const [modelId, meta] of Object.entries(provider.models)) {
          const fullId = `${providerId}/${modelId}`
          if (!opencodeSeen.has(fullId)) {
            opencodeSeen.add(fullId)
            opencodeModels.push({ id: fullId, name: meta.name || modelId })
          }
        }
      }
    }
    if (cfg.model && !opencodeSeen.has(cfg.model)) {
      opencodeSeen.add(cfg.model)
      opencodeModels.push({ id: cfg.model, name: cfg.model.split('/').pop() || cfg.model })
    }
    if (cfg.small_model && !opencodeSeen.has(cfg.small_model)) {
      opencodeSeen.add(cfg.small_model)
      opencodeModels.push({ id: cfg.small_model, name: cfg.small_model.split('/').pop() || cfg.small_model })
    }
  }

  try {
    const output = execSync('opencode models 2>/dev/null', { timeout: 10000, encoding: 'utf-8' })
    for (const line of output.trim().split('\n')) {
      const id = line.trim()
      if (id && !opencodeSeen.has(id)) {
        opencodeSeen.add(id)
        const name = id.includes('/') ? id.split('/').pop() : id
        opencodeModels.push({ id, name: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ') })
      }
    }
  } catch {}

  const kiroStatePath = path.join(os.homedir(), 'kiro-gateway', 'state.json')
  try {
    if (fs.existsSync(kiroStatePath)) {
      const state = JSON.parse(fs.readFileSync(kiroStatePath, 'utf-8'))
      const accounts = state.model_to_accounts || {}
      for (const modelId of Object.keys(accounts)) {
        if (modelId !== 'auto-kiro' && !kiroSeen.has(modelId)) {
          kiroSeen.add(modelId)
          const name = modelId.charAt(0).toUpperCase() + modelId.slice(1).replace(/-/g, ' ')
          kiroModels.push({ id: modelId, name })
        }
      }
    }
  } catch {}

  const hardcodedKiroModels = [
    'auto', 'claude-sonnet-5', 'claude-opus-4.8', 'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna',
    'claude-opus-4.7', 'claude-opus-4.6', 'claude-opus-4.5', 'claude-sonnet-4.6', 'claude-sonnet-4.5',
    'claude-sonnet-4', 'claude-haiku-4.5', 'deepseek-3.2', 'glm-5', 'minimax-m2.1', 'minimax-m2.5',
    'qwen3-coder-next',
  ]
  for (const id of hardcodedKiroModels) {
    if (!kiroSeen.has(id)) {
      kiroSeen.add(id)
      const name = id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      kiroModels.push({ id, name })
    }
  }

  return { opencode: opencodeModels, kiro: kiroModels }
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
  const result = extractModels()
  return result
})

ipcMain.handle('execute-task', async (_event, { agentName, model, context, taskTitle, taskDescription, executor }) => {
  const home = os.homedir()
  const prompt = `Eres ${agentName}. Tu contexto: ${context}\n\nTarea: ${taskTitle}\n${taskDescription ? 'Descripción: ' + taskDescription : ''}\n\nResuelve esta tarea.'

  return new Promise((resolve) => {
    let cmd, args

    if (executor === 'kiro-cli') {
      cmd = 'kiro'
      args = ['ask', '--model', model, prompt]
    } else {
      cmd = 'opencode'
      args = ['--model', model, prompt]
    }

    const child = spawn(cmd, args, {
      cwd: home,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env, HOME: home },
    })

    let output = ''
    let error = ''

    child.stdout.on('data', (data) => {
      output += data.toString()
    })

    child.stderr.on('data', (data) => {
      error += data.toString()
    })

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output: output.trim(),
        error: error.trim(),
      })
    })

    child.on('error', (err) => {
      resolve({
        success: false,
        error: err.message,
      })
    })
  })
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
