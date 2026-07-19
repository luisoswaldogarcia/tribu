import { AgentProvider } from './context/AgentContext'
import KanbanBoard from './components/KanbanBoard'

function App() {
  return (
    <AgentProvider>
      <header>
        <span style={{ fontSize: 24 }}>📋</span>
        <h1>tribu</h1>
      </header>
      <KanbanBoard />
    </AgentProvider>
  )
}

export default App
