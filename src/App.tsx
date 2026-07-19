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
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <rect x="8" y="6" width="16" height="16" fill="currentColor" rx="2" opacity="0.9"/>
              <rect x="11" y="11" width="3" height="3" fill="#1a1b23" rx="0.5"/>
              <rect x="18" y="11" width="3" height="3" fill="#1a1b23" rx="0.5"/>
              <rect x="13" y="17" width="6" height="2" fill="#1a1b23" rx="0.5"/>
              <rect x="10" y="22" width="12" height="8" fill="currentColor" rx="1" opacity="0.9"/>
            </svg>
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
