const { spawn } = require('child_process')

/**
 * ExecutionEngine — Spawns CLI processes (opencode / kiro-cli) for task execution.
 *
 * Usage:
 *   const engine = new ExecutionEngine()
 *   const handle = engine.execute({ taskId, executor, prompt, cwd, model, agentFile, sessionId })
 *   handle.onOutput((chunk) => ...)
 *   handle.onFinish(({ exitCode, sessionId, log }) => ...)
 *   handle.cancel()
 */

class ExecutionEngine {
  constructor() {
    /** @type {Map<string, import('child_process').ChildProcess>} taskId → process */
    this.activeProcesses = new Map()
    /** @type {Map<string, string>} taskId → accumulated log */
    this.logs = new Map()
  }

  /**
   * @param {object} opts
   * @param {string} opts.taskId
   * @param {'opencode' | 'kiro-cli'} opts.executor
   * @param {string} opts.prompt
   * @param {string} opts.cwd - Working directory
   * @param {string} [opts.model]
   * @param {string} [opts.agentFile] - Agent name or path
   * @param {string} [opts.sessionId] - Resume previous session
   * @param {number} [opts.inactivityTimeout] - Ms without output before triggering waiting_input (default: 300000 = 5min)
   * @returns {{ onOutput: (cb: (chunk: string) => void) => void, onFinish: (cb: (result: {exitCode: number, sessionId?: string, log: string}) => void) => void, onWaitingInput: (cb: () => void) => void, cancel: () => void }}
   */
  execute(opts) {
    const { taskId, executor, prompt, cwd, model, agentFile, sessionId, inactivityTimeout = 300000 } = opts

    if (this.activeProcesses.has(taskId)) {
      throw new Error(`Task ${taskId} is already running`)
    }

    const { command, args } = this._buildCommand({ executor, prompt, model, agentFile, sessionId })

    const outputCallbacks = []
    const finishCallbacks = []
    const waitingInputCallbacks = []
    let log = ''
    let waitingInputTriggered = false
    let inactivityTimer = null

    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      if (waitingInputTriggered) return
      inactivityTimer = setTimeout(() => {
        if (!waitingInputTriggered && this.activeProcesses.has(taskId)) {
          waitingInputTriggered = true
          for (const cb of waitingInputCallbacks) cb()
        }
      }, inactivityTimeout)
    }

    const proc = spawn(command, args, {
      cwd,
      env: { ...process.env },
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    this.activeProcesses.set(taskId, proc)
    this.logs.set(taskId, '')

    // Start inactivity timer
    resetInactivityTimer()

    const handleData = (chunk) => {
      const text = chunk.toString()
      log += text
      this.logs.set(taskId, log)
      resetInactivityTimer()
      for (const cb of outputCallbacks) cb(text)
    }

    if (proc.stdout) proc.stdout.on('data', handleData)
    if (proc.stderr) proc.stderr.on('data', handleData)

    proc.on('close', (code) => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      this.activeProcesses.delete(taskId)
      const exitCode = code ?? 1
      const extractedSessionId = this._extractSessionId(log, executor) || sessionId
      for (const cb of finishCallbacks) {
        cb({ exitCode, sessionId: extractedSessionId, log })
      }
    })

    proc.on('error', (err) => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      this.activeProcesses.delete(taskId)
      log += `\n[ERROR] ${err.message}\n`
      for (const cb of finishCallbacks) {
        cb({ exitCode: 1, sessionId, log })
      }
    })

    return {
      onOutput: (cb) => outputCallbacks.push(cb),
      onFinish: (cb) => finishCallbacks.push(cb),
      onWaitingInput: (cb) => waitingInputCallbacks.push(cb),
      cancel: () => this._cancel(taskId),
    }
  }

  /**
   * Build the CLI command and arguments based on executor type.
   */
  _buildCommand({ executor, prompt, model, agentFile, sessionId }) {
    if (executor === 'opencode') {
      return this._buildOpenCodeCommand({ prompt, model, agentFile, sessionId })
    }
    return this._buildKiroCommand({ prompt, model, agentFile, sessionId })
  }

  _buildOpenCodeCommand({ prompt, model, agentFile, sessionId }) {
    const args = ['run', '--auto']

    if (sessionId) {
      args.push('--session', sessionId)
    }
    if (model && model !== 'auto') {
      args.push('--model', model)
    }
    if (agentFile) {
      args.push('--agent', agentFile)
    }
    args.push(prompt)

    return { command: 'opencode', args }
  }

  _buildKiroCommand({ prompt, model, agentFile, sessionId }) {
    const args = ['chat', '--no-interactive', '--trust-all-tools']

    if (sessionId) {
      args.push('--resume-id', sessionId)
    }
    if (model && model !== 'auto') {
      args.push('--model', model)
    }
    if (agentFile) {
      args.push('--agent', agentFile)
    }
    args.push(prompt)

    return { command: 'kiro-cli', args }
  }

  /**
   * Try to extract a session ID from the CLI output.
   * OpenCode outputs session IDs like ses_... in its output.
   * Kiro CLI uses UUIDs.
   */
  _extractSessionId(log, executor) {
    if (executor === 'opencode') {
      // OpenCode session IDs: ses_xxxxx
      const match = log.match(/ses_[a-zA-Z0-9]+/)
      return match ? match[0] : null
    }
    // Kiro CLI: UUID format
    const match = log.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
    return match ? match[0] : null
  }

  /**
   * Cancel a running task.
   */
  _cancel(taskId) {
    const proc = this.activeProcesses.get(taskId)
    if (!proc) return false
    proc.kill('SIGTERM')
    // Force kill after 5 seconds if still running
    setTimeout(() => {
      if (this.activeProcesses.has(taskId)) {
        proc.kill('SIGKILL')
        this.activeProcesses.delete(taskId)
      }
    }, 5000)
    return true
  }

  /**
   * Send input to a running task's stdin.
   * @param {string} taskId
   * @param {string} text
   * @returns {{ success: boolean, fallback?: boolean, error?: string }}
   */
  sendInput(taskId, text) {
    const proc = this.activeProcesses.get(taskId)
    if (!proc) {
      return { success: false, fallback: true, error: 'Process not found' }
    }
    if (!proc.stdin || !proc.stdin.writable) {
      return { success: false, fallback: true, error: 'stdin not writable' }
    }
    try {
      proc.stdin.write(text + '\n')
      return { success: true }
    } catch (err) {
      return { success: false, fallback: true, error: err.message }
    }
  }

  /**
   * Check if a task is currently running.
   */
  isRunning(taskId) {
    return this.activeProcesses.has(taskId)
  }

  /**
   * Check if an agent has any running task.
   */
  hasActiveProcess(taskId) {
    return this.activeProcesses.has(taskId)
  }

  /**
   * Get the partial log for a task.
   */
  getLog(taskId) {
    return this.logs.get(taskId) || ''
  }

  /**
   * Get models from the CLI.
   * @param {'opencode' | 'kiro-cli'} executor
   * @returns {Promise<string[]>}
   */
  getModels(executor) {
    return new Promise((resolve) => {
      const command = executor === 'opencode' ? 'opencode' : 'kiro-cli'
      const args = executor === 'opencode' ? ['models'] : ['chat', '--list-models']

      const proc = spawn(command, args, {
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      let output = ''
      if (proc.stdout) proc.stdout.on('data', (chunk) => { output += chunk.toString() })

      proc.on('close', (code) => {
        if (code !== 0) {
          resolve(['auto'])
          return
        }
        const models = this._parseModels(output, executor)
        resolve(['auto', ...models])
      })

      proc.on('error', () => {
        resolve(['auto'])
      })

      // Timeout after 10 seconds
      setTimeout(() => {
        proc.kill()
        resolve(['auto'])
      }, 10000)
    })
  }

  /**
   * Parse model list from CLI output.
   */
  _parseModels(output, _executor) {
    // Both CLIs output model names one per line or in a table format
    // Extract anything that looks like a model identifier
    const lines = output.split('\n').map((l) => l.trim()).filter(Boolean)
    const models = []
    for (const line of lines) {
      // Skip header/decoration lines
      if (line.startsWith('─') || line.startsWith('=') || line.startsWith('#')) continue
      // Extract model id (first token that looks like provider/model or just a model name)
      const match = line.match(/([a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+|[a-zA-Z0-9]+-[a-zA-Z0-9._-]+)/)
      if (match) models.push(match[1])
    }
    return [...new Set(models)]
  }

  /**
   * Generate an agent file via CLI.
   * 
   * For opencode: `opencode agent create --description "..." --mode ... --tools ...`
   * For kiro-cli: Uses non-interactive chat to generate the agent file since
   *   `kiro-cli agent create` from terminal doesn't support --description.
   *   Instead we ask the AI to create the agent configuration.
   * 
   * @param {'opencode' | 'kiro-cli'} executor
   * @param {string} description
   * @param {string} mode - 'plan' | 'executor' | 'advisor' → mapped to CLI modes
   * @param {string} [tools]
   * @returns {Promise<{success: boolean, path?: string, error?: string}>}
   */
  generateAgentFile(executor, description, mode, tools) {
    return new Promise((resolve) => {
      let command, args

      if (executor === 'opencode') {
        const cliMode = mode === 'advisor' ? 'subagent' : mode === 'plan' ? 'primary' : 'all'
        command = 'opencode'
        args = ['agent', 'create', '--description', description, '--mode', cliMode]
        if (tools) args.push('--tools', tools)
      } else {
        // kiro-cli: agent create only takes NAME and --directory from CLI.
        // We use non-interactive chat to generate the agent instead.
        const agentName = description.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)
        const prompt = `Create a custom agent named "${agentName}" with this description: "${description}". Save it globally. The agent should be a ${mode} agent.`
        command = 'kiro-cli'
        args = ['chat', '--no-interactive', '--trust-all-tools', prompt]
      }

      const proc = spawn(command, args, {
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      let output = ''
      let errorOutput = ''
      if (proc.stdout) proc.stdout.on('data', (chunk) => { output += chunk.toString() })
      if (proc.stderr) proc.stderr.on('data', (chunk) => { errorOutput += chunk.toString() })

      proc.on('close', (code) => {
        if (code !== 0) {
          resolve({ success: false, error: errorOutput || output || `Exit code ${code}` })
          return
        }
        // Try to extract the created file path from output
        const pathMatch = output.match(/([^\s]+\.(?:md|json))/)
        if (executor === 'kiro-cli') {
          // For kiro, the agent is likely at ~/.kiro/agents/<name>.json
          const agentName = description.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)
          resolve({ success: true, path: pathMatch ? pathMatch[1] : agentName })
        } else {
          resolve({ success: true, path: pathMatch ? pathMatch[1] : undefined })
        }
      })

      proc.on('error', (err) => {
        resolve({ success: false, error: err.message })
      })

      // Timeout after 60 seconds (kiro chat may take longer)
      setTimeout(() => {
        proc.kill()
        resolve({ success: false, error: 'Timeout: agent generation took too long' })
      }, 60000)
    })
  }
}

module.exports = { ExecutionEngine }
