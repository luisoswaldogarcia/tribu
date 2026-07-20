import { useState } from 'react'
import { useAgents } from '../context/AgentContext'
import { getPixelAvatar } from './PixelAvatar'
import { AVATAR_POOL } from '../utils/avatarPool'
import { generateAgentName } from '../utils/nameGenerator'
import { randomAvatar } from '../utils/randomAvatar'
import type { AgentMode } from '../types'

interface Props {
  onClose: () => void
}

const models = ['deepseek', 'claude', 'gpt-4o', 'gemini', 'llama']
const modes: { value: AgentMode; label: string }[] = [
  { value: 'plan', label: '📐 Plan' },
  { value: 'executor', label: '⚡ Executor' },
  { value: 'advisor', label: '💡 Advisor' },
]

export default function CreateAgentModal({ onClose }: Props) {
  const { agents, addAgent } = useAgents()

  const [name, setName] = useState(() =>
    generateAgentName(agents.map((a) => a.name))
  )
  const [avatar, setAvatar] = useState(() =>
    randomAvatar(agents.map((a) => a.avatar))
  )
  const [defaultMode, setDefaultMode] = useState<AgentMode>('executor')
  const [model, setModel] = useState('')
  const [context, setContext] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    addAgent({
      name: trimmedName,
      avatar,
      status: 'active',
      defaultMode,
      model: model || undefined,
      context: context.trim() || undefined,
    })
    window.electronAPI?.notify('👤 Tribu - Nuevo agente', `"${trimmedName}" se unió a la tribu`)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Agregar agente</h2>
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
            {AVATAR_POOL.map((option) => (
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
            <button type="submit" className="btn-primary">Agregar agente</button>
          </div>
        </form>
      </div>
    </div>
  )
}
