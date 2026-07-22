'use strict'

/**
 * Orchestrator Module — Decomposes tasks into subtasks and manages their lifecycle.
 *
 * Exports:
 *   - buildOrchestratorPrompt(task, agents)
 *   - parseOrchestratorResponse(output, availableAgents, parentTaskId)
 *   - OrchestrationEngine class
 */

/**
 * Builds the prompt sent to the orchestrator CLI agent.
 * The orchestrator should ONLY decompose and delegate — never execute directly.
 *
 * @param {object} task - The parent task to decompose
 * @param {string} task.id - Task ID
 * @param {string} task.title - Task title
 * @param {string} [task.description] - Task description
 * @param {string} [task.workingDir] - Default working directory
 * @param {object[]} agents - All available agents
 * @returns {string} The prompt string
 */
function buildOrchestratorPrompt(task, agents) {
  // Filter out orchestrator-mode agents
  const available = agents.filter((a) => a.defaultMode !== 'orchestrator')

  const agentList = available.map((a) => {
    const parts = [`- ${a.name} (id: ${a.id})`]
    if (a.context) parts.push(`  Especialidad: ${a.context}`)
    parts.push(`  Executor: ${a.executor}`)
    if (a.model) parts.push(`  Model: ${a.model}`)
    return parts.join('\n')
  }).join('\n')

  const responseFormat = JSON.stringify({
    subtasks: [{
      title: 'string — título conciso de la subtarea',
      description: 'string — descripción detallada con instrucciones claras',
      assignedAgent: 'string — nombre exacto del agente asignado',
      workingDir: 'string — directorio de trabajo para esta subtarea',
      dependsOn: ['string — títulos de otras subtareas de las que depende'],
      priority: 'alta|media|baja',
      context: 'string — contexto adicional relevante para el agente',
    }],
  }, null, 2)

  return `Eres un orquestador de tareas. Tu ÚNICO rol es descomponer la siguiente tarea en subtareas y asignarlas a los agentes disponibles. NO ejecutes nada directamente.

## Tarea a descomponer

Título: ${task.title}
${task.description ? `Descripción: ${task.description}` : ''}
${task.workingDir ? `Directorio de trabajo por defecto: ${task.workingDir}` : ''}

## Agentes disponibles

${agentList}

## Instrucciones

1. Analiza la tarea y descompónla en subtareas atómicas y ejecutables.
2. Asigna cada subtarea al agente más adecuado según su especialidad.
3. Define dependencias entre subtareas cuando el orden importa.
4. Cada subtarea debe ser independiente y clara para que el agente pueda ejecutarla sin contexto adicional.
5. Usa el directorio de trabajo del padre como default si no se especifica otro.
6. NO incluyas texto adicional fuera del JSON.

## Formato de respuesta (JSON estricto)

\`\`\`json
${responseFormat}
\`\`\`

Responde ÚNICAMENTE con el JSON en un bloque de código.`
}

/**
 * Extracts a JSON block from LLM output.
 * Tries ```json blocks first, then raw JSON objects.
 *
 * @param {string} output - Raw CLI output
 * @returns {object|null} Parsed JSON or null
 */
function extractJSON(output) {
  if (!output || typeof output !== 'string') return null

  // Try ```json ... ``` blocks first
  const fencedMatch = output.match(/```json\s*\n?([\s\S]*?)```/)
  if (fencedMatch) {
    try {
      return JSON.parse(fencedMatch[1].trim())
    } catch (_) { /* fall through */ }
  }

  // Try generic ``` ... ``` blocks
  const genericFenced = output.match(/```\s*\n?([\s\S]*?)```/)
  if (genericFenced) {
    try {
      return JSON.parse(genericFenced[1].trim())
    } catch (_) { /* fall through */ }
  }

  // Try to find a raw JSON object { ... }
  const braceStart = output.indexOf('{')
  const braceEnd = output.lastIndexOf('}')
  if (braceStart !== -1 && braceEnd > braceStart) {
    try {
      return JSON.parse(output.slice(braceStart, braceEnd + 1))
    } catch (_) { /* fall through */ }
  }

  return null
}

/**
 * Detects circular dependencies in a list of subtasks.
 *
 * @param {Map<string, string[]>} graph - title → [dependency titles]
 * @returns {boolean} true if circular dependency detected
 */
function hasCircularDeps(graph) {
  const visited = new Set()
  const recStack = new Set()

  function dfs(node) {
    if (recStack.has(node)) return true
    if (visited.has(node)) return false

    visited.add(node)
    recStack.add(node)

    const deps = graph.get(node) || []
    for (const dep of deps) {
      if (dfs(dep)) return true
    }

    recStack.delete(node)
    return false
  }

  for (const node of graph.keys()) {
    if (dfs(node)) return true
  }
  return false
}

/**
 * Parses the orchestrator CLI output and validates/resolves subtasks.
 *
 * @param {string} output - Raw output from the orchestrator CLI
 * @param {object[]} availableAgents - List of available agents (with id, name)
 * @param {string} [parentTaskId='unknown'] - Parent task ID for generating subtask IDs
 * @returns {{ success: true, subtasks: object[] } | { success: false, error: string }}
 */
function parseOrchestratorResponse(output, availableAgents, parentTaskId = 'unknown') {
  try {
    const parsed = extractJSON(output)
    if (!parsed) {
      return { success: false, error: 'No se encontró un bloque JSON válido en la respuesta del orquestador.' }
    }

    if (!parsed.subtasks || !Array.isArray(parsed.subtasks)) {
      return { success: false, error: 'La respuesta no contiene un array "subtasks".' }
    }

    if (parsed.subtasks.length === 0) {
      return { success: false, error: 'El array de subtasks está vacío.' }
    }

    // Build agent lookup (case-insensitive by name)
    const agentMap = new Map()
    for (const agent of availableAgents) {
      agentMap.set(agent.name.toLowerCase(), agent)
    }

    // Validate each subtask has required fields
    const titles = new Set()
    for (let i = 0; i < parsed.subtasks.length; i++) {
      const st = parsed.subtasks[i]
      if (!st.title || typeof st.title !== 'string') {
        return { success: false, error: `Subtask #${i + 1}: falta el campo "title".` }
      }
      if (!st.assignedAgent || typeof st.assignedAgent !== 'string') {
        return { success: false, error: `Subtask "${st.title}": falta el campo "assignedAgent".` }
      }
      if (titles.has(st.title.toLowerCase())) {
        return { success: false, error: `Subtask "${st.title}": título duplicado.` }
      }
      titles.add(st.title.toLowerCase())
    }

    // Validate assignedAgent exists
    for (const st of parsed.subtasks) {
      const key = st.assignedAgent.toLowerCase()
      if (!agentMap.has(key)) {
        const available = availableAgents.map((a) => a.name).join(', ')
        return { success: false, error: `Subtask "${st.title}": agente "${st.assignedAgent}" no encontrado. Disponibles: ${available}` }
      }
    }

    // Validate dependsOn references
    for (const st of parsed.subtasks) {
      if (st.dependsOn && Array.isArray(st.dependsOn)) {
        for (const dep of st.dependsOn) {
          if (!titles.has(dep.toLowerCase())) {
            return { success: false, error: `Subtask "${st.title}": dependencia "${dep}" no existe en el batch.` }
          }
        }
      }
    }

    // Check circular dependencies
    const depGraph = new Map()
    for (const st of parsed.subtasks) {
      const deps = (st.dependsOn || []).map((d) => d.toLowerCase())
      depGraph.set(st.title.toLowerCase(), deps)
    }
    if (hasCircularDeps(depGraph)) {
      return { success: false, error: 'Se detectaron dependencias circulares entre las subtareas.' }
    }

    // Build title→id mapping
    const titleToId = new Map()
    for (let i = 0; i < parsed.subtasks.length; i++) {
      const id = `sub_${parentTaskId}_${i}`
      titleToId.set(parsed.subtasks[i].title.toLowerCase(), id)
    }

    // Resolve subtasks
    const resolved = parsed.subtasks.map((st, i) => {
      const agent = agentMap.get(st.assignedAgent.toLowerCase())
      const depIds = (st.dependsOn || [])
        .map((d) => titleToId.get(d.toLowerCase()))
        .filter(Boolean)

      return {
        id: `sub_${parentTaskId}_${i}`,
        title: st.title,
        description: st.description || '',
        assignedAgentId: agent.id,
        workingDir: st.workingDir || '',
        dependsOn: depIds,
        priority: ['alta', 'media', 'baja'].includes(st.priority) ? st.priority : 'media',
        context: st.context || '',
      }
    })

    return { success: true, subtasks: resolved }
  } catch (err) {
    return { success: false, error: `Error parseando respuesta: ${err.message}` }
  }
}

/**
 * OrchestrationEngine — Manages the lifecycle of orchestrated subtasks.
 *
 * Tracks state per parent task, respects agent concurrency limits,
 * handles dependency resolution, and coordinates completion.
 */
class OrchestrationEngine {
  /**
   * @param {object} executionEngine - The existing ExecutionEngine instance
   * @param {object} callbacks
   * @param {function} callbacks.onSubtaskCreated - Called when a subtask is created: (parentTaskId, subtask) => void
   * @param {function} callbacks.onSubtaskFinished - Called when a subtask finishes: (parentTaskId, subtaskId) => void
   * @param {function} callbacks.onOrchestrationComplete - Called when all subtasks are done: (parentTaskId) => void
   * @param {function} callbacks.onSubtaskError - Called on subtask failure: (parentTaskId, subtaskId, error) => void
   * @param {function} callbacks.saveBoard - Called to persist board state: (boardData) => void
   */
  constructor(executionEngine, callbacks = {}) {
    if (!executionEngine) {
      throw new Error('OrchestrationEngine requires an ExecutionEngine instance')
    }

    this.executionEngine = executionEngine
    this.onSubtaskCreated = callbacks.onSubtaskCreated || (() => {})
    this.onSubtaskFinished = callbacks.onSubtaskFinished || (() => {})
    this.onOrchestrationComplete = callbacks.onOrchestrationComplete || (() => {})
    this.onSubtaskError = callbacks.onSubtaskError || (() => {})
    this.onSubtaskOutput = callbacks.onSubtaskOutput || (() => {})
    this.saveBoard = callbacks.saveBoard || (() => {})

    /**
     * Internal state tracking per parent task.
     * @type {Map<string, { subtasks: object[], pending: Set<string>, running: Set<string>, completed: Set<string>, failed: Set<string>, queue: object[] }>}
     */
    this.state = new Map()

    /** @type {Map<string, string>} agentId → currently running subtaskId */
    this.agentBusy = new Map()
  }

  /**
   * Starts orchestration: creates subtasks on the board, saves, and begins execution.
   *
   * @param {string} parentTaskId - The parent task ID
   * @param {object[]} subtasks - Resolved subtasks from parseOrchestratorResponse
   * @param {object[]} agents - All available agents
   * @param {object} boardData - Current board data (columns + agents)
   * @returns {Promise<void>}
   */
  async orchestrate(parentTaskId, subtasks, agents, boardData) {
    if (!parentTaskId || !subtasks || subtasks.length === 0) {
      throw new Error('orchestrate requires parentTaskId and non-empty subtasks array')
    }

    if (this.state.has(parentTaskId)) {
      throw new Error(`Orchestration already active for task ${parentTaskId}`)
    }

    // Initialize state
    const orchestrationState = {
      subtasks: [...subtasks],
      pending: new Set(subtasks.map((s) => s.id)),
      running: new Set(),
      completed: new Set(),
      failed: new Set(),
      queue: [],
    }
    this.state.set(parentTaskId, orchestrationState)

    // Find or create 'wip' column in board
    const wipColumn = boardData.columns.find((c) => c.id === 'wip')
    if (!wipColumn) {
      throw new Error('Board does not have a "wip" column')
    }

    // Create subtasks in the board's wip column
    for (const subtask of subtasks) {
      const boardTask = {
        id: subtask.id,
        title: subtask.title,
        description: subtask.description,
        priority: subtask.priority,
        agents: [subtask.assignedAgentId],
        workingDir: subtask.workingDir,
        parentId: parentTaskId,
        executionStatus: 'idle',
      }
      wipColumn.tasks.push(boardTask)
      this.onSubtaskCreated(parentTaskId, boardTask)
    }

    // Save board state
    await this.saveBoard(boardData)

    // Identify subtasks with no dependencies and execute them
    const ready = subtasks.filter((s) => s.dependsOn.length === 0)
    for (const subtask of ready) {
      this._tryExecute(parentTaskId, subtask, agents, boardData)
    }
  }

  /**
   * Attempts to execute a subtask, respecting 1-task-per-agent limit.
   *
   * @param {string} parentTaskId
   * @param {object} subtask
   * @param {object[]} agents
   * @param {object} boardData
   * @private
   */
  _tryExecute(parentTaskId, subtask, agents, boardData) {
    const state = this.state.get(parentTaskId)
    if (!state) return

    const agentId = subtask.assignedAgentId
    const agent = agents.find((a) => a.id === agentId)
    if (!agent) {
      this._handleFailure(parentTaskId, subtask.id, `Agent ${agentId} not found`, boardData)
      return
    }

    // Check if agent is already busy
    if (this.agentBusy.has(agentId)) {
      // Queue the subtask
      state.queue.push({ subtask, agents, boardData })
      return
    }

    // Mark agent as busy and subtask as running
    this.agentBusy.set(agentId, subtask.id)
    state.pending.delete(subtask.id)
    state.running.add(subtask.id)

    // Update board task status
    this._updateTaskStatus(boardData, subtask.id, 'running')

    // Build prompt
    let prompt = subtask.title
    if (subtask.description) prompt += `\n\n${subtask.description}`
    if (subtask.context) prompt += `\n\nContexto adicional: ${subtask.context}`

    const cwd = subtask.workingDir || process.cwd()

    try {
      const handle = this.executionEngine.execute({
        taskId: subtask.id,
        executor: agent.executor,
        prompt,
        cwd,
        model: agent.model,
        agentFile: agent.agentFile,
      })

      // Stream output to renderer via callback
      handle.onOutput((chunk) => {
        if (this.onSubtaskOutput) {
          this.onSubtaskOutput(parentTaskId, subtask.id, chunk)
        }
      })

      handle.onFinish(({ exitCode }) => {
        this.agentBusy.delete(agentId)

        if (exitCode === 0) {
          this._handleSuccess(parentTaskId, subtask.id, agents, boardData)
        } else {
          this._handleFailure(parentTaskId, subtask.id, `Exit code: ${exitCode}`, boardData)
        }

        // Process queue: find next task for this agent
        this._processQueue(parentTaskId, agentId, agents, boardData)
      })

      handle.onWaitingInput(() => {
        this.agentBusy.delete(agentId)
        this._handleFailure(parentTaskId, subtask.id, 'waiting_input', boardData)
        this._processQueue(parentTaskId, agentId, agents, boardData)
      })
    } catch (err) {
      this.agentBusy.delete(agentId)
      state.running.delete(subtask.id)
      this._handleFailure(parentTaskId, subtask.id, err.message, boardData)
    }
  }

  /**
   * Processes the queue for a specific agent after it becomes free.
   *
   * @param {string} parentTaskId
   * @param {string} agentId
   * @param {object[]} agents
   * @param {object} boardData
   * @private
   */
  _processQueue(parentTaskId, agentId, agents, boardData) {
    const state = this.state.get(parentTaskId)
    if (!state) return

    // Find next queued subtask for this agent
    const idx = state.queue.findIndex((item) => item.subtask.assignedAgentId === agentId)
    if (idx !== -1) {
      const { subtask } = state.queue.splice(idx, 1)[0]
      this._tryExecute(parentTaskId, subtask, agents, boardData)
    }
  }

  /**
   * Handles successful subtask completion.
   *
   * @param {string} parentTaskId
   * @param {string} subtaskId
   * @param {object[]} agents
   * @param {object} boardData
   * @private
   */
  _handleSuccess(parentTaskId, subtaskId, agents, boardData) {
    const state = this.state.get(parentTaskId)
    if (!state) return

    state.running.delete(subtaskId)
    state.completed.add(subtaskId)

    // Move task to done on board
    this._moveTaskToColumn(boardData, subtaskId, 'done')
    this._updateTaskStatus(boardData, subtaskId, 'done')
    this.saveBoard(boardData)

    this.onSubtaskFinished(parentTaskId, subtaskId)

    // Check what dependents are now unblocked
    const unblocked = state.subtasks.filter((s) => {
      if (state.completed.has(s.id) || state.running.has(s.id) || state.failed.has(s.id)) return false
      // Check if all dependencies are completed
      return s.dependsOn.every((depId) => state.completed.has(depId))
    })

    for (const subtask of unblocked) {
      // Remove from pending if still there
      state.pending.delete(subtask.id)
      this._tryExecute(parentTaskId, subtask, agents, boardData)
    }

    // Check if all subtasks are done
    this._checkCompletion(parentTaskId, boardData)
  }

  /**
   * Handles subtask failure.
   *
   * @param {string} parentTaskId
   * @param {string} subtaskId
   * @param {string} reason
   * @param {object} boardData
   * @private
   */
  _handleFailure(parentTaskId, subtaskId, reason, boardData) {
    const state = this.state.get(parentTaskId)
    if (!state) return

    state.running.delete(subtaskId)
    state.pending.delete(subtaskId)
    state.failed.add(subtaskId)

    // Move task to hold on board
    this._updateTaskStatus(boardData, subtaskId, 'hold')
    this._updateTaskHoldReason(boardData, subtaskId, reason)
    this.saveBoard(boardData)

    this.onSubtaskError(parentTaskId, subtaskId, reason)

    // Check if orchestration can still complete
    this._checkCompletion(parentTaskId, boardData)
  }

  /**
   * Checks if orchestration is complete (all done or stuck).
   *
   * @param {string} parentTaskId
   * @param {object} boardData
   * @private
   */
  _checkCompletion(parentTaskId, boardData) {
    const state = this.state.get(parentTaskId)
    if (!state) return

    const total = state.subtasks.length
    const finished = state.completed.size + state.failed.size
    const running = state.running.size
    const queued = state.queue.length

    // All done (no running, no queued, no pending beyond failed deps)
    if (running === 0 && queued === 0 && finished === total) {
      // All subtasks completed successfully
      if (state.failed.size === 0) {
        this._moveTaskToColumn(boardData, parentTaskId, 'done')
        this._updateTaskStatus(boardData, parentTaskId, 'done')
        this.saveBoard(boardData)
        this.onOrchestrationComplete(parentTaskId)
      }
      // Clean up state
      this.state.delete(parentTaskId)
    }
  }

  /**
   * Moves a task from its current column to a target column.
   *
   * @param {object} boardData
   * @param {string} taskId
   * @param {string} targetColumnId
   * @private
   */
  _moveTaskToColumn(boardData, taskId, targetColumnId) {
    let task = null
    // Remove from current column
    for (const col of boardData.columns) {
      const idx = col.tasks.findIndex((t) => t.id === taskId)
      if (idx !== -1) {
        task = col.tasks.splice(idx, 1)[0]
        break
      }
    }
    if (!task) return

    // Add to target column
    const targetCol = boardData.columns.find((c) => c.id === targetColumnId)
    if (targetCol) {
      targetCol.tasks.push(task)
    }
  }

  /**
   * Updates a task's executionStatus on the board.
   *
   * @param {object} boardData
   * @param {string} taskId
   * @param {string} status
   * @private
   */
  _updateTaskStatus(boardData, taskId, status) {
    for (const col of boardData.columns) {
      const task = col.tasks.find((t) => t.id === taskId)
      if (task) {
        task.executionStatus = status
        return
      }
    }
  }

  /**
   * Updates a task's holdReason on the board.
   *
   * @param {object} boardData
   * @param {string} taskId
   * @param {string} reason
   * @private
   */
  _updateTaskHoldReason(boardData, taskId, reason) {
    for (const col of boardData.columns) {
      const task = col.tasks.find((t) => t.id === taskId)
      if (task) {
        task.holdReason = reason
        return
      }
    }
  }

  /**
   * Returns the current orchestration state for a parent task.
   *
   * @param {string} parentTaskId
   * @returns {{ active: boolean, subtasks: object[], pending: string[], running: string[], completed: string[], failed: string[] } | null}
   */
  getStatus(parentTaskId) {
    const state = this.state.get(parentTaskId)
    if (!state) {
      return { active: false, subtasks: [], pending: [], running: [], completed: [], failed: [] }
    }

    return {
      active: true,
      subtasks: state.subtasks,
      pending: [...state.pending],
      running: [...state.running],
      completed: [...state.completed],
      failed: [...state.failed],
    }
  }
}

module.exports = {
  buildOrchestratorPrompt,
  parseOrchestratorResponse,
  OrchestrationEngine,
}
