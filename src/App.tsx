import { useState, useCallback } from 'react'
import { AgentProvider } from './context/AgentContext'
import KanbanBoard from './components/KanbanBoard'
import AgentDetailView from './components/AgentDetailView'
import type { Column } from './types'

function Header({ onToggleAgents }: { onToggleAgents: () => void }) {
  return (
    <header>
      <button className="header-agent-btn" onClick={onToggleAgents} title="Gestionar agentes">👤</button>
      <span style={{ fontSize: 24 }}>📋</span>
      <h1>tribu</h1>
    </header>
  )
}

function App() {
  const [showAgents, setShowAgents] = useState(false)
  const [columns, setColumns] = useState<Column[]>([])

  const handleToggleAgents = useCallback(() => {
    setShowAgents((prev) => !prev)
  }, [])

  const handleColumnsChange = useCallback((cols: Column[]) => {
    setColumns(cols)
  }, [])

  return (
    <AgentProvider>
      <Header onToggleAgents={handleToggleAgents} />
      <div className="app-body">
        {showAgents && (
          <AgentDetailView
            onClose={() => setShowAgents(false)}
            columns={columns}
          />
        )}
        <KanbanBoard onColumnsChange={handleColumnsChange} />
      </div>
    </AgentProvider>
  )
}

export default App
