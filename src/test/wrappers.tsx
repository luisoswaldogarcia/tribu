import type { ReactNode } from 'react'
import { AgentProvider } from '../context/AgentContext'

export function withAgentProvider(children: ReactNode) {
  return <AgentProvider>{children}</AgentProvider>
}
