import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Agent } from '../types'
import { defaultAgents } from '../data'

interface AgentContextValue {
  agents: Agent[]
  addAgent: (agent: Omit<Agent, 'id'>) => void
  removeAgent: (id: string) => void
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
    setAgents((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const setPersistedAgents = useCallback((loaded: Agent[]) => {
    if (loaded.length > 0) {
      const maxId = loaded.reduce((max, a) => {
        const num = parseInt(a.id.replace('a', ''), 10)
        return num > max ? num : max
      }, 0)
      agentCounter = maxId + 1
      setAgents(loaded)
    }
  }, [])

  return (
    <AgentContext.Provider value={{ agents, addAgent, removeAgent, setPersistedAgents }}>
      {children}
    </AgentContext.Provider>
  )
}

export function useAgents() {
  const ctx = useContext(AgentContext)
  if (!ctx) throw new Error('useAgents must be used inside AgentProvider')
  return ctx
}
