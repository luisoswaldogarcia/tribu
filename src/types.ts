export type Priority = 'alta' | 'media' | 'baja'

export type AgentStatus = 'active' | 'inactive' | 'busy' | 'waiting_input'

export type AgentMode = 'plan' | 'executor' | 'advisor'

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
    }
  }
}
