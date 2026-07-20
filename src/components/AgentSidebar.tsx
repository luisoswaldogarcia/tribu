import { useState, useEffect, useCallback } from 'react'
import type { Agent, AgentStatus, Column } from '../types'
import AgentSidebarItem from './AgentSidebarItem'

interface Props {
  agents: Agent[]
  columns: Column[]
  selectedAgentId: string | null
  onAgentClick: (id: string) => void
}

const STORAGE_KEY = 'tribu-sidebar-collapsed'
const BREAKPOINT = 768

const statusPriority: Record<AgentStatus, number> = {
  busy: 0,
  waiting_input: 1,
  active: 2,
  inactive: 3,
}

function sortAgents(agents: Agent[]): Agent[] {
  return [...agents].sort((a, b) => statusPriority[a.status] - statusPriority[b.status])
}

function getInitialCollapsed(): boolean {
  if (typeof window !== 'undefined' && window.innerWidth < BREAKPOINT) {
    return true
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'true'
  } catch {
    return false
  }
}

function getTaskTitle(agent: Agent, columns: Column[]): string | undefined {
  if (!agent.currentTaskId) return undefined
  for (const col of columns) {
    const task = col.tasks.find((t) => t.id === agent.currentTaskId)
    if (task) return task.title
  }
  return undefined
}

export default function AgentSidebar({ agents, columns, selectedAgentId, onAgentClick }: Props) {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < BREAKPOINT) {
        setCollapsed(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch { /* ignore */ }
      return next
    })
  }, [])

  const sorted = sortAgents(agents)
  const activeCount = agents.filter((a) => a.status !== 'inactive').length

  return (
    <aside className={`agent-sidebar${collapsed ? ' collapsed' : ''}`}>
      <button
        className="sidebar-toggle"
        onClick={toggleCollapsed}
        title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        type="button"
      >
        {collapsed ? '›' : '‹'}
      </button>
      <div className="sidebar-list">
        {sorted.map((agent) => (
          <AgentSidebarItem
            key={agent.id}
            agent={agent}
            collapsed={collapsed}
            taskTitle={getTaskTitle(agent, columns)}
            selected={selectedAgentId === agent.id}
            onClick={() => onAgentClick(agent.id)}
          />
        ))}
      </div>
      <div className="sidebar-footer">
        {collapsed
          ? <span>{activeCount}/{agents.length}</span>
          : <span>{activeCount} activos / {agents.length} total</span>
        }
      </div>
    </aside>
  )
}
