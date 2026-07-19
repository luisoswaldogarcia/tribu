import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import KanbanBoard from '../components/KanbanBoard'
import { AgentProvider } from '../context/AgentContext'

function renderWithProviders(ui: React.ReactElement) {
  return render(<AgentProvider>{ui}</AgentProvider>)
}

describe('KanbanBoard', () => {
  it('renders three columns', () => {
    renderWithProviders(<KanbanBoard />)
    expect(screen.getByText('Por hacer')).toBeInTheDocument()
    expect(screen.getByText('En progreso')).toBeInTheDocument()
    expect(screen.getByText('Terminado')).toBeInTheDocument()
  })

  it('renders FAB buttons', () => {
    renderWithProviders(<KanbanBoard />)
    const fabs = screen.getAllByRole('button')
    const fabTitles = fabs.map((b) => b.getAttribute('title'))
    expect(fabTitles).toContain('Nueva tarea')
    expect(fabTitles).toContain('Agregar agente')
  })
})
