export type Priority = 'alta' | 'media' | 'baja'

export type AgentStatus = 'active' | 'inactive' | 'busy' | 'waiting_input'

export type AgentMode = 'plan' | 'executor' | 'advisor' | 'orchestrator'

export type AgentExecutor = 'opencode' | 'kiro-cli'

export type TaskStatus = 'idle' | 'running' | 'done' | 'error' | 'hold'

export interface ChatMessage {
  role: 'agent' | 'user'
  content: string
  timestamp: string
}

export interface Agent {
  id: string
  name: string
  avatar: string
  status: AgentStatus
  defaultMode: AgentMode
  executor: AgentExecutor
  model?: string
  context?: string
  currentTaskId?: string
  agentFile?: string
}

export interface Task {
  id: string
  title: string
  description?: string
  priority: Priority
  agents: string[]
  parentId?: string
  context?: string
  holdReason?: string
  workingDir?: string
  sessionId?: string
  /** @deprecated Use messages instead */
  log?: string
  messages?: ChatMessage[]
  outputPreview?: string
  executionStatus?: TaskStatus
}

export interface Column {
  id: string
  title: string
  tasks: Task[]
  color: string
}

export interface BoardData {
  columns: Column[]
  agents: Agent[]
}

export interface OrchestrationStatus {
  active: boolean
  subtasks: { id: string; title: string; assignedAgentId: string; dependsOn: string[] }[]
  pending: string[]
  running: string[]
  completed: string[]
  failed: string[]
}

declare global {
  interface Window {
    electronAPI?: {
      notify: (title: string, body: string) => void
      loadBoard: () => Promise<BoardData | null>
      saveBoard: (data: BoardData) => Promise<boolean>
      executeTask: (taskId: string, agentId: string) => Promise<{ success: boolean; error?: string }>
      cancelTask: (taskId: string) => Promise<boolean>
      sendTaskInput: (taskId: string, text: string) => Promise<{ success: boolean; fallback?: boolean; error?: string }>
      onTaskOutput: (callback: (data: { taskId: string; chunk: string }) => void) => () => void
      onTaskFinished: (callback: (data: { taskId: string; exitCode: number; sessionId?: string; log: string }) => void) => () => void
      onTaskWaitingInput: (callback: (data: { taskId: string }) => void) => () => void
      selectDirectory: () => Promise<string | null>
      getModels: (executor: AgentExecutor) => Promise<string[]>
      generateAgentFile: (executor: AgentExecutor, description: string, mode: AgentMode, tools?: string) => Promise<{ success: boolean; path?: string; error?: string }>
      // Orchestration
      getOrchestrationStatus: (parentTaskId: string) => Promise<OrchestrationStatus>
      onOrchestrationStarted: (callback: (data: { parentTaskId: string }) => void) => () => void
      onSubtaskCreated: (callback: (data: { parentTaskId: string; subtask: Task }) => void) => () => void
      onSubtaskFinished: (callback: (data: { parentTaskId: string; subtaskId: string }) => void) => () => void
      onSubtaskError: (callback: (data: { parentTaskId: string; subtaskId: string; error: string }) => void) => () => void
      onOrchestrationComplete: (callback: (data: { parentTaskId: string }) => void) => () => void
    }
  }
}
