import { useState } from 'react'
import { useAgents } from '../context/AgentContext'

interface Props {
  onClose: () => void
}

export default function AgentManager({ onClose }: Props) {
  const { agents, addAgent, removeAgent } = useAgents()
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('🤖')
  const [context, setContext] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addAgent({ name: name.trim(), avatar, context: context.trim() })
    setName('')
    setAvatar('🤖')
    setContext('')
  }

  const avatars = ['🧙', '🤖', '🦊', '🐉', '👾', '🧝', '🧞', '🐱', '🦉', '⭐', '🌈', '👑']

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Gestión de agentes</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="agent-list">
          {agents.map((agent) => (
            <div key={agent.id} className="agent-list-item">
              <span className="agent-list-avatar">{agent.avatar}</span>
              <div className="agent-list-info">
                <strong>{agent.name}</strong>
                <span className="agent-list-context">{agent.context}</span>
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

        <hr className="agent-divider" />

        <form onSubmit={handleAdd} className="agent-add-form">
          <h3>Agregar agente</h3>
          <label>
            Nombre
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del agente"
              autoFocus
            />
          </label>
          <label>
            Avatar
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
          </label>
          <label>
            Contexto
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="¿Qué hace este agente?"
              rows={2}
            />
          </label>
          <div className="modal-actions">
            <button type="submit" className="btn-primary">Agregar agente</button>
          </div>
        </form>
      </div>
    </div>
  )
}
