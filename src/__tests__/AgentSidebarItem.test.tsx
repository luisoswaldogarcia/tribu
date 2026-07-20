import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AgentSidebarItem from '../components/AgentSidebarItem'
import type { Agent } from '../types'

const baseAgent: Agent = {
  id: 'a1',
  name: 'Zeref',
  avatar: '🧙',
  status: 'active',
  defaultMode: 'executor',
  model: 'claude',
}

describe('AgentSidebarItem', () => {
  it('renders agent name when expanded', () => {
    render(<AgentSidebarItem agent={baseAgent} collapsed={false} selected={false} onClick={vi.fn()} />)
    expect(screen.getByText('Zeref')).toBeInTheDocument()
  })

  it('does not render agent name when collapsed', () => {
    render(<AgentSidebarItem agent={baseAgent} collapsed={true} selected={false} onClick={vi.fn()} />)
    expect(screen.queryByText('Zeref')).not.toBeInTheDocument()
  })

  it('renders task title when expanded and taskTitle is provided', () => {
    render(<AgentSidebarItem agent={baseAgent} collapsed={false} taskTitle="Implementar login" selected={false} onClick={vi.fn()} />)
    expect(screen.getByText('Implementar login')).toBeInTheDocument()
  })

  it('does not render task title when collapsed', () => {
    render(<AgentSidebarItem agent={baseAgent} collapsed={true} taskTitle="Implementar login" selected={false} onClick={vi.fn()} />)
    expect(screen.queryByText('Implementar login')).not.toBeInTheDocument()
  })

  it('applies pulse class for waiting_input status', () => {
    const agent: Agent = { ...baseAgent, status: 'waiting_input' }
    const { container } = render(<AgentSidebarItem agent={agent} collapsed={false} selected={false} onClick={vi.fn()} />)
    const dot = container.querySelector('.status-dot.waiting_input')
    expect(dot).toBeInTheDocument()
  })

  it('applies active class for active status', () => {
    const { container } = render(<AgentSidebarItem agent={baseAgent} collapsed={false} selected={false} onClick={vi.fn()} />)
    const dot = container.querySelector('.status-dot.active')
    expect(dot).toBeInTheDocument()
  })

  it('applies busy class for busy status', () => {
    const agent: Agent = { ...baseAgent, status: 'busy' }
    const { container } = render(<AgentSidebarItem agent={agent} collapsed={false} selected={false} onClick={vi.fn()} />)
    const dot = container.querySelector('.status-dot.busy')
    expect(dot).toBeInTheDocument()
  })

  it('applies inactive class for inactive status', () => {
    const agent: Agent = { ...baseAgent, status: 'inactive' }
    const { container } = render(<AgentSidebarItem agent={agent} collapsed={false} selected={false} onClick={vi.fn()} />)
    const dot = container.querySelector('.status-dot.inactive')
    expect(dot).toBeInTheDocument()
  })

  it('applies selected class when selected', () => {
    const { container } = render(<AgentSidebarItem agent={baseAgent} collapsed={false} selected={true} onClick={vi.fn()} />)
    const item = container.querySelector('.sidebar-item-selected')
    expect(item).toBeInTheDocument()
  })

  it('does not apply selected class when not selected', () => {
    const { container } = render(<AgentSidebarItem agent={baseAgent} collapsed={false} selected={false} onClick={vi.fn()} />)
    const item = container.querySelector('.sidebar-item-selected')
    expect(item).not.toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<AgentSidebarItem agent={baseAgent} collapsed={false} selected={false} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders tooltip with agent info', () => {
    render(<AgentSidebarItem agent={baseAgent} collapsed={false} selected={false} onClick={vi.fn()} />)
    const button = screen.getByRole('button')
    expect(button.title).toContain('Zeref')
    expect(button.title).toContain('Activo')
    expect(button.title).toContain('Executor')
    expect(button.title).toContain('claude')
  })

  it('includes task in tooltip when taskTitle provided', () => {
    render(<AgentSidebarItem agent={baseAgent} collapsed={false} taskTitle="Fix bugs" selected={false} onClick={vi.fn()} />)
    const button = screen.getByRole('button')
    expect(button.title).toContain('Fix bugs')
  })

  it('applies collapsed class when collapsed', () => {
    const { container } = render(<AgentSidebarItem agent={baseAgent} collapsed={true} selected={false} onClick={vi.fn()} />)
    const item = container.querySelector('.sidebar-item-collapsed')
    expect(item).toBeInTheDocument()
  })
})
