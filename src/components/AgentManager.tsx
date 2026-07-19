import { useAgents } from '../context/AgentContext'
import { getPixelAvatar } from './PixelAvatar'

interface Props {
  onClose: () => void
}

export default function AgentManager({ onClose }: Props) {
  const { agents, removeAgent } = useAgents()

  return (
    <div className="agent-panel">
      <div className="agent-panel-header">
        <h2>Agentes</h2>
        <button className="agent-panel-close" onClick={onClose}>✕</button>
      </div>
      <div className="agent-panel-list">
        {agents.map((agent) => (
          <div key={agent.id} className="agent-panel-item">
            <span className="agent-panel-avatar">
              {getPixelAvatar(agent.avatar)}
            </span>
            <div className="agent-panel-info">
              <strong>{agent.name}</strong>
              <span className="agent-panel-model">{agent.model}</span>
              <span className="agent-panel-context">{agent.context}</span>
            </div>
            <button
              className="agent-remove-btn"
              onClick={() => removeAgent(agent.id)}
              title="Eliminar agente"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
