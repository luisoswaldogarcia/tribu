import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AgentSidebar from '../components/AgentSidebar'
import type { Agent, Column } from '../types'

const agents: Agent[] = [
  { id: 'a1', name: 'Zeref', avatar: '🧙', status: 'active', defaultMode: 'executor' },
  { id: 'a2', name: 'PixelBot', avatar: '🤖', status: 'busy', defaultMode: 'executor', currentTaskId: 't4' },
  { id: 'a3', name: 'Nyx', avatar: '🦊', status: 'inactive', defaultMode: 'plan' },
  { id: 'a4', name: 'Ghost', avatar: '👾', status: 'waiting_input', defaultMode: 'advisor' },
]

const columns: Column[] = [
  { id: 'wip', title: 'In Progress', tasks: [{ id: 't4', title: 'Implementar login', priority: 'alta', agents: ['a2'] }], color: '#ffd93d' },
]

const mockStorage: Record<string, string> = {}

beforeEach(() => {
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => { mockStorage[key] = value },
    removeItem: (key: string) => { delete mockStorage[key] },
    clear: () => { Object.keys(mockStorage).forEach((key) => delete mockStorage[key]) },
  })
  // Reset window width to desktop
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
})

function renderSidebar(props?: { selectedAgentId?: string | null; onAgentClick?: (id: string) => void }) {
  return render(
    <AgentSidebar
      agents={agents}
      columns={columns}
      selectedAgentId={props?.selectedAgentId ?? null}
      onAgentClick={props?.onAgentClick ?? vi.fn()}
    />
  )
}

describe('AgentSidebar', () => {
  it('renders all agents', () => {
    renderSidebar()
    expect(screen.getByText('Zeref')).toBeInTheDocument()
    expect(screen.getByText('PixelBot')).toBeInTheDocument()
    expect(screen.getByText('Nyx')).toBeInTheDocument()
    expect(screen.getByText('Ghost')).toBeInTheDocument()
  })

  it('sorts agents by status priority (busy/waiting first, inactive last)', () => {
    const { container } = renderSidebar()
    const names = Array.from(container.querySelectorAll('.sidebar-item-name')).map((el) => el.textContent)
    // busy=0, waiting_input=1, active=2, inactive=3
    expect(names).toEqual(['PixelBot', 'Ghost', 'Zeref', 'Nyx'])
  })

  it('shows task title for agent with currentTaskId', () => {
    renderSidebar()
    expect(screen.getByText('Implementar login')).toBeInTheDocument()
  })

  it('shows footer with active count', () => {
    renderSidebar()
    // 3 non-inactive (active + busy + waiting_input) / 4 total
    expect(screen.getByText('3 activos / 4 total')).toBeInTheDocument()
  })

  it('toggles collapsed state when toggle button clicked', async () => {
    const { container } = renderSidebar()
    const toggle = screen.getByTitle('Colapsar sidebar')
    expect(container.querySelector('.agent-sidebar.collapsed')).not.toBeInTheDocument()

    await userEvent.click(toggle)
    expect(container.querySelector('.agent-sidebar.collapsed')).toBeInTheDocument()
    expect(mockStorage['tribu-sidebar-collapsed']).toBe('true')
  })

  it('expands when collapsed and toggle clicked', async () => {
    mockStorage['tribu-sidebar-collapsed'] = 'true'
    const { container } = renderSidebar()
    expect(container.querySelector('.agent-sidebar.collapsed')).toBeInTheDocument()

    await userEvent.click(screen.getByTitle('Expandir sidebar'))
    expect(container.querySelector('.agent-sidebar.collapsed')).not.toBeInTheDocument()
    expect(mockStorage['tribu-sidebar-collapsed']).toBe('false')
  })

  it('starts collapsed on small screens', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 600 })
    const { container } = renderSidebar()
    expect(container.querySelector('.agent-sidebar.collapsed')).toBeInTheDocument()
  })

  it('calls onAgentClick when an agent is clicked', async () => {
    const onAgentClick = vi.fn()
    renderSidebar({ onAgentClick })
    await userEvent.click(screen.getByText('Zeref'))
    expect(onAgentClick).toHaveBeenCalledWith('a1')
  })

  it('shows collapsed footer format when collapsed', async () => {
    mockStorage['tribu-sidebar-collapsed'] = 'true'
    renderSidebar()
    expect(screen.getByText('3/4')).toBeInTheDocument()
  })

  it('renders toggle button with correct label', () => {
    renderSidebar()
    expect(screen.getByTitle('Colapsar sidebar')).toBeInTheDocument()
    expect(screen.getByText('‹')).toBeInTheDocument()
  })
})
