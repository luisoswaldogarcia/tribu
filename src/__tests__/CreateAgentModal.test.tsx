import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateAgentModal from '../components/CreateAgentModal'
import { AgentProvider } from '../context/AgentContext'
import { AVATAR_POOL } from '../utils/avatarPool'
import { prefixes } from '../utils/nameGenerator'

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

  it('renders name input with auto-generated fantasy name', () => {
    renderModal()
    const input = screen.getByPlaceholderText('Nombre del agente') as HTMLInputElement
    expect(input.value).toBeTruthy()
    expect(input.value.length).toBeGreaterThan(0)
    // Should start with a known prefix
    const hasPrefix = prefixes.some((p) => input.value.startsWith(p))
    expect(hasPrefix).toBe(true)
  })

  it('renders avatar picker with a pre-selected avatar', () => {
    renderModal()
    const selected = document.querySelector('.avatar-option.selected')
    expect(selected).not.toBeNull()
  })

  it('renders mode selector with executor as default', () => {
    renderModal()
    expect(screen.getByDisplayValue('⚡ Executor')).toBeInTheDocument()
  })

  it('renders executor selector with opencode as default', () => {
    renderModal()
    expect(screen.getByDisplayValue('🔧 OpenCode')).toBeInTheDocument()
  })

  it('renders model selector with auto option', () => {
    renderModal()
    expect(screen.getByText('auto')).toBeInTheDocument()
  })

  it('renders context textarea', () => {
    renderModal()
    expect(screen.getByPlaceholderText('Instrucciones o contexto para el agente...')).toBeInTheDocument()
  })

  it('renders description textarea for agent generation', () => {
    renderModal()
    expect(screen.getByPlaceholderText(/Experto en React/)).toBeInTheDocument()
  })

  it('does not submit when name is manually cleared', async () => {
    const onClose = vi.fn()
    renderModal(onClose)
    const input = screen.getByPlaceholderText('Nombre del agente') as HTMLInputElement
    await userEvent.clear(input)
    await userEvent.click(screen.getByRole('button', { name: 'Agregar sin perfil' }))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('submits directly with auto-generated name (no manual input needed)', async () => {
    const onClose = vi.fn()
    renderModal(onClose)
    await userEvent.click(screen.getByRole('button', { name: 'Agregar sin perfil' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('submits with user-overridden name', async () => {
    const onClose = vi.fn()
    renderModal(onClose)
    const input = screen.getByPlaceholderText('Nombre del agente')
    await userEvent.clear(input)
    await userEvent.type(input, 'MiAgente')
    await userEvent.click(screen.getByRole('button', { name: 'Agregar sin perfil' }))
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

  it('renders all avatar options from pool', () => {
    renderModal()
    const avatarButtons = document.querySelectorAll('.avatar-option')
    expect(avatarButtons.length).toBe(AVATAR_POOL.length)
  })
})
