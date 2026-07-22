import { describe, it, expect, vi, beforeEach } from 'vitest'
// @ts-ignore
import { buildOrchestratorPrompt, parseOrchestratorResponse, OrchestrationEngine } from '../../electron/orchestrator.cjs'

// --- Test fixtures ---

const mockAgents = [
  { id: 'agent-1', name: 'Coder', avatar: '💻', defaultMode: 'executor', executor: 'opencode', context: 'Backend development', model: 'claude' },
  { id: 'agent-2', name: 'Designer', avatar: '🎨', defaultMode: 'executor', executor: 'opencode', context: 'UI/UX design' },
  { id: 'agent-3', name: 'Orchestrator', avatar: '🎯', defaultMode: 'orchestrator', executor: 'opencode' },
]

const mockTask = {
  id: 'task-001',
  title: 'Build login feature',
  description: 'Implement login with email and password',
  workingDir: '/home/user/project',
}

// --- buildOrchestratorPrompt ---

describe('buildOrchestratorPrompt', () => {
  it('generates prompt with task title and description', () => {
    const prompt = buildOrchestratorPrompt(mockTask, mockAgents)
    expect(prompt).toContain('Build login feature')
    expect(prompt).toContain('Implement login with email and password')
  })

  it('includes working directory when present', () => {
    const prompt = buildOrchestratorPrompt(mockTask, mockAgents)
    expect(prompt).toContain('/home/user/project')
  })

  it('includes available agents (non-orchestrator only)', () => {
    const prompt = buildOrchestratorPrompt(mockTask, mockAgents)
    expect(prompt).toContain('Coder')
    expect(prompt).toContain('agent-1')
    expect(prompt).toContain('Designer')
    expect(prompt).toContain('agent-2')
    expect(prompt).toContain('Backend development')
  })

  it('excludes orchestrator agents from the list', () => {
    const prompt = buildOrchestratorPrompt(mockTask, mockAgents)
    expect(prompt).not.toContain('agent-3')
    // The word "Orchestrator" appears in the prompt instructions, but the agent entry should not
    expect(prompt).not.toContain('- Orchestrator (id: agent-3)')
  })

  it('includes JSON format instructions', () => {
    const prompt = buildOrchestratorPrompt(mockTask, mockAgents)
    expect(prompt).toContain('subtasks')
    expect(prompt).toContain('assignedAgent')
    expect(prompt).toContain('dependsOn')
    expect(prompt).toContain('JSON')
  })

  it('handles task without description or workingDir', () => {
    const minimal = { id: 'task-min', title: 'Minimal task' }
    const prompt = buildOrchestratorPrompt(minimal, mockAgents)
    expect(prompt).toContain('Minimal task')
    expect(prompt).not.toContain('Descripción:')
  })
})

// --- parseOrchestratorResponse ---

describe('parseOrchestratorResponse', () => {
  const agents = [
    { id: 'agent-1', name: 'Coder' },
    { id: 'agent-2', name: 'Designer' },
  ]

  it('parses valid JSON response correctly', () => {
    const output = JSON.stringify({
      subtasks: [
        { title: 'Create API', assignedAgent: 'Coder', description: 'Build REST endpoints' },
        { title: 'Design UI', assignedAgent: 'Designer', description: 'Create mockups' },
      ],
    })
    const result = parseOrchestratorResponse(output, agents, 'parent-1')
    expect(result.success).toBe(true)
    expect(result.subtasks).toHaveLength(2)
    expect(result.subtasks[0].id).toBe('sub_parent-1_0')
    expect(result.subtasks[0].title).toBe('Create API')
    expect(result.subtasks[0].assignedAgentId).toBe('agent-1')
    expect(result.subtasks[1].id).toBe('sub_parent-1_1')
    expect(result.subtasks[1].assignedAgentId).toBe('agent-2')
  })

  it('extracts JSON from markdown code blocks (```json ... ```)', () => {
    const output = `Aquí está mi plan:

\`\`\`json
{
  "subtasks": [
    { "title": "Task A", "assignedAgent": "Coder", "description": "Do A" }
  ]
}
\`\`\`

Eso es todo.`
    const result = parseOrchestratorResponse(output, agents, 'p1')
    expect(result.success).toBe(true)
    expect(result.subtasks).toHaveLength(1)
    expect(result.subtasks[0].title).toBe('Task A')
  })

  it('extracts raw JSON from mixed text', () => {
    const output = `Some preamble text here... {"subtasks": [{"title": "Raw task", "assignedAgent": "Coder"}]} ...and some trailing text`
    const result = parseOrchestratorResponse(output, agents, 'p2')
    expect(result.success).toBe(true)
    expect(result.subtasks[0].title).toBe('Raw task')
  })

  it('validates required fields — missing title', () => {
    const output = JSON.stringify({
      subtasks: [{ assignedAgent: 'Coder', description: 'No title here' }],
    })
    const result = parseOrchestratorResponse(output, agents, 'p3')
    expect(result.success).toBe(false)
    expect(result.error).toContain('title')
  })

  it('validates required fields — missing assignedAgent', () => {
    const output = JSON.stringify({
      subtasks: [{ title: 'Has title' }],
    })
    const result = parseOrchestratorResponse(output, agents, 'p3')
    expect(result.success).toBe(false)
    expect(result.error).toContain('assignedAgent')
  })

  it('rejects unknown agent names', () => {
    const output = JSON.stringify({
      subtasks: [{ title: 'Unknown agent task', assignedAgent: 'NonExistent' }],
    })
    const result = parseOrchestratorResponse(output, agents, 'p4')
    expect(result.success).toBe(false)
    expect(result.error).toContain('NonExistent')
    expect(result.error).toContain('no encontrado')
  })

  it('resolves agent names to IDs (case-insensitive)', () => {
    const output = JSON.stringify({
      subtasks: [{ title: 'Case test', assignedAgent: 'cOdEr' }],
    })
    const result = parseOrchestratorResponse(output, agents, 'p5')
    expect(result.success).toBe(true)
    expect(result.subtasks[0].assignedAgentId).toBe('agent-1')
  })

  it('resolves dependsOn titles to subtask IDs', () => {
    const output = JSON.stringify({
      subtasks: [
        { title: 'First', assignedAgent: 'Coder' },
        { title: 'Second', assignedAgent: 'Designer', dependsOn: ['First'] },
      ],
    })
    const result = parseOrchestratorResponse(output, agents, 'p6')
    expect(result.success).toBe(true)
    expect(result.subtasks[1].dependsOn).toEqual(['sub_p6_0'])
  })

  it('detects circular dependencies', () => {
    const output = JSON.stringify({
      subtasks: [
        { title: 'A', assignedAgent: 'Coder', dependsOn: ['B'] },
        { title: 'B', assignedAgent: 'Designer', dependsOn: ['A'] },
      ],
    })
    const result = parseOrchestratorResponse(output, agents, 'p7')
    expect(result.success).toBe(false)
    expect(result.error).toContain('circulares')
  })

  it('handles malformed JSON gracefully', () => {
    const output = 'This is not JSON at all { broken }'
    const result = parseOrchestratorResponse(output, agents, 'p8')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('handles empty subtasks array', () => {
    const output = JSON.stringify({ subtasks: [] })
    const result = parseOrchestratorResponse(output, agents, 'p9')
    expect(result.success).toBe(false)
    expect(result.error).toContain('vacío')
  })

  it('handles null/empty output', () => {
    expect(parseOrchestratorResponse(null, agents, 'p10').success).toBe(false)
    expect(parseOrchestratorResponse('', agents, 'p10').success).toBe(false)
    expect(parseOrchestratorResponse(undefined, agents, 'p10').success).toBe(false)
  })

  it('defaults parentTaskId to "unknown" when not provided', () => {
    const output = JSON.stringify({
      subtasks: [{ title: 'No parent', assignedAgent: 'Coder' }],
    })
    const result = parseOrchestratorResponse(output, agents)
    expect(result.success).toBe(true)
    expect(result.subtasks[0].id).toBe('sub_unknown_0')
  })

  it('assigns default priority "media" when invalid or missing', () => {
    const output = JSON.stringify({
      subtasks: [
        { title: 'No priority', assignedAgent: 'Coder' },
        { title: 'Invalid priority', assignedAgent: 'Designer', priority: 'ultra' },
      ],
    })
    const result = parseOrchestratorResponse(output, agents, 'p11')
    expect(result.success).toBe(true)
    expect(result.subtasks[0].priority).toBe('media')
    expect(result.subtasks[1].priority).toBe('media')
  })

  it('rejects duplicate subtask titles', () => {
    const output = JSON.stringify({
      subtasks: [
        { title: 'Same Title', assignedAgent: 'Coder' },
        { title: 'Same Title', assignedAgent: 'Designer' },
      ],
    })
    const result = parseOrchestratorResponse(output, agents, 'p12')
    expect(result.success).toBe(false)
    expect(result.error).toContain('duplicado')
  })

  it('rejects dependsOn referencing non-existent subtask', () => {
    const output = JSON.stringify({
      subtasks: [
        { title: 'Real', assignedAgent: 'Coder', dependsOn: ['Ghost'] },
      ],
    })
    const result = parseOrchestratorResponse(output, agents, 'p13')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Ghost')
    expect(result.error).toContain('no existe')
  })
})

// --- OrchestrationEngine ---

describe('OrchestrationEngine', () => {
  let mockExecutionEngine: any
  let callbacks: any
  let engine: any
  let boardData: any

  const agents = [
    { id: 'agent-1', name: 'Coder', executor: 'opencode', model: 'claude' },
    { id: 'agent-2', name: 'Designer', executor: 'opencode' },
  ]

  beforeEach(() => {
    mockExecutionEngine = {
      execute: vi.fn(),
    }

    callbacks = {
      onSubtaskCreated: vi.fn(),
      onSubtaskFinished: vi.fn(),
      onOrchestrationComplete: vi.fn(),
      onSubtaskError: vi.fn(),
      saveBoard: vi.fn().mockResolvedValue(undefined),
    }

    engine = new OrchestrationEngine(mockExecutionEngine, callbacks)

    boardData = {
      columns: [
        { id: 'todo', tasks: [] },
        { id: 'wip', tasks: [{ id: 'parent-1', title: 'Parent task', agents: [], executionStatus: 'running' }] },
        { id: 'hold', tasks: [] },
        { id: 'done', tasks: [] },
      ],
    }
  })

  it('throws if no executionEngine is provided', () => {
    expect(() => new OrchestrationEngine(null)).toThrow('requires an ExecutionEngine')
  })

  it('creates subtasks with correct parentId', async () => {
    const finishCb: any[] = []
    mockExecutionEngine.execute.mockImplementation(() => ({
      onOutput: () => {},
      onFinish: (cb: any) => { finishCb.push(cb) },
      onWaitingInput: () => {},
    }))

    const subtasks = [
      { id: 'sub_parent-1_0', title: 'Sub A', description: 'Do A', assignedAgentId: 'agent-1', workingDir: '/tmp', dependsOn: [], priority: 'alta', context: '' },
    ]

    await engine.orchestrate('parent-1', subtasks, agents, boardData)

    expect(callbacks.onSubtaskCreated).toHaveBeenCalledWith('parent-1', expect.objectContaining({
      id: 'sub_parent-1_0',
      title: 'Sub A',
      parentId: 'parent-1',
    }))

    // Task should be in wip column
    const wipTasks = boardData.columns.find((c: any) => c.id === 'wip').tasks
    expect(wipTasks.some((t: any) => t.id === 'sub_parent-1_0' && t.parentId === 'parent-1')).toBe(true)
  })

  it('executes subtasks without dependencies immediately', async () => {
    mockExecutionEngine.execute.mockImplementation(() => ({
      onOutput: () => {},
      onFinish: () => {},
      onWaitingInput: () => {},
    }))

    const subtasks = [
      { id: 'sub_p_0', title: 'Independent', description: '', assignedAgentId: 'agent-1', workingDir: '', dependsOn: [], priority: 'media', context: '' },
    ]

    await engine.orchestrate('parent-1', subtasks, agents, boardData)

    expect(mockExecutionEngine.execute).toHaveBeenCalledTimes(1)
    expect(mockExecutionEngine.execute).toHaveBeenCalledWith(expect.objectContaining({
      taskId: 'sub_p_0',
      executor: 'opencode',
      model: 'claude',
    }))
  })

  it('waits for dependencies before executing dependent tasks', async () => {
    const finishCallbacks: any[] = []
    mockExecutionEngine.execute.mockImplementation(() => ({
      onOutput: () => {},
      onFinish: (cb: any) => { finishCallbacks.push(cb) },
      onWaitingInput: () => {},
    }))

    const subtasks = [
      { id: 'sub_p_0', title: 'First', description: '', assignedAgentId: 'agent-1', workingDir: '', dependsOn: [], priority: 'media', context: '' },
      { id: 'sub_p_1', title: 'Second', description: '', assignedAgentId: 'agent-2', workingDir: '', dependsOn: ['sub_p_0'], priority: 'media', context: '' },
    ]

    await engine.orchestrate('parent-1', subtasks, agents, boardData)

    // Only the first should execute immediately (agent-2 has dependent task waiting)
    expect(mockExecutionEngine.execute).toHaveBeenCalledTimes(1)
    expect(mockExecutionEngine.execute).toHaveBeenCalledWith(expect.objectContaining({ taskId: 'sub_p_0' }))

    // Simulate first task finishing
    finishCallbacks[0]({ exitCode: 0 })

    // Now the dependent task should execute
    expect(mockExecutionEngine.execute).toHaveBeenCalledTimes(2)
    expect(mockExecutionEngine.execute).toHaveBeenCalledWith(expect.objectContaining({ taskId: 'sub_p_1' }))
  })

  it('respects 1-task-per-agent limit', async () => {
    const finishCallbacks: any[] = []
    mockExecutionEngine.execute.mockImplementation(() => ({
      onOutput: () => {},
      onFinish: (cb: any) => { finishCallbacks.push(cb) },
      onWaitingInput: () => {},
    }))

    // Two independent subtasks assigned to the same agent
    const subtasks = [
      { id: 'sub_p_0', title: 'Task A', description: '', assignedAgentId: 'agent-1', workingDir: '', dependsOn: [], priority: 'media', context: '' },
      { id: 'sub_p_1', title: 'Task B', description: '', assignedAgentId: 'agent-1', workingDir: '', dependsOn: [], priority: 'media', context: '' },
    ]

    await engine.orchestrate('parent-1', subtasks, agents, boardData)

    // Only first should execute — agent is busy
    expect(mockExecutionEngine.execute).toHaveBeenCalledTimes(1)
    expect(mockExecutionEngine.execute).toHaveBeenCalledWith(expect.objectContaining({ taskId: 'sub_p_0' }))

    // First task finishes → second should be dequeued
    finishCallbacks[0]({ exitCode: 0 })

    expect(mockExecutionEngine.execute).toHaveBeenCalledTimes(2)
    expect(mockExecutionEngine.execute).toHaveBeenCalledWith(expect.objectContaining({ taskId: 'sub_p_1' }))
  })

  it('marks parent as done when all subtasks complete', async () => {
    const finishCallbacks: any[] = []
    mockExecutionEngine.execute.mockImplementation(() => ({
      onOutput: () => {},
      onFinish: (cb: any) => { finishCallbacks.push(cb) },
      onWaitingInput: () => {},
    }))

    const subtasks = [
      { id: 'sub_p_0', title: 'Only task', description: '', assignedAgentId: 'agent-1', workingDir: '', dependsOn: [], priority: 'media', context: '' },
    ]

    await engine.orchestrate('parent-1', subtasks, agents, boardData)
    finishCallbacks[0]({ exitCode: 0 })

    expect(callbacks.onOrchestrationComplete).toHaveBeenCalledWith('parent-1')
    expect(callbacks.onSubtaskFinished).toHaveBeenCalledWith('parent-1', 'sub_p_0')

    // Parent should be moved to done column
    const doneTasks = boardData.columns.find((c: any) => c.id === 'done').tasks
    expect(doneTasks.some((t: any) => t.id === 'parent-1')).toBe(true)
  })

  it('marks failed subtask as hold', async () => {
    const finishCallbacks: any[] = []
    mockExecutionEngine.execute.mockImplementation(() => ({
      onOutput: () => {},
      onFinish: (cb: any) => { finishCallbacks.push(cb) },
      onWaitingInput: () => {},
    }))

    const subtasks = [
      { id: 'sub_p_0', title: 'Failing task', description: '', assignedAgentId: 'agent-1', workingDir: '', dependsOn: [], priority: 'media', context: '' },
    ]

    await engine.orchestrate('parent-1', subtasks, agents, boardData)
    finishCallbacks[0]({ exitCode: 1 })

    expect(callbacks.onSubtaskError).toHaveBeenCalledWith('parent-1', 'sub_p_0', 'Exit code: 1')

    // Task should be marked as hold
    const wipTasks = boardData.columns.find((c: any) => c.id === 'wip').tasks
    const failedTask = wipTasks.find((t: any) => t.id === 'sub_p_0')
    expect(failedTask.executionStatus).toBe('hold')
    expect(failedTask.holdReason).toBe('Exit code: 1')
  })

  it('calls onSubtaskError when waiting_input occurs', async () => {
    let waitingInputCb: any
    mockExecutionEngine.execute.mockImplementation(() => ({
      onOutput: () => {},
      onFinish: () => {},
      onWaitingInput: (cb: any) => { waitingInputCb = cb },
    }))

    const subtasks = [
      { id: 'sub_p_0', title: 'Stuck task', description: '', assignedAgentId: 'agent-1', workingDir: '', dependsOn: [], priority: 'media', context: '' },
    ]

    await engine.orchestrate('parent-1', subtasks, agents, boardData)
    waitingInputCb()

    expect(callbacks.onSubtaskError).toHaveBeenCalledWith('parent-1', 'sub_p_0', 'waiting_input')
  })

  it('does not call onOrchestrationComplete when subtasks have failed', async () => {
    const finishCallbacks: any[] = []
    mockExecutionEngine.execute.mockImplementation(() => ({
      onOutput: () => {},
      onFinish: (cb: any) => { finishCallbacks.push(cb) },
      onWaitingInput: () => {},
    }))

    const subtasks = [
      { id: 'sub_p_0', title: 'Fail', description: '', assignedAgentId: 'agent-1', workingDir: '', dependsOn: [], priority: 'media', context: '' },
    ]

    await engine.orchestrate('parent-1', subtasks, agents, boardData)
    finishCallbacks[0]({ exitCode: 1 })

    expect(callbacks.onOrchestrationComplete).not.toHaveBeenCalled()
  })

  it('getStatus returns current orchestration state', async () => {
    mockExecutionEngine.execute.mockImplementation(() => ({
      onOutput: () => {},
      onFinish: () => {},
      onWaitingInput: () => {},
    }))

    const subtasks = [
      { id: 'sub_p_0', title: 'Running', description: '', assignedAgentId: 'agent-1', workingDir: '', dependsOn: [], priority: 'media', context: '' },
      { id: 'sub_p_1', title: 'Pending', description: '', assignedAgentId: 'agent-2', workingDir: '', dependsOn: ['sub_p_0'], priority: 'media', context: '' },
    ]

    await engine.orchestrate('parent-1', subtasks, agents, boardData)

    const status = engine.getStatus('parent-1')
    expect(status.active).toBe(true)
    expect(status.running).toContain('sub_p_0')
    expect(status.pending).toContain('sub_p_1')
    expect(status.completed).toHaveLength(0)
    expect(status.failed).toHaveLength(0)
  })

  it('getStatus returns inactive state for unknown parentTaskId', () => {
    const status = engine.getStatus('nonexistent')
    expect(status.active).toBe(false)
    expect(status.subtasks).toEqual([])
  })

  it('throws if orchestrate is called with empty subtasks', async () => {
    await expect(engine.orchestrate('parent-1', [], agents, boardData)).rejects.toThrow('non-empty subtasks')
  })

  it('throws if orchestrate is called again for same parentTaskId', async () => {
    mockExecutionEngine.execute.mockImplementation(() => ({
      onOutput: () => {},
      onFinish: () => {},
      onWaitingInput: () => {},
    }))

    const subtasks = [
      { id: 'sub_p_0', title: 'A', description: '', assignedAgentId: 'agent-1', workingDir: '', dependsOn: [], priority: 'media', context: '' },
    ]

    await engine.orchestrate('parent-1', subtasks, agents, boardData)
    await expect(engine.orchestrate('parent-1', subtasks, agents, boardData)).rejects.toThrow('already active')
  })

  it('saves board after creating subtasks', async () => {
    mockExecutionEngine.execute.mockImplementation(() => ({
      onOutput: () => {},
      onFinish: () => {},
      onWaitingInput: () => {},
    }))

    const subtasks = [
      { id: 'sub_p_0', title: 'A', description: '', assignedAgentId: 'agent-1', workingDir: '', dependsOn: [], priority: 'media', context: '' },
    ]

    await engine.orchestrate('parent-1', subtasks, agents, boardData)
    expect(callbacks.saveBoard).toHaveBeenCalledWith(boardData)
  })
})
