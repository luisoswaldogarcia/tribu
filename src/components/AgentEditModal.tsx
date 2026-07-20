import { useState } from 'react'
import { useAgents } from '../context/AgentContext'
import { getPixelAvatar } from './PixelAvatar'
import type { Agent, AgentMode } from '../types'

interface Props {
  agent: Agent
  onClose: () => void
}

const avatars = ['🧙', '🤖', '🦊', '🐉', '👾', '🧝', '🧞', '🐱', '🦉', '⭐', '🌈', '👑']
const models = ['deepseek', 'claude', 'gpt-4o', 'gemini', 'llama']
const modes: { value: AgentMode; label: string }[] = [
  { value: 'plan', label: '📐 Plan' },
  { value: 'executor', label: '⚡ Executor' },
  { value: 'advisor', label: '💡 Advisor' },
]

export default function AgentEditModal({ agent, onClose }: Props) {
  const { updateAgent } = useAgents()
  const [name, setName] = useState(agent.name)
  const [avatar, setAvatar] = useState(agent.avatar)
  const [defaultMode, setDefaultMode] = useState<AgentMode>(agent.defaultMode)
  const [model, setModel] = useState(agent.model || '')
  const [context, setContext] = useState(agent.context || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    updateAgent(agent.id, {
      name: trimmedName,
      avatar,
      defaultMode,
      model: model || undefined,
      context: context.trim() || undefined,
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar agente</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
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
          <div className="avatar-picker">
            {avatars.map((option) => (
              <button
                key={option}
                type="button"
                className={`avatar-option${avatar === option ? ' selected' : ''}`}
                onClick={() => setAvatar(option)}
              >
                <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getPixelAvatar(option)}
                </div>
              </button>
            ))}
          </div>
          <label>
            Modo por defecto
            <select value={defaultMode} onChange={(e) => setDefaultMode(e.target.value as AgentMode)}>
              {modes.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </label>
          <label>
            Modelo (opcional)
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="">Sin modelo asignado</option>
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <label>
            Contexto / instrucciones (opcional)
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Instrucciones o contexto para el agente..."
              rows={3}
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
