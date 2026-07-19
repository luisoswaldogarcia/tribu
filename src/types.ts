export type Priority = 'alta' | 'media' | 'baja'

export interface Agent {
  id: string
  name: string
  avatar: string
  model: string
  context: string
}

export interface Task {
  id: string
  title: string
  description?: string
  priority: Priority
  agents: string[]
  createdBy: string
}

export interface Column {
  id: string
  title: string
  tasks: Task[]
  color: string
}

declare global {
  interface Window {
    electronAPI?: {
      notify: (title: string, body: string) => void
    }
  }
}
