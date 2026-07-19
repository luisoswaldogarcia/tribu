import { useState } from 'react'
import { AgentProvider } from './context/AgentContext'
import { ModelProvider } from './context/ModelContext'
import KanbanBoard from './components/KanbanBoard'
import AgentManager from './components/AgentManager'

function App() {
  const [showAgents, setShowAgents] = useState(false)

  return (
    <AgentProvider>
      <ModelProvider>
        <header>
          <button
            className={`header-agent-btn${showAgents ? ' active' : ''}`}
            onClick={() => setShowAgents((v) => !v)}
            title="Gestionar agentes"
          >
            👤
          </button>
          <span style={{ fontSize: 24 }}>📋</span>
          <h1>tribu</h1>
        </header>
        <div className="app-body">
          {showAgents && <AgentManager onClose={() => setShowAgents(false)} />}
          <KanbanBoard />
        </div>
      </ModelProvider>
    </AgentProvider>
  )
}

export default App
