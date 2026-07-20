import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Agent, AgentMode } from '../types'
import { defaultAgents, normalizeAgents } from '../data'

interface AgentContextValue {
  agents: Agent[]
  addAgent: (agent: Omit<Agent, 'id'>) => void
  removeAgent: (id: string) => void
  updateAgent: (id: string, partial: Partial<Omit<Agent, 'id'>>) => void
  duplicateAgent: (id: string) => void
  toggleAgentStatus: (id: string) => void
  setAgentMode: (id: string, mode: AgentMode) => void
  setPersistedAgents: (agents: Agent[]) => void
}

const AgentContext = createContext<AgentContextValue | null>(null)

let agentCounter = 4

function generateAgentId(): string {
  return 'a' + (agentCounter++).toString()
}

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>(defaultAgents)

  const addAgent = useCallback((data: Omit<Agent, 'id'>) => {
    const newAgent: Agent = { id: generateAgentId(), ...data }
    setAgents((prev) => [...prev, newAgent])
  }, [])

  const removeAgent = useCallback((id: string) => {
    setAgents((prev) => prev.filter((agent) => agent.id !== id))
  }, [])

  const updateAgent = useCallback((id: string, partial: Partial<Omit<Agent, 'id'>>) => {
    setAgents((prev) => prev.map((agent) =>
      agent.id === id ? { ...agent, ...partial } : agent
    ))
  }, [])

  const duplicateAgent = useCallback((id: string) => {
    setAgents((prev) => {
      const source = prev.find((agent) => agent.id === id)
      if (!source) return prev
      const copy: Agent = {
        ...source,
        id: generateAgentId(),
        name: source.name + ' (copia)',
        currentTaskId: undefined,
        status: 'active',
      }
      return [...prev, copy]
    })
  }, [])

  const toggleAgentStatus = useCallback((id: string) => {
    setAgents((prev) => prev.map((agent) => {
      if (agent.id !== id) return agent
      if (agent.status === 'busy' || agent.status === 'waiting_input') return agent
      return { ...agent, status: agent.status === 'active' ? 'inactive' : 'active' }
    }))
  }, [])

  const setAgentMode = useCallback((id: string, mode: AgentMode) => {
    setAgents((prev) => prev.map((agent) =>
      agent.id === id ? { ...agent, defaultMode: mode } : agent
    ))
  }, [])

  const setPersistedAgents = useCallback((loaded: Agent[]) => {
    const cleaned = normalizeAgents(loaded)
    if (cleaned.length === 0) return
    const maxId = cleaned.reduce((max, agent) => {
      const num = parseInt(agent.id.replace('a', ''), 10)
      return Number.isNaN(num) ? max : Math.max(num, max)
    }, 0)
    agentCounter = maxId + 1
    setAgents(cleaned)
  }, [])

  return (
    <AgentContext.Provider value={{ agents, addAgent, removeAgent, updateAgent, duplicateAgent, toggleAgentStatus, setAgentMode, setPersistedAgents }}>
      {children}
    </AgentContext.Provider>
  )
}

// oxlint-disable-next-line react/only-export-components
export function useAgents() {
  const ctx = useContext(AgentContext)
  if (!ctx) throw new Error('useAgents must be used inside AgentProvider')
  return ctx
}
