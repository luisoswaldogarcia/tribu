import type { Column, Agent } from './types'

export const agents: Agent[] = [
  { id: 'a1', name: 'Zeref', avatar: '🧙' },
  { id: 'a2', name: 'PixelBot', avatar: '🤖' },
  { id: 'a3', name: 'Nyx', avatar: '🦊' },
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
