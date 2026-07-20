export type Priority = 'alta' | 'media' | 'baja'

export type AgentStatus = 'active' | 'inactive' | 'busy' | 'waiting_input'

export type AgentMode = 'plan' | 'executor' | 'advisor'

export type AgentExecutor = 'opencode' | 'kiro-cli'

export interface Agent {
  id: string
  name: string
  avatar: string
  status: AgentStatus
  defaultMode: AgentMode
  model?: string
  executor?: AgentExecutor
  context?: string
  currentTaskId?: string
}

export interface Task {
  id: string
  title: string
  description?: string
  priority: Priority
  agents: string[]
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
    }
  }
}
