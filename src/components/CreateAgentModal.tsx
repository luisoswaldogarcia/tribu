import { useState } from 'react'
import type { Executor } from '../types'
import { useAgents } from '../context/AgentContext'
import { useModels } from '../context/ModelContext'
import { getPixelAvatar } from './PixelAvatar'

interface Props {
  onClose: () => void
}

const avatars = ['🧙', '🤖', '🦊', '🐉', '👾', '🧝', '🧞', '🐱', '🦉', '⭐', '🌈', '👑']

export default function CreateAgentModal({ onClose }: Props) {
  const { addAgent } = useAgents()
  const { getModelsForExecutor } = useModels()
  const [executor, setExecutor] = useState<Executor>('opencode')
  const [models, setModels] = useState(getModelsForExecutor('opencode'))
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('🤖')
  const [model, setModel] = useState(models[0]?.id || '')
  const [context, setContext] = useState('')

  const handleExecutorChange = (e: Executor) => {
    setExecutor(e)
    const newModels = getModelsForExecutor(e)
    setModels(newModels)
    setModel(newModels[0]?.id || '')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addAgent({ name: name.trim(), avatar, model, context: context.trim(), executor })
    if (window.electronAPI) {
      window.electronAPI.notify('👤 Tribu - Nuevo agente', `"${name.trim()}" se unió a la tribu`)
    }
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
                <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getPixelAvatar(a)}
                </div>
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
          <label>Ejecutor</label>
          <div className="executor-picker">
            <button
              type="button"
              className={`executor-option${executor === 'opencode' ? ' selected' : ''}`}
              onClick={() => handleExecutorChange('opencode')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="4" width="16" height="16" fill="currentColor" rx="3"/>
                <rect x="8" y="8" width="8" height="8" fill="#1a1b23" rx="1"/>
              </svg>
              opencode CLI
            </button>
            <button
              type="button"
              className={`executor-option${executor === 'kiro-cli' ? ' selected' : ''}`}
              onClick={() => handleExecutorChange('kiro-cli')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="currentColor"/>
                <circle cx="12" cy="12" r="4" fill="#1a1b23"/>
              </svg>
              kiro-cli
            </button>
          </div>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="¿Qué hace este agente?"
            rows={2}
          />
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Agregar agente
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
