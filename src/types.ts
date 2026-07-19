export type Priority = 'alta' | 'media' | 'baja'

export interface Agent {
  id: string
  name: string
  avatar: string
  context: string
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

export interface OpenCodeModel {
  id: string
  name: string
}

export interface BoardData {
  columns: Column[]
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
