import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AgentProvider, useAgents } from '../context/AgentContext'
import type { Agent } from '../types'

let lastCtx: ReturnType<typeof useAgents>

function TestConsumer({ onRender }: { onRender?: (ctx: ReturnType<typeof useAgents>) => void }) {
  const ctx = useAgents()
  lastCtx = ctx
  if (onRender) onRender(ctx)
  return (
    <div>
      <span data-testid="count">{ctx.agents.length}</span>
      {ctx.agents.map((a) => (
        <span key={a.id} data-testid={`agent-${a.id}`}>
          {a.name}|{a.status}|{a.defaultMode}
        </span>
      ))}
    </div>
  )
}

function renderCtx() {
  render(
    <AgentProvider>
      <TestConsumer />
    </AgentProvider>
  )
  return lastCtx
}

describe('AgentContext', () => {
  it('provides default agents', () => {
    renderCtx()
    expect(screen.getByTestId('count').textContent).toBe('3')
  })

  it('addAgent adds a new agent with generated id', () => {
    const ctx = renderCtx()
    act(() => ctx.addAgent({ name: 'New', avatar: '⭐', status: 'active', defaultMode: 'advisor' }))
    expect(screen.getByTestId('count').textContent).toBe('4')
    expect(screen.getByTestId('agent-a4').textContent).toBe('New|active|advisor')
  })

  it('removeAgent removes by id', () => {
    const ctx = renderCtx()
    act(() => ctx.removeAgent('a1'))
    expect(screen.getByTestId('count').textContent).toBe('2')
    expect(screen.queryByTestId('agent-a1')).toBeNull()
  })

  it('updateAgent updates partial fields', () => {
    const ctx = renderCtx()
    act(() => ctx.updateAgent('a1', { name: 'Updated', defaultMode: 'advisor' }))
    expect(screen.getByTestId('agent-a1').textContent).toBe('Updated|active|advisor')
  })

  it('duplicateAgent creates a copy with new id and "(copia)" suffix', () => {
    const ctx = renderCtx()
    act(() => ctx.duplicateAgent('a1'))
    expect(screen.getByTestId('count').textContent).toBe('4')
    const allAgents = lastCtx.agents
    const copy = allAgents.find((a) => a.name === 'Zeref (copia)')
    expect(copy).toBeDefined()
    expect(copy!.id).not.toBe('a1')
    expect(copy!.status).toBe('active')
    expect(copy!.currentTaskId).toBeUndefined()
  })

  it('duplicateAgent does nothing for non-existent id', () => {
    const ctx = renderCtx()
    act(() => ctx.duplicateAgent('nonexistent'))
    expect(screen.getByTestId('count').textContent).toBe('3')
  })

  it('toggleAgentStatus toggles active to inactive', () => {
    const ctx = renderCtx()
    act(() => ctx.toggleAgentStatus('a1'))
    expect(screen.getByTestId('agent-a1').textContent).toBe('Zeref|inactive|executor')
  })

  it('toggleAgentStatus toggles inactive back to active', () => {
    const ctx = renderCtx()
    act(() => ctx.toggleAgentStatus('a1')) // active → inactive
    act(() => ctx.toggleAgentStatus('a1')) // inactive → active
    expect(screen.getByTestId('agent-a1').textContent).toBe('Zeref|active|executor')
  })

  it('toggleAgentStatus does NOT change busy status', () => {
    const ctx = renderCtx()
    act(() => ctx.updateAgent('a1', { status: 'busy' }))
    act(() => ctx.toggleAgentStatus('a1'))
    expect(screen.getByTestId('agent-a1').textContent).toBe('Zeref|busy|executor')
  })

  it('toggleAgentStatus does NOT change waiting_input status', () => {
    const ctx = renderCtx()
    act(() => ctx.updateAgent('a1', { status: 'waiting_input' }))
    act(() => ctx.toggleAgentStatus('a1'))
    expect(screen.getByTestId('agent-a1').textContent).toBe('Zeref|waiting_input|executor')
  })

  it('setAgentMode changes the defaultMode', () => {
    const ctx = renderCtx()
    act(() => ctx.setAgentMode('a1', 'plan'))
    expect(screen.getByTestId('agent-a1').textContent).toBe('Zeref|active|plan')
  })

  it('setPersistedAgents replaces agents and updates counter', () => {
    const loaded: Agent[] = [
      { id: 'a10', name: 'Loaded', avatar: '🌈', status: 'active', defaultMode: 'plan' },
    ]
    const ctx = renderCtx()
    act(() => ctx.setPersistedAgents(loaded))
    expect(screen.getByTestId('count').textContent).toBe('1')
    expect(screen.getByTestId('agent-a10').textContent).toBe('Loaded|active|plan')
  })

  it('setPersistedAgents ignores empty array', () => {
    const ctx = renderCtx()
    act(() => ctx.setPersistedAgents([]))
    expect(screen.getByTestId('count').textContent).toBe('3')
  })
})
