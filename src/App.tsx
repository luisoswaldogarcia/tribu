import { useState, useCallback } from 'react'
import { AgentProvider, useAgents } from './context/AgentContext'
import KanbanBoard from './components/KanbanBoard'
import AgentDetailView from './components/AgentDetailView'
import AgentSidebar from './components/AgentSidebar'
import Icon from './components/Icon'
import type { Column } from './types'

function Header({ onToggleAgents }: { onToggleAgents: () => void }) {
  return (
    <header>
      <button className="header-agent-btn" onClick={onToggleAgents} title="Gestionar agentes"><Icon name="robot" size={20} /></button>
      <Icon name="list" size={24} />
      <h1>tribu</h1>
    </header>
  )
}

function AppContent() {
  const { agents } = useAgents()
  const [showAgents, setShowAgents] = useState(false)
  const [columns, setColumns] = useState<Column[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  const handleToggleAgents = useCallback(() => {
    setShowAgents((prev) => !prev)
  }, [])

  const handleColumnsChange = useCallback((cols: Column[]) => {
    setColumns(cols)
  }, [])

  const handleAgentClick = useCallback((id: string) => {
    setSelectedAgentId((prev) => (prev === id ? null : id))
  }, [])

  return (
    <>
      <Header onToggleAgents={handleToggleAgents} />
      <div className="app-body">
        {showAgents && (
          <AgentDetailView
            onClose={() => setShowAgents(false)}
            columns={columns}
          />
        )}
        <AgentSidebar
          agents={agents}
          columns={columns}
          selectedAgentId={selectedAgentId}
          onAgentClick={handleAgentClick}
        />
        <KanbanBoard onColumnsChange={handleColumnsChange} highlightAgentId={selectedAgentId} />
      </div>
    </>
  )
}

function App() {
  return (
    <AgentProvider>
      <AppContent />
    </AgentProvider>
  )
}

export default App
