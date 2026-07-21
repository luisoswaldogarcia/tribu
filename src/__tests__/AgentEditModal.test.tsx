import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AgentEditModal from '../components/AgentEditModal'
import { AgentProvider } from '../context/AgentContext'
import type { Agent } from '../types'

const agent: Agent = {
  id: 'a1',
  name: 'Zeref',
  avatar: '🧙',
  status: 'active',
  defaultMode: 'executor',
  executor: 'opencode',
  model: 'claude',
  context: 'Agente principal',
}

function renderModal(props?: { agent?: Agent; onClose?: () => void }) {
  const onClose = props?.onClose ?? vi.fn()
  return render(
    <AgentProvider>
      <AgentEditModal agent={props?.agent ?? agent} onClose={onClose} />
    </AgentProvider>
  )
}

describe('AgentEditModal', () => {
  it('renders with agent data pre-filled', () => {
    renderModal()
    expect(screen.getByDisplayValue('Zeref')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Agente principal')).toBeInTheDocument()
    expect(screen.getByDisplayValue('⚡ Executor')).toBeInTheDocument()
    expect(screen.getByDisplayValue('🔧 OpenCode')).toBeInTheDocument()
  })

  it('renders modal title', () => {
    renderModal()
    expect(screen.getByText('Editar agente')).toBeInTheDocument()
  })

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    await userEvent.click(screen.getByText('Cancelar'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when overlay is clicked', async () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    await userEvent.click(screen.getByText('Editar agente').closest('.modal-overlay')!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not submit with empty name', async () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    const input = screen.getByDisplayValue('Zeref')
    await userEvent.clear(input)
    await userEvent.click(screen.getByText('Guardar'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('submits and calls onClose with valid data', async () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    const input = screen.getByDisplayValue('Zeref')
    await userEvent.clear(input)
    await userEvent.type(input, 'Updated Name')
    await userEvent.click(screen.getByText('Guardar'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders mode selector with all options', () => {
    renderModal()
    expect(screen.getByText('📐 Plan')).toBeInTheDocument()
    expect(screen.getByText('⚡ Executor')).toBeInTheDocument()
    expect(screen.getByText('💡 Advisor')).toBeInTheDocument()
  })

  it('renders model selector with auto option when no API', () => {
    renderModal()
    expect(screen.getByText('auto')).toBeInTheDocument()
  })
})
