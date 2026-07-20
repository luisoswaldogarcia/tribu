import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import KanbanCard from '../components/KanbanCard'
import type { Task, Agent } from '../types'

const agents: Agent[] = [
  { id: 'a1', name: 'Zeref', avatar: '🧙', status: 'active', defaultMode: 'executor' },
  { id: 'a2', name: 'PixelBot', avatar: '🤖', status: 'active', defaultMode: 'executor' },
]

const task: Task = {
  id: 't1',
  title: 'Test task',
  description: 'A description',
  priority: 'alta',
  agents: ['a1', 'a2'],
}

describe('KanbanCard', () => {
  it('renders title, description and priority', () => {
    render(<KanbanCard task={task} agents={agents} />)
    expect(screen.getByText('Test task')).toBeInTheDocument()
    expect(screen.getByText('A description')).toBeInTheDocument()
    expect(screen.getByText('🔥 Alta')).toBeInTheDocument()
  })

  it('renders assigned agents without execution controls', () => {
    render(<KanbanCard task={task} agents={agents} />)
    expect(screen.getByTitle('Zeref')).toBeInTheDocument()
    expect(screen.getByTitle('PixelBot')).toBeInTheDocument()
    expect(screen.queryByText('Ejecutar')).not.toBeInTheDocument()
    expect(screen.queryByText('Chat')).not.toBeInTheDocument()
  })
})
