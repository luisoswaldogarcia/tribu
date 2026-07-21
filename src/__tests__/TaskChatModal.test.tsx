import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskChatModal from '../components/TaskChatModal'
import type { Agent, Task } from '../types'

const mockAgent: Agent = {
  id: 'a1',
  name: 'TestBot',
  avatar: '🤖',
  status: 'busy',
  defaultMode: 'executor',
  executor: 'opencode',
}

function buildTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Test Task',
    priority: 'media',
    agents: ['a1'],
    executionStatus: 'running',
    messages: [
      { role: 'agent', content: 'Starting work...', timestamp: '2026-07-20T01:00:00Z' },
      { role: 'user', content: 'Go ahead', timestamp: '2026-07-20T01:01:00Z' },
      { role: 'agent', content: 'Done!', timestamp: '2026-07-20T01:02:00Z' },
    ],
    ...overrides,
  }
}

describe('TaskChatModal', () => {
  it('renders task title and agent name', () => {
    render(<TaskChatModal task={buildTask()} agents={[mockAgent]} onClose={vi.fn()} onSendInput={vi.fn()} />)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getAllByText(/TestBot/).length).toBeGreaterThanOrEqual(1)
  })

  it('renders all messages with correct roles', () => {
    render(<TaskChatModal task={buildTask()} agents={[mockAgent]} onClose={vi.fn()} onSendInput={vi.fn()} />)
    expect(screen.getByText('Starting work...')).toBeInTheDocument()
    expect(screen.getByText('Go ahead')).toBeInTheDocument()
    expect(screen.getByText('Done!')).toBeInTheDocument()
  })

  it('shows agent messages with agent name label', () => {
    render(<TaskChatModal task={buildTask()} agents={[mockAgent]} onClose={vi.fn()} onSendInput={vi.fn()} />)
    const agentLabels = screen.getAllByText('TestBot')
    expect(agentLabels.length).toBeGreaterThanOrEqual(1)
  })

  it('shows user messages with "Tú" label', () => {
    render(<TaskChatModal task={buildTask()} agents={[mockAgent]} onClose={vi.fn()} onSendInput={vi.fn()} />)
    expect(screen.getByText('Tú')).toBeInTheDocument()
  })

  it('shows empty state when no messages', () => {
    render(<TaskChatModal task={buildTask({ messages: [] })} agents={[mockAgent]} onClose={vi.fn()} onSendInput={vi.fn()} />)
    expect(screen.getByText(/Sin mensajes/)).toBeInTheDocument()
  })

  it('shows typing indicator when running', () => {
    const { container } = render(<TaskChatModal task={buildTask({ executionStatus: 'running' })} agents={[mockAgent]} onClose={vi.fn()} onSendInput={vi.fn()} />)
    expect(container.querySelector('.chat-typing')).toBeInTheDocument()
  })

  it('does not show typing indicator when done', () => {
    const { container } = render(<TaskChatModal task={buildTask({ executionStatus: 'done' })} agents={[mockAgent]} onClose={vi.fn()} onSendInput={vi.fn()} />)
    expect(container.querySelector('.chat-typing')).not.toBeInTheDocument()
  })

  it('enables input when status is running', () => {
    render(<TaskChatModal task={buildTask({ executionStatus: 'running' })} agents={[mockAgent]} onClose={vi.fn()} onSendInput={vi.fn()} />)
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta...')
    expect(textarea).not.toBeDisabled()
  })

  it('enables input when status is hold (waiting_input)', () => {
    render(<TaskChatModal task={buildTask({ executionStatus: 'hold' })} agents={[mockAgent]} onClose={vi.fn()} onSendInput={vi.fn()} />)
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta...')
    expect(textarea).not.toBeDisabled()
  })

  it('shows placeholder for reactivation when status is done', () => {
    render(<TaskChatModal task={buildTask({ executionStatus: 'done' })} agents={[mockAgent]} onClose={vi.fn()} onSendInput={vi.fn()} />)
    const textarea = screen.getByPlaceholderText('Escribe para reactivar la tarea...')
    expect(textarea).not.toBeDisabled()
  })

  it('shows placeholder for reactivation when status is error', () => {
    render(<TaskChatModal task={buildTask({ executionStatus: 'error' })} agents={[mockAgent]} onClose={vi.fn()} onSendInput={vi.fn()} />)
    const textarea = screen.getByPlaceholderText('Escribe para reactivar la tarea...')
    expect(textarea).not.toBeDisabled()
  })

  it('shows status indicator', () => {
    render(<TaskChatModal task={buildTask({ executionStatus: 'hold' })} agents={[mockAgent]} onClose={vi.fn()} onSendInput={vi.fn()} />)
    expect(screen.getByText(/Esperando input/)).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn()
    render(<TaskChatModal task={buildTask()} agents={[mockAgent]} onClose={onClose} onSendInput={vi.fn()} />)
    document.querySelector('.modal-close')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onSendInput when send button clicked with text', async () => {
    const onSendInput = vi.fn()
    render(<TaskChatModal task={buildTask({ executionStatus: 'hold' })} agents={[mockAgent]} onClose={vi.fn()} onSendInput={onSendInput} />)
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta...')
    await userEvent.type(textarea, 'My response')
    screen.getByTitle('Enviar (Enter)').click()
    expect(onSendInput).toHaveBeenCalledWith('t1', 'My response')
  })

  it('clears textarea after sending', async () => {
    const onSendInput = vi.fn()
    render(<TaskChatModal task={buildTask({ executionStatus: 'hold' })} agents={[mockAgent]} onClose={vi.fn()} onSendInput={onSendInput} />)
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta...') as HTMLTextAreaElement
    await userEvent.type(textarea, 'My response')
    screen.getByTitle('Enviar (Enter)').click()
    expect(textarea.value).toBe('')
  })

  it('does not send when textarea is empty', () => {
    const onSendInput = vi.fn()
    render(<TaskChatModal task={buildTask({ executionStatus: 'hold' })} agents={[mockAgent]} onClose={vi.fn()} onSendInput={onSendInput} />)
    screen.getByTitle('Enviar (Enter)').click()
    expect(onSendInput).not.toHaveBeenCalled()
  })

  it('sends on Enter key press', async () => {
    const onSendInput = vi.fn()
    render(<TaskChatModal task={buildTask({ executionStatus: 'running' })} agents={[mockAgent]} onClose={vi.fn()} onSendInput={onSendInput} />)
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta...')
    await userEvent.type(textarea, 'Enter test')
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })
    expect(onSendInput).toHaveBeenCalledWith('t1', 'Enter test')
  })

  it('does not send on Shift+Enter (allows newline)', async () => {
    const onSendInput = vi.fn()
    render(<TaskChatModal task={buildTask({ executionStatus: 'running' })} agents={[mockAgent]} onClose={vi.fn()} onSendInput={onSendInput} />)
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta...')
    await userEvent.type(textarea, 'Line 1')
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })
    expect(onSendInput).not.toHaveBeenCalled()
  })
})
