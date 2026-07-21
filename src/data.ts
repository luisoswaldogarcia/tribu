import type { Column, Agent, AgentStatus, AgentMode, AgentExecutor, Task, TaskStatus, ChatMessage } from './types'

const validStatuses: AgentStatus[] = ['active', 'inactive', 'busy', 'waiting_input']
const validModes: AgentMode[] = ['plan', 'executor', 'advisor']
const validExecutors: AgentExecutor[] = ['opencode', 'kiro-cli']
const validTaskStatuses: TaskStatus[] = ['idle', 'running', 'done', 'error', 'hold']

export const defaultAgents: Agent[] = [
  { id: 'a1', name: 'Zeref', avatar: '🧙', status: 'active', defaultMode: 'executor', executor: 'opencode' },
  { id: 'a2', name: 'PixelBot', avatar: '🤖', status: 'active', defaultMode: 'executor', executor: 'kiro-cli' },
  { id: 'a3', name: 'Nyx', avatar: '🦊', status: 'active', defaultMode: 'plan', executor: 'opencode' },
]

const columnNames: Record<string, string> = {
  todo: 'To Do',
  wip: 'In Progress',
  hold: 'On Hold',
  done: 'Done',
}

export function getColumnName(id: string): string {
  return columnNames[id] || id
}

export function normalizeAgents(input: unknown): Agent[] {
  if (!Array.isArray(input)) return []
  return input.flatMap((value) => {
    if (!value || typeof value !== 'object') return []
    const raw = value as Record<string, unknown>
    if (typeof raw.id !== 'string' || typeof raw.name !== 'string') return []

    const agent: Agent = {
      id: raw.id,
      name: raw.name,
      avatar: typeof raw.avatar === 'string' && raw.avatar ? raw.avatar : '🤖',
      status: validStatuses.includes(raw.status as AgentStatus) ? (raw.status as AgentStatus) : 'active',
      defaultMode: validModes.includes(raw.defaultMode as AgentMode) ? (raw.defaultMode as AgentMode) : 'executor',
      executor: validExecutors.includes(raw.executor as AgentExecutor) ? (raw.executor as AgentExecutor) : 'opencode',
    }

    if (typeof raw.model === 'string' && raw.model) agent.model = raw.model
    if (typeof raw.context === 'string' && raw.context) agent.context = raw.context
    if (typeof raw.currentTaskId === 'string' && raw.currentTaskId) agent.currentTaskId = raw.currentTaskId
    if (typeof raw.agentFile === 'string' && raw.agentFile) agent.agentFile = raw.agentFile

    return [agent]
  })
}

export function normalizeTasks(input: unknown): Task[] {
  if (!Array.isArray(input)) return []
  return input.flatMap((value) => {
    if (!value || typeof value !== 'object') return []
    const raw = value as Record<string, unknown>
    if (typeof raw.id !== 'string' || typeof raw.title !== 'string') return []

    const task: Task = {
      id: raw.id,
      title: raw.title,
      priority: ['alta', 'media', 'baja'].includes(raw.priority as string) ? (raw.priority as Task['priority']) : 'media',
      agents: Array.isArray(raw.agents) ? raw.agents.filter((a): a is string => typeof a === 'string') : [],
    }

    if (typeof raw.description === 'string' && raw.description) task.description = raw.description
    if (typeof raw.holdReason === 'string' && raw.holdReason) task.holdReason = raw.holdReason
    if (typeof raw.workingDir === 'string' && raw.workingDir) task.workingDir = raw.workingDir
    if (typeof raw.sessionId === 'string' && raw.sessionId) task.sessionId = raw.sessionId
    if (typeof raw.outputPreview === 'string') task.outputPreview = raw.outputPreview
    if (validTaskStatuses.includes(raw.executionStatus as TaskStatus)) task.executionStatus = raw.executionStatus as TaskStatus

    // Handle messages: prefer structured messages, migrate from legacy log string
    if (Array.isArray(raw.messages)) {
      task.messages = normalizeMessages(raw.messages)
    } else if (typeof raw.log === 'string' && raw.log) {
      task.messages = [{ role: 'agent', content: raw.log, timestamp: new Date().toISOString() }]
      task.log = raw.log
    }

    return [task]
  })
}

export function normalizeMessages(input: unknown[]): ChatMessage[] {
  return input.flatMap((msg) => {
    if (!msg || typeof msg !== 'object') return []
    const raw = msg as Record<string, unknown>
    if (raw.role !== 'agent' && raw.role !== 'user') return []
    if (typeof raw.content !== 'string') return []
    return [{
      role: raw.role as 'agent' | 'user',
      content: raw.content,
      timestamp: typeof raw.timestamp === 'string' ? raw.timestamp : new Date().toISOString(),
    }]
  })
}

export const initialColumns: Column[] = [
  {
    id: 'todo',
    title: 'To Do',
    tasks: [],
    color: '#ff6b6b',
  },
  {
    id: 'wip',
    title: 'In Progress',
    tasks: [],
    color: '#ffd93d',
  },
  {
    id: 'hold',
    title: 'On Hold',
    tasks: [],
    color: '#a78bfa',
  },
  {
    id: 'done',
    title: 'Done',
    tasks: [],
    color: '#6bcb77',
  },
]
