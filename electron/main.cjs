const { app, BrowserWindow, Notification, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { ExecutionEngine } = require('./execution.cjs')
const { buildOrchestratorPrompt, parseOrchestratorResponse, OrchestrationEngine } = require('./orchestrator.cjs')

const isDev = process.env.VITE_DEV_SERVER_URL
const dataPath = path.join(app.getPath('userData'), 'tribu-data.json')
const engine = new ExecutionEngine()

// --- Orchestration Engine ---
const orchestrationEngine = new OrchestrationEngine(engine, {
  onSubtaskCreated: (parentTaskId, subtask) => {
    const win = getWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send('subtask-created', { parentTaskId, subtask })
    }
  },
  onSubtaskFinished: (parentTaskId, subtaskId) => {
    const win = getWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send('subtask-finished', { parentTaskId, subtaskId })
      win.webContents.send('task-finished', { taskId: subtaskId, exitCode: 0, log: engine.getLog(subtaskId) })
    }
  },
  onOrchestrationComplete: (parentTaskId) => {
    const win = getWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send('orchestration-complete', { parentTaskId })
      new Notification({ title: 'Orquestación completada', body: `Todas las sub-tareas han finalizado.` }).show()
    }
  },
  onSubtaskError: (parentTaskId, subtaskId, error) => {
    const win = getWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send('subtask-error', { parentTaskId, subtaskId, error })
      new Notification({ title: 'Sub-tarea falló', body: `Error: ${error}` }).show()
    }
  },
  onSubtaskOutput: (parentTaskId, subtaskId, chunk) => {
    const win = getWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send('task-output', { taskId: subtaskId, chunk })
    }
  },
  saveBoard: (data) => {
    saveData(data)
  },
})

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error)
})
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason)
})

const VALID_STATUSES = ['active', 'inactive', 'busy', 'waiting_input']
const VALID_MODES = ['plan', 'executor', 'advisor', 'orchestrator']
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
  if (typeof task.parentId === 'string' && task.parentId) sanitized.parentId = task.parentId
  if (typeof task.context === 'string' && task.context) sanitized.context = task.context
  if (typeof task.holdReason === 'string' && task.holdReason) sanitized.holdReason = task.holdReason
  if (typeof task.workingDir === 'string' && task.workingDir) sanitized.workingDir = task.workingDir
  if (typeof task.sessionId === 'string' && task.sessionId) sanitized.sessionId = task.sessionId
  if (typeof task.log === 'string') sanitized.log = task.log
  if (Array.isArray(task.messages)) sanitized.messages = sanitizeMessages(task.messages)
  if (typeof task.outputPreview === 'string') sanitized.outputPreview = task.outputPreview
  if (VALID_TASK_STATUSES.includes(task.executionStatus)) sanitized.executionStatus = task.executionStatus

  return sanitized
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return []
  const MAX_MESSAGES = 500
  const MAX_CONTENT_LENGTH = 50000 // 50KB per message
  const validated = messages.flatMap((msg) => {
    if (!msg || typeof msg !== 'object') return []
    if (msg.role !== 'agent' && msg.role !== 'user') return []
    if (typeof msg.content !== 'string') return []
    const content = msg.content.length > MAX_CONTENT_LENGTH
      ? msg.content.slice(-MAX_CONTENT_LENGTH)
      : msg.content
    return [{
      role: msg.role,
      content,
      timestamp: typeof msg.timestamp === 'string' ? msg.timestamp : new Date().toISOString(),
    }]
  })
  // Keep only the last MAX_MESSAGES to prevent unbounded growth
  return validated.length > MAX_MESSAGES ? validated.slice(-MAX_MESSAGES) : validated
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

    // --- ORCHESTRATOR FLOW ---
    if (agent.defaultMode === 'orchestrator') {
      return executeOrchestration(taskId, agent, task, boardData)
    }

    // --- NORMAL EXECUTION FLOW ---
    // Build prompt from task
    let prompt = task.title
    if (task.description) prompt += `\n\n${task.description}`

    // Inject agent context + task context
    if (agent.context) prompt = `[Contexto del agente]\n${agent.context}\n\n${prompt}`
    if (task.context) prompt = `[Contexto de la tarea]\n${task.context}\n\n${prompt}`

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

/**
 * Executes the orchestration flow for an orchestrator agent.
 * Spawns the orchestrator CLI to decompose the task, parses the response,
 * and delegates subtasks to specialized agents.
 */
async function executeOrchestration(taskId, orchestratorAgent, task, boardData) {
  const win = getWindow()

  // Notify UI that orchestration has started
  if (win && !win.isDestroyed()) {
    win.webContents.send('orchestration-started', { parentTaskId: taskId })
  }

  // Filter available agents (non-orchestrator, non-busy)
  const availableAgents = boardData.agents.filter(
    (a) => a.defaultMode !== 'orchestrator' && a.id !== orchestratorAgent.id
  )

  if (availableAgents.length === 0) {
    return { success: false, error: 'No hay agentes especializados disponibles para asignar sub-tareas.' }
  }

  // Build orchestrator prompt
  const prompt = buildOrchestratorPrompt(task, boardData.agents)

  // Determine working directory
  const cwd = task.workingDir || process.cwd()
  if (!fs.existsSync(cwd)) {
    return { success: false, error: `Working directory does not exist: ${cwd}` }
  }

  // Execute orchestrator CLI
  const handle = engine.execute({
    taskId: `orch_${taskId}`,
    executor: orchestratorAgent.executor,
    prompt,
    cwd,
    model: orchestratorAgent.model,
    agentFile: orchestratorAgent.agentFile,
  })

  // Stream orchestrator output to renderer
  handle.onOutput((chunk) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('task-output', { taskId, chunk })
    }
  })

  // Handle orchestrator finish
  handle.onFinish(async ({ exitCode, log }) => {
    if (exitCode !== 0) {
      if (win && !win.isDestroyed()) {
        win.webContents.send('task-finished', { taskId, exitCode, log })
        new Notification({ title: 'Orquestación falló', body: `El orquestador terminó con código ${exitCode}` }).show()
      }
      return
    }

    // Parse orchestrator response
    const result = parseOrchestratorResponse(log, availableAgents, taskId)

    if (!result.success) {
      if (win && !win.isDestroyed()) {
        win.webContents.send('task-finished', {
          taskId,
          exitCode: 1,
          log: `${log}\n\n[ERROR] No se pudieron parsear las sub-tareas: ${result.error}`,
        })
      }
      return
    }

    // Reload fresh board data for orchestration
    const freshBoardData = loadData()
    if (!freshBoardData) {
      if (win && !win.isDestroyed()) {
        win.webContents.send('task-finished', { taskId, exitCode: 1, log: `${log}\n\n[ERROR] No se pudo cargar el tablero.` })
      }
      return
    }

    // Start orchestration (create subtasks, schedule execution)
    try {
      await orchestrationEngine.orchestrate(taskId, result.subtasks, freshBoardData.agents, freshBoardData)
    } catch (orchErr) {
      if (win && !win.isDestroyed()) {
        win.webContents.send('task-finished', { taskId, exitCode: 1, log: `${log}\n\n[ERROR] Orquestación falló: ${orchErr.message}` })
      }
    }
  })

  return { success: true }
}

// --- IPC: Orchestration status ---
ipcMain.handle('get-orchestration-status', async (_event, parentTaskId) => {
  return orchestrationEngine.getStatus(parentTaskId)
})

ipcMain.handle('cancel-task', async (_event, taskId) => {
  return engine._cancel(taskId)
})

// --- IPC: Send input to running task ---
ipcMain.handle('send-task-input', async (_event, taskId, text) => {
  if (typeof taskId !== 'string' || typeof text !== 'string') {
    return { success: false, error: 'Invalid parameters' }
  }

  const result = engine.sendInput(taskId, text)

  if (!result.success && result.fallback) {
    // Fallback: restart session with the user's input as new prompt
    try {
      const boardData = loadData()
      if (!boardData) return { success: false, error: 'No board data' }

      // Find the task and its agent
      let task = null
      for (const col of boardData.columns) {
        task = col.tasks.find((t) => t.id === taskId)
        if (task) break
      }
      if (!task) return { success: false, error: 'Task not found' }

      const agentId = task.agents[0]
      const agent = agentId ? boardData.agents.find((a) => a.id === agentId) : null
      if (!agent) return { success: false, error: 'Agent not found' }

      const cwd = task.workingDir || process.cwd()
      const prompt = text

      const handle = engine.execute({
        taskId,
        executor: agent.executor,
        prompt,
        cwd,
        model: agent.model,
        agentFile: agent.agentFile,
        sessionId: task.sessionId,
      })

      handle.onOutput((chunk) => {
        const win = getWindow()
        if (win && !win.isDestroyed()) {
          win.webContents.send('task-output', { taskId, chunk })
        }
      })

      handle.onWaitingInput(() => {
        const win = getWindow()
        if (win && !win.isDestroyed()) {
          win.webContents.send('task-waiting-input', { taskId })
        }
      })

      handle.onFinish(({ exitCode, sessionId, log }) => {
        const win = getWindow()
        if (win && !win.isDestroyed()) {
          win.webContents.send('task-finished', { taskId, exitCode, sessionId, log })
        }
      })

      return { success: true, fallback: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  return result
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
