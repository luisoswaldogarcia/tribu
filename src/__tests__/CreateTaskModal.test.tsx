import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateTaskModal from '../components/CreateTaskModal'

describe('CreateTaskModal', () => {
  it('renders all fields', () => {
    render(<CreateTaskModal onClose={vi.fn()} onCreate={vi.fn()} />)
    expect(screen.getByPlaceholderText('¿Qué hay que hacer?')).toBeInTheDocument()
    expect(screen.getByText('Creado por')).toBeInTheDocument()
    expect(screen.getByText('Modelo')).toBeInTheDocument()
    expect(screen.getByText('Contexto / Instrucciones')).toBeInTheDocument()
    expect(screen.getByText('Prioridad')).toBeInTheDocument()
  })

  it('calls onCreate with all fields on submit', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<CreateTaskModal onClose={vi.fn()} onCreate={onCreate} />)

    await user.type(screen.getByPlaceholderText('¿Qué hay que hacer?'), 'Mi tarea')
    await user.type(screen.getByPlaceholderText('Detalles opcionales...'), 'Una descripción')
    await user.click(screen.getByText('Crear tarea'))

    expect(onCreate).toHaveBeenCalledWith(
      'Mi tarea',
      'Una descripción',
      'media',
      expect.any(String),
      expect.any(String),
      expect.any(String),
    )
  })

  it('calls onClose when clicking close button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<CreateTaskModal onClose={onClose} onCreate={vi.fn()} />)

    await user.click(screen.getByText('✕'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
