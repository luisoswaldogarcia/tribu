import { AgentProvider } from './context/AgentContext'
import { ModelProvider } from './context/ModelContext'
import KanbanBoard from './components/KanbanBoard'

function App() {
  return (
    <AgentProvider>
      <ModelProvider>
        <header>
          <span style={{ fontSize: 24 }}>📋</span>
          <h1>tribu</h1>
        </header>
        <KanbanBoard />
      </ModelProvider>
    </AgentProvider>
  )
}

export default App
