import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateAgentModal from '../components/CreateAgentModal'
import { AgentProvider } from '../context/AgentContext'

function renderModal(onClose = vi.fn()) {
  return render(
    <AgentProvider>
      <CreateAgentModal onClose={onClose} />
    </AgentProvider>
  )
}

describe('CreateAgentModal', () => {
  it('renders modal with title', () => {
    renderModal()
    expect(screen.getByRole('heading', { name: 'Agregar agente' })).toBeInTheDocument()
  })

  it('renders name input', () => {
    renderModal()
    expect(screen.getByPlaceholderText('Nombre del agente')).toBeInTheDocument()
  })

  it('renders mode selector with executor as default', () => {
    renderModal()
    expect(screen.getByDisplayValue('⚡ Executor')).toBeInTheDocument()
  })

  it('renders model selector with empty default', () => {
    renderModal()
    expect(screen.getByDisplayValue('Sin modelo asignado')).toBeInTheDocument()
  })

  it('renders context textarea', () => {
    renderModal()
    expect(screen.getByPlaceholderText('Instrucciones o contexto para el agente...')).toBeInTheDocument()
  })

  it('does not submit with empty name', async () => {
    const onClose = vi.fn()
    renderModal(onClose)
    await userEvent.click(screen.getByRole('button', { name: 'Agregar agente' }))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('submits and calls onClose with valid name', async () => {
    const onClose = vi.fn()
    renderModal(onClose)
    await userEvent.type(screen.getByPlaceholderText('Nombre del agente'), 'NuevoBot')
    await userEvent.click(screen.getByRole('button', { name: 'Agregar agente' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn()
    renderModal(onClose)
    await userEvent.click(screen.getByText('Cancelar'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders all mode options', () => {
    renderModal()
    expect(screen.getByText('📐 Plan')).toBeInTheDocument()
    expect(screen.getByText('⚡ Executor')).toBeInTheDocument()
    expect(screen.getByText('💡 Advisor')).toBeInTheDocument()
  })

  it('renders all model options', () => {
    renderModal()
    expect(screen.getByText('deepseek')).toBeInTheDocument()
    expect(screen.getByText('claude')).toBeInTheDocument()
    expect(screen.getByText('gpt-4o')).toBeInTheDocument()
  })
})
