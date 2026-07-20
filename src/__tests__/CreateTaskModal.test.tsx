import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AgentProvider } from '../context/AgentContext'
import CreateTaskModal from '../components/CreateTaskModal'

function renderWithProviders(ui: React.ReactElement) {
  return render(<AgentProvider>{ui}</AgentProvider>)
}

describe('CreateTaskModal', () => {
  it('renders Kanban fields without AI configuration', () => {
    renderWithProviders(<CreateTaskModal onClose={vi.fn()} onCreate={vi.fn()} />)
    expect(screen.getByPlaceholderText('¿Qué hay que hacer?')).toBeInTheDocument()
    expect(screen.getByText('Agente (opcional)')).toBeInTheDocument()
    expect(screen.getByText('Prioridad')).toBeInTheDocument()
    expect(screen.queryByText('Modelo')).not.toBeInTheDocument()
    expect(screen.queryByText('Contexto / Instrucciones')).not.toBeInTheDocument()
  })

  it('calls onCreate with base task fields on submit', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    renderWithProviders(<CreateTaskModal onClose={vi.fn()} onCreate={onCreate} />)

    await user.type(screen.getByPlaceholderText('¿Qué hay que hacer?'), 'Mi tarea')
    await user.type(screen.getByPlaceholderText('Detalles opcionales...'), 'Una descripción')
    await user.click(screen.getByText('Crear tarea'))

    expect(onCreate).toHaveBeenCalledWith('Mi tarea', 'Una descripción', '', 'media')
  })

  it('calls onClose when clicking close button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<CreateTaskModal onClose={onClose} onCreate={vi.fn()} />)

    await user.click(screen.getByText('✕'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
