import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AgentProvider } from '../context/AgentContext'
import { ModelProvider } from '../context/ModelContext'
import CreateTaskModal from '../components/CreateTaskModal'

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <AgentProvider>
      <ModelProvider>{ui}</ModelProvider>
    </AgentProvider>,
  )
}

describe('CreateTaskModal', () => {
  it('renders all fields', () => {
    renderWithProviders(<CreateTaskModal onClose={vi.fn()} onCreate={vi.fn()} />)
    expect(screen.getByPlaceholderText('¿Qué hay que hacer?')).toBeInTheDocument()
    expect(screen.getByText('Agente')).toBeInTheDocument()
    expect(screen.getByText('Modelo')).toBeInTheDocument()
    expect(screen.getByText('Contexto / Instrucciones')).toBeInTheDocument()
  })

  it('does not show prioridad or creado por', () => {
    renderWithProviders(<CreateTaskModal onClose={vi.fn()} onCreate={vi.fn()} />)
    expect(screen.queryByText('Prioridad')).not.toBeInTheDocument()
    expect(screen.queryByText('Creado por')).not.toBeInTheDocument()
  })

  it('calls onCreate with all fields on submit', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    renderWithProviders(<CreateTaskModal onClose={vi.fn()} onCreate={onCreate} />)

    await user.type(screen.getByPlaceholderText('¿Qué hay que hacer?'), 'Mi tarea')
    await user.type(screen.getByPlaceholderText('Detalles opcionales...'), 'Una descripción')
    await user.click(screen.getByText('Crear tarea'))

    expect(onCreate).toHaveBeenCalledWith(
      'Mi tarea',
      'Una descripción',
      expect.any(String),
      expect.any(String),
      expect.any(String),
    )
  })

  it('calls onClose when clicking close button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<CreateTaskModal onClose={onClose} onCreate={vi.fn()} />)

    await user.click(screen.getByText('✕'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
