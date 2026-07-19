import { useState } from 'react'
import { useAgents } from '../context/AgentContext'
import { useModels } from '../context/ModelContext'

interface Props {
  onClose: () => void
}

const avatars = ['🧙', '🤖', '🦊', '🐉', '👾', '🧝', '🧞', '🐱', '🦉', '⭐', '🌈', '👑']

export default function AgentManager({ onClose }: Props) {
  const { agents, addAgent, removeAgent } = useAgents()
  const { models } = useModels()
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('🤖')
  const [model, setModel] = useState(models[0]?.id || '')
  const [context, setContext] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addAgent({ name: name.trim(), avatar, model, context: context.trim() })
    setName('')
    setAvatar('🤖')
    setModel(models[0]?.id || '')
    setContext('')
  }

  return (
    <div className="agent-panel">
      <div className="agent-panel-header">
        <h2>Agentes</h2>
        <button className="agent-panel-close" onClick={onClose}>✕</button>
      </div>

      <div className="agent-panel-list">
        {agents.map((agent) => (
          <div key={agent.id} className="agent-panel-item">
            <span className="agent-panel-avatar">{agent.avatar}</span>
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

      <form onSubmit={handleAdd} className="agent-panel-form">
        <h3>Agregar agente</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del agente"
          autoFocus
        />
        <div className="avatar-picker">
          {avatars.map((a) => (
            <button
              key={a}
              type="button"
              className={`avatar-option${avatar === a ? ' selected' : ''}`}
              onClick={() => setAvatar(a)}
            >
              {a}
            </button>
          ))}
        </div>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="¿Qué hace este agente?"
          rows={2}
        />
        <button type="submit" className="btn-primary">Agregar agente</button>
      </form>
    </div>
  )
}
