import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import KanbanCard from '../components/KanbanCard'
import type { Task, Agent } from '../types'

const agents: Agent[] = [
  { id: 'a1', name: 'Zeref', avatar: '🧙', model: 'deepseek', context: 'test' },
  { id: 'a2', name: 'PixelBot', avatar: '🤖', model: 'gpt-4', context: 'test' },
]

const task: Task = {
  id: 't1',
  title: 'Test task',
  description: 'A description',
  priority: 'alta',
  agents: ['a1', 'a2'],
  createdBy: 'a1',
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

  it('shows creator with model', () => {
    render(<KanbanCard task={task} agents={agents} />)
    expect(screen.getByText(/Zeref.*deepseek/)).toBeInTheDocument()
  })
})
