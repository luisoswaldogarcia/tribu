import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup, act } from '@testing-library/react'
import KanbanBoard from '../components/KanbanBoard'
import { AgentProvider } from '../context/AgentContext'
import { eventBus } from '../events/EventBus'

function renderWithProviders(ui: React.ReactElement) {
  return render(<AgentProvider>{ui}</AgentProvider>)
}

afterEach(() => {
  eventBus.clear()
  cleanup()
})

describe('KanbanBoard', () => {
  it('renders four columns', () => {
    renderWithProviders(<KanbanBoard />)
    expect(screen.getByText('To Do')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('On Hold')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('renders only base Kanban actions', () => {
    renderWithProviders(<KanbanBoard />)
    const buttons = screen.getAllByRole('button')
    const titles = buttons.map((button) => button.getAttribute('title'))
    expect(titles).toContain('Nueva tarea')
    expect(titles).toContain('Agregar agente')
    expect(screen.queryByText('Chat')).not.toBeInTheDocument()
    expect(screen.queryByText('Ejecutar')).not.toBeInTheDocument()
  })

  it('applies a task-created event to the board', async () => {
    renderWithProviders(<KanbanBoard />)
    await act(async () => {
      eventBus.publish({
        type: 'task.created',
        task: { id: 'event-task', title: 'Tarea por evento', priority: 'baja', agents: [] },
        timestamp: new Date().toISOString(),
      })
    })
    await waitFor(() => expect(screen.getByText('Tarea por evento')).toBeInTheDocument())
  })
})
