const { app, BrowserWindow, Notification, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { ExecutionEngine } = require('./execution.cjs')

const isDev = process.env.VITE_DEV_SERVER_URL
const dataPath = path.join(app.getPath('userData'), 'tribu-data.json')
const engine = new ExecutionEngine()

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error)
})
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason)
})

const VALID_STATUSES = ['active', 'inactive', 'busy', 'waiting_input']
const VALID_MODES = ['plan', 'executor', 'advisor']
const VALID_EXECUTORS = ['opencode', 'kiro-cli']
const VALID_TASK_STATUSES = ['idle', 'running', 'done', 'error', 'hold']

function sanitizeTask(task) {
  if (!task || typeof task !== 'object') return null
  if (typeof task.id !== 'string' || typeof task.title !== 'string') return null

  const sanitized = {
    id: task.id,
    title: task.title,
    priority: ['alta', 'media', 'baja'].includes(task.priority) ? task.priority : 'media',
    agents: Array.isArray(task.agents) ? task.agents.filter((a) => typeof a === 'string') : [],
  }

  if (typeof task.description === 'string' && task.description) sanitized.description = task.description
  if (typeof task.holdReason === 'string' && task.holdReason) sanitized.holdReason = task.holdReason
  if (typeof task.workingDir === 'string' && task.workingDir) sanitized.workingDir = task.workingDir
  if (typeof task.sessionId === 'string' && task.sessionId) sanitized.sessionId = task.sessionId
  if (typeof task.log === 'string') sanitized.log = task.log
  if (typeof task.outputPreview === 'string') sanitized.outputPreview = task.outputPreview
  if (VALID_TASK_STATUSES.includes(task.executionStatus)) sanitized.executionStatus = task.executionStatus

  return sanitized
}

function sanitizeBoardData(data) {
  if (!data || typeof data !== 'object') return null
  const result = {}
  if (Array.isArray(data.columns)) {
    result.columns = data.columns.map((col) => {
      if (!col || typeof col !== 'object') return { id: 'unknown', title: 'Unknown', tasks: [], color: '#ccc' }
      return {
        id: col.id || 'unknown',
        title: col.title || 'Unknown',
        tasks: Array.isArray(col.tasks) ? col.tasks.map(sanitizeTask).filter(Boolean) : [],
        color: col.color || '#ccc',
      }
    })
  }
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
        executor: VALID_EXECUTORS.includes(agent.executor) ? agent.executor : 'opencode',
      }
      if (typeof agent.model === 'string' && agent.model) sanitized.model = agent.model
      if (typeof agent.context === 'string' && agent.context) sanitized.context = agent.context
      if (typeof agent.currentTaskId === 'string' && agent.currentTaskId) sanitized.currentTaskId = agent.currentTaskId
      if (typeof agent.agentFile === 'string' && agent.agentFile) sanitized.agentFile = agent.agentFile
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

let mainWindow = null

function getWindow() {
  return mainWindow
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// --- IPC: Board persistence ---
ipcMain.on('notify', (_event, { title, body }) => {
  new Notification({ title, body }).show()
})

ipcMain.handle('load-board', () => loadData())
ipcMain.handle('save-board', (_event, data) => {
  saveData(data)
  return true
})

// --- IPC: Directory selection ---
ipcMain.handle('select-directory', async () => {
  const win = getWindow()
  if (!win) return null
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

// --- IPC: Task execution ---
ipcMain.handle('execute-task', async (_event, taskId, agentId) => {
  try {
    // Load current board to get task and agent data
    const boardData = loadData()
    if (!boardData) return { success: false, error: 'No board data found' }

    // Find agent
    const agent = boardData.agents.find((a) => a.id === agentId)
    if (!agent) return { success: false, error: `Agent ${agentId} not found` }

    // Check if agent is already busy
    if (agent.status === 'busy') return { success: false, error: `Agent ${agent.name} is already busy` }

    // Find task across all columns
    let task = null
    for (const col of boardData.columns) {
      task = col.tasks.find((t) => t.id === taskId)
      if (task) break
    }
    if (!task) return { success: false, error: `Task ${taskId} not found` }

    // Check if task is already running
    if (engine.isRunning(taskId)) return { success: false, error: 'Task is already running' }

    // Build prompt from task
    let prompt = task.title
    if (task.description) prompt += `\n\n${task.description}`

    // If there's accumulated context from previous runs, include it
    if (task.log) {
      prompt += `\n\n--- Previous execution context ---\n${task.log.slice(-2000)}`
    }

    // Determine working directory
    const cwd = task.workingDir || process.cwd()

    // Verify working directory exists
    if (!fs.existsSync(cwd)) {
      return { success: false, error: `Working directory does not exist: ${cwd}` }
    }

    // Execute
    const handle = engine.execute({
      taskId,
      executor: agent.executor,
      prompt,
      cwd,
      model: agent.model,
      agentFile: agent.agentFile,
      sessionId: task.sessionId,
    })

    // Stream output to renderer
    handle.onOutput((chunk) => {
      const win = getWindow()
      if (win && !win.isDestroyed()) {
        win.webContents.send('task-output', { taskId, chunk })
      }
    })

    // Handle waiting for input (inactivity timeout)
    handle.onWaitingInput(() => {
      const win = getWindow()
      if (win && !win.isDestroyed()) {
        win.webContents.send('task-waiting-input', { taskId })
      }
    })

    // Handle finish
    handle.onFinish(({ exitCode, sessionId, log }) => {
      const win = getWindow()
      if (win && !win.isDestroyed()) {
        win.webContents.send('task-finished', { taskId, exitCode, sessionId, log })
      }
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('cancel-task', async (_event, taskId) => {
  return engine._cancel(taskId)
})

// --- IPC: Models ---
ipcMain.handle('get-models', async (_event, executor) => {
  if (!VALID_EXECUTORS.includes(executor)) return ['auto']
  return engine.getModels(executor)
})

// --- IPC: Agent file generation ---
ipcMain.handle('generate-agent-file', async (_event, executor, description, mode, tools) => {
  if (!VALID_EXECUTORS.includes(executor)) {
    return { success: false, error: `Invalid executor: ${executor}` }
  }
  if (!description || typeof description !== 'string') {
    return { success: false, error: 'Description is required' }
  }
  return engine.generateAgentFile(executor, description, mode || 'all', tools || '')
})

// --- App lifecycle ---
app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
