import type { Column, Agent, OpenCodeModel } from './types'

export const opencodeModels: OpenCodeModel[] = [
  { id: 'kiro/claude-sonnet-4', name: 'Claude Sonnet 4' },
  { id: 'kiro/claude-sonnet-4-5', name: 'Claude Sonnet 4.5' },
  { id: 'kiro/claude-haiku-4-5', name: 'Claude Haiku 4.5' },
]

export const agents: Agent[] = [
  {
    id: 'a1',
    name: 'Zeref',
    avatar: '🧙',
    context: 'Asistente general del sistema. Orquestador de tareas.',
  },
  {
    id: 'a2',
    name: 'PixelBot',
    avatar: '🤖',
    context: 'Especialista en UI/UX y pixel art. Crea componentes visuales.',
  },
  {
    id: 'a3',
    name: 'Nyx',
    avatar: '🦊',
    context: 'Arquitecto de software. Diseña estructuras y APIs.',
  },
]

const columnNames: Record<string, string> = {
  todo: 'Por hacer',
  wip: 'En progreso',
  done: 'Terminado',
}

export function getColumnName(id: string): string {
  return columnNames[id] || id
}

export const initialColumns: Column[] = [
  {
    id: 'todo',
    title: 'Por hacer',
    tasks: [
      {
        id: 't1',
        title: 'Diseñar base de datos',
        description: 'Esquema inicial de tablas',
        priority: 'alta',
        agents: ['a1', 'a2'],
      },
      {
        id: 't2',
        title: 'Configurar CI/CD',
        priority: 'media',
        agents: ['a3'],
      },
      {
        id: 't3',
        title: 'Documentar API',
        priority: 'baja',
        agents: [],
      },
    ],
    color: '#ff6b6b',
  },
  {
    id: 'wip',
    title: 'En progreso',
    tasks: [
      {
        id: 't4',
        title: 'Implementar login',
        description: 'Autenticación con JWT',
        priority: 'alta',
        agents: ['a1'],
      },
      {
        id: 't5',
        title: 'Crear componentes UI',
        priority: 'alta',
        agents: ['a2', 'a3'],
      },
    ],
    color: '#ffd93d',
  },
  {
    id: 'done',
    title: 'Terminado',
    tasks: [
      {
        id: 't6',
        title: 'Repo inicial',
        priority: 'media',
        agents: ['a1'],
      },
    ],
    color: '#6bcb77',
  },
]
