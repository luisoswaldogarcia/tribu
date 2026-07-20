import type { Column, Agent, AgentStatus, AgentMode, AgentExecutor } from './types'

const validStatuses: AgentStatus[] = ['active', 'inactive', 'busy', 'waiting_input']
const validModes: AgentMode[] = ['plan', 'executor', 'advisor']
const validExecutors: AgentExecutor[] = ['opencode', 'kiro-cli']

export const defaultAgents: Agent[] = [
  { id: 'a1', name: 'Zeref', avatar: '🧙', status: 'active', defaultMode: 'executor' },
  { id: 'a2', name: 'PixelBot', avatar: '🤖', status: 'active', defaultMode: 'executor' },
  { id: 'a3', name: 'Nyx', avatar: '🦊', status: 'active', defaultMode: 'plan' },
]

const columnNames: Record<string, string> = {
  todo: 'Por hacer',
  wip: 'En progreso',
  done: 'Terminado',
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
    }

    if (typeof raw.model === 'string' && raw.model) agent.model = raw.model
    if (validExecutors.includes(raw.executor as AgentExecutor)) agent.executor = raw.executor as AgentExecutor
    if (typeof raw.context === 'string' && raw.context) agent.context = raw.context
    if (typeof raw.currentTaskId === 'string' && raw.currentTaskId) agent.currentTaskId = raw.currentTaskId

    return [agent]
  })
}

export const initialColumns: Column[] = [
  {
    id: 'todo',
    title: 'Por hacer',
    tasks: [
      { id: 't1', title: 'Diseñar base de datos', description: 'Esquema inicial de tablas', priority: 'alta', agents: ['a1', 'a2'] },
      { id: 't2', title: 'Configurar CI/CD', priority: 'media', agents: ['a3'] },
      { id: 't3', title: 'Documentar API', priority: 'baja', agents: [] },
    ],
    color: '#ff6b6b',
  },
  {
    id: 'wip',
    title: 'En progreso',
    tasks: [
      { id: 't4', title: 'Implementar login', description: 'Autenticación con JWT', priority: 'alta', agents: ['a1'] },
      { id: 't5', title: 'Crear componentes UI', priority: 'alta', agents: ['a2', 'a3'] },
    ],
    color: '#ffd93d',
  },
  {
    id: 'done',
    title: 'Terminado',
    tasks: [{ id: 't6', title: 'Repo inicial', priority: 'media', agents: ['a1'] }],
    color: '#6bcb77',
  },
]
