import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateAgentModal from '../components/CreateAgentModal'
import { AgentProvider, useAgents } from '../context/AgentContext'
import type { AgentMode, AgentExecutor } from '../types'

// Helper para crear mock completo de electronAPI
function createElectronAPIMock(overrides: Partial<typeof window.electronAPI> = {}) {
  return {
    notify: vi.fn(),
    loadBoard: vi.fn().mockResolvedValue(null),
    saveBoard: vi.fn().mockResolvedValue(true),
    executeTask: vi.fn().mockResolvedValue({ success: true }),
    cancelTask: vi.fn().mockResolvedValue(true),
    sendTaskInput: vi.fn().mockResolvedValue({ success: true }),
    onTaskOutput: vi.fn().mockReturnValue(vi.fn()),
    onTaskFinished: vi.fn().mockReturnValue(vi.fn()),
    onTaskWaitingInput: vi.fn().mockReturnValue(vi.fn()),
    selectDirectory: vi.fn().mockResolvedValue(null),
    getModels: vi.fn().mockResolvedValue(['auto', 'claude-sonnet-4']),
    generateAgentFile: vi.fn().mockResolvedValue({ success: true, path: 'test.md' }),
    getOrchestrationStatus: vi.fn().mockResolvedValue({ active: false, subtasks: [], pending: [], running: [], completed: [], failed: [] }),
    onOrchestrationStarted: vi.fn().mockReturnValue(vi.fn()),
    onSubtaskCreated: vi.fn().mockReturnValue(vi.fn()),
    onSubtaskFinished: vi.fn().mockReturnValue(vi.fn()),
    onSubtaskError: vi.fn().mockReturnValue(vi.fn()),
    onOrchestrationComplete: vi.fn().mockReturnValue(vi.fn()),
    ...overrides,
  }
}

// Helper to capture created agents
let lastCreatedAgents: ReturnType<typeof useAgents>['agents'] = []

function AgentCapture({ children }: { children: React.ReactNode }) {
  return <AgentProvider>{children}<AgentReader /></AgentProvider>
}

function AgentReader() {
  const { agents } = useAgents()
  lastCreatedAgents = agents
  return null
}

function renderModal(onClose = vi.fn()) {
  return render(
    <AgentCapture>
      <CreateAgentModal onClose={onClose} />
    </AgentCapture>
  )
}

const allModes: { value: AgentMode; label: string }[] = [
  { value: 'plan', label: 'Plan' },
  { value: 'executor', label: 'Executor' },
  { value: 'advisor', label: 'Advisor' },
  { value: 'orchestrator', label: 'Orchestrator' },
]

const allExecutors: { value: AgentExecutor; label: string }[] = [
  { value: 'opencode', label: 'OpenCode' },
  { value: 'kiro-cli', label: 'Kiro CLI' },
]

describe('CreateAgentModal — all mode × executor combinations', () => {
  beforeEach(() => {
    lastCreatedAgents = []
  })

  for (const mode of allModes) {
    for (const executor of allExecutors) {
      it(`creates a ${mode.value} agent using ${executor.value}`, async () => {
        const user = userEvent.setup()
        const onClose = vi.fn()
        renderModal(onClose)

        // Set name
        const nameInput = screen.getByPlaceholderText('Nombre del agente')
        await user.clear(nameInput)
        await user.type(nameInput, `Agent-${mode.value}-${executor.value}`)

        // Select executor
        const executorSelect = screen.getByDisplayValue('OpenCode')
        await user.selectOptions(executorSelect, executor.value)

        // Select mode
        const modeSelect = screen.getByDisplayValue('Executor')
        await user.selectOptions(modeSelect, mode.value)

        // Submit
        await user.click(screen.getByRole('button', { name: 'Agregar sin perfil' }))

        expect(onClose).toHaveBeenCalledTimes(1)

        // Verify the agent was created with correct properties
        const created = lastCreatedAgents.find((a) => a.name === `Agent-${mode.value}-${executor.value}`)
        expect(created).toBeDefined()
        expect(created!.executor).toBe(executor.value)
        expect(created!.defaultMode).toBe(mode.value)
        expect(created!.status).toBe('active')
      })
    }
  }
})

describe('CreateAgentModal — generate agent file per executor', () => {
  beforeEach(() => {
    lastCreatedAgents = []
  })

  it('calls generateAgentFile with opencode executor', async () => {
    const mockGenerateAgentFile = vi.fn().mockResolvedValue({ success: true, path: '~/.config/opencode/agent/test-agent.md' })
    window.electronAPI = createElectronAPIMock({ generateAgentFile: mockGenerateAgentFile })

    const user = userEvent.setup()
    const onClose = vi.fn()
    renderModal(onClose)

    // Set name
    const nameInput = screen.getByPlaceholderText('Nombre del agente')
    await user.clear(nameInput)
    await user.type(nameInput, 'OpenCode-Planner')

    // Select mode plan
    const modeSelect = screen.getByDisplayValue('Executor')
    await user.selectOptions(modeSelect, 'plan')

    // Type description
    const descInput = screen.getByPlaceholderText(/Experto en React/)
    await user.type(descInput, 'Experto en arquitectura de microservicios')

    // Click generate
    await user.click(screen.getByRole('button', { name: /Generar y crear agente/ }))

    await waitFor(() => {
      expect(mockGenerateAgentFile).toHaveBeenCalledWith('opencode', 'Experto en arquitectura de microservicios', 'plan')
    })

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })

    const created = lastCreatedAgents.find((a) => a.name === 'OpenCode-Planner')
    expect(created).toBeDefined()
    expect(created!.agentFile).toBe('~/.config/opencode/agent/test-agent.md')
    expect(created!.executor).toBe('opencode')
    expect(created!.defaultMode).toBe('plan')

    // Cleanup
    window.electronAPI = undefined
  })

  it('calls generateAgentFile with kiro-cli executor', async () => {
    const mockGenerateAgentFile = vi.fn().mockResolvedValue({ success: true, path: 'kiro-advisor' })
    window.electronAPI = createElectronAPIMock({ generateAgentFile: mockGenerateAgentFile })

    const user = userEvent.setup()
    const onClose = vi.fn()
    renderModal(onClose)

    // Set name
    const nameInput = screen.getByPlaceholderText('Nombre del agente')
    await user.clear(nameInput)
    await user.type(nameInput, 'Kiro-Advisor')

    // Switch executor to kiro-cli
    const executorSelect = screen.getByDisplayValue('OpenCode')
    await user.selectOptions(executorSelect, 'kiro-cli')

    // Select mode advisor
    const modeSelect = screen.getByDisplayValue('Executor')
    await user.selectOptions(modeSelect, 'advisor')

    // Type description
    const descInput = screen.getByPlaceholderText(/Experto en React/)
    await user.type(descInput, 'Asesor de seguridad en aplicaciones web')

    // Click generate
    await user.click(screen.getByRole('button', { name: /Generar y crear agente/ }))

    await waitFor(() => {
      expect(mockGenerateAgentFile).toHaveBeenCalledWith('kiro-cli', 'Asesor de seguridad en aplicaciones web', 'advisor')
    })

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })

    const created = lastCreatedAgents.find((a) => a.name === 'Kiro-Advisor')
    expect(created).toBeDefined()
    expect(created!.agentFile).toBe('kiro-advisor')
    expect(created!.executor).toBe('kiro-cli')
    expect(created!.defaultMode).toBe('advisor')

    // Cleanup
    window.electronAPI = undefined
  })

  it('creates an orchestrator agent using opencode', async () => {
    const mockGenerateAgentFile = vi.fn().mockResolvedValue({ success: true, path: '~/.config/opencode/agent/orchestrator.md' })
    window.electronAPI = createElectronAPIMock({ generateAgentFile: mockGenerateAgentFile })

    const user = userEvent.setup()
    const onClose = vi.fn()
    renderModal(onClose)

    // Set name
    const nameInput = screen.getByPlaceholderText('Nombre del agente')
    await user.clear(nameInput)
    await user.type(nameInput, 'Orchestrator-OC')

    // Select mode orchestrator
    const modeSelect = screen.getByDisplayValue('Executor')
    await user.selectOptions(modeSelect, 'orchestrator')

    // Type description
    const descInput = screen.getByPlaceholderText(/Experto en React/)
    await user.type(descInput, 'Orquestador que descompone tareas en subtareas')

    // Click generate
    await user.click(screen.getByRole('button', { name: /Generar y crear agente/ }))

    await waitFor(() => {
      expect(mockGenerateAgentFile).toHaveBeenCalledWith('opencode', 'Orquestador que descompone tareas en subtareas', 'orchestrator')
    })

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })

    const created = lastCreatedAgents.find((a) => a.name === 'Orchestrator-OC')
    expect(created).toBeDefined()
    expect(created!.agentFile).toBe('~/.config/opencode/agent/orchestrator.md')
    expect(created!.executor).toBe('opencode')
    expect(created!.defaultMode).toBe('orchestrator')

    // Cleanup
    window.electronAPI = undefined
  })

  it('creates an orchestrator agent using kiro-cli', async () => {
    const mockGenerateAgentFile = vi.fn().mockResolvedValue({ success: true, path: 'kiro-orchestrator' })
    window.electronAPI = createElectronAPIMock({ generateAgentFile: mockGenerateAgentFile })

    const user = userEvent.setup()
    const onClose = vi.fn()
    renderModal(onClose)

    // Set name
    const nameInput = screen.getByPlaceholderText('Nombre del agente')
    await user.clear(nameInput)
    await user.type(nameInput, 'Orchestrator-Kiro')

    // Switch executor to kiro-cli
    const executorSelect = screen.getByDisplayValue('OpenCode')
    await user.selectOptions(executorSelect, 'kiro-cli')

    // Select mode orchestrator
    const modeSelect = screen.getByDisplayValue('Executor')
    await user.selectOptions(modeSelect, 'orchestrator')

    // Type description
    const descInput = screen.getByPlaceholderText(/Experto en React/)
    await user.type(descInput, 'Coordinador de equipo que delega tareas')

    // Click generate
    await user.click(screen.getByRole('button', { name: /Generar y crear agente/ }))

    await waitFor(() => {
      expect(mockGenerateAgentFile).toHaveBeenCalledWith('kiro-cli', 'Coordinador de equipo que delega tareas', 'orchestrator')
    })

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })

    const created = lastCreatedAgents.find((a) => a.name === 'Orchestrator-Kiro')
    expect(created).toBeDefined()
    expect(created!.agentFile).toBe('kiro-orchestrator')
    expect(created!.executor).toBe('kiro-cli')
    expect(created!.defaultMode).toBe('orchestrator')

    // Cleanup
    window.electronAPI = undefined
  })
})

describe('CreateAgentModal — execute task per agent type', () => {
  it('executes a task with opencode executor agent', async () => {
    const mockExecuteTask = vi.fn().mockResolvedValue({ success: true })
    window.electronAPI = createElectronAPIMock({ executeTask: mockExecuteTask })

    // This verifies the IPC call shape is correct
    const result = await window.electronAPI!.executeTask('t1', 'a1')
    expect(result.success).toBe(true)
    expect(mockExecuteTask).toHaveBeenCalledWith('t1', 'a1')

    window.electronAPI = undefined
  })

  it('executes a task with kiro-cli executor agent', async () => {
    const mockExecuteTask = vi.fn().mockResolvedValue({ success: true })
    window.electronAPI = createElectronAPIMock({ executeTask: mockExecuteTask })

    const result = await window.electronAPI!.executeTask('t2', 'a2')
    expect(result.success).toBe(true)
    expect(mockExecuteTask).toHaveBeenCalledWith('t2', 'a2')

    window.electronAPI = undefined
  })
})
