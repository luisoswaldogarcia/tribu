import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import KanbanCard from '../components/KanbanCard'
import type { Task, Agent } from '../types'

const agents: Agent[] = [
  { id: 'a1', name: 'Zeref', avatar: '🧙', context: 'test' },
  { id: 'a2', name: 'PixelBot', avatar: '🤖', context: 'test' },
]

const task: Task = {
  id: 't1',
  title: 'Test task',
  description: 'A description',
  priority: 'alta',
  agents: ['a1', 'a2'],
}

describe('KanbanCard', () => {
  it('renders title and description', () => {
    render(<KanbanCard task={task} agents={agents} />)
    expect(screen.getByText('Test task')).toBeInTheDocument()
    expect(screen.getByText('A description')).toBeInTheDocument()
  })

  it('shows priority label', () => {
    render(<KanbanCard task={task} agents={agents} />)
    expect(screen.getByText('🔥 Alta')).toBeInTheDocument()
  })
})
