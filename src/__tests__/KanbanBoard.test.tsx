import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import KanbanBoard from '../components/KanbanBoard'

describe('KanbanBoard', () => {
  it('renders three columns', () => {
    render(<KanbanBoard />)
    expect(screen.getByText('Por hacer')).toBeInTheDocument()
    expect(screen.getByText('En progreso')).toBeInTheDocument()
    expect(screen.getByText('Terminado')).toBeInTheDocument()
  })

  it('renders a FAB button', () => {
    render(<KanbanBoard />)
    expect(screen.getByText('+')).toBeInTheDocument()
  })
})
