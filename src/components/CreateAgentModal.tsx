import { useState } from 'react'
import { useAgents } from '../context/AgentContext'
import { useModels } from '../context/ModelContext'
import { getPixelAvatar } from './PixelAvatar'

interface Props {
  onClose: () => void
}

const avatars = ['🧙', '🤖', '🦊', '🐉', '👾', '🧝', '🧞', '🐱', '🦉', '⭐', '🌈', '👑']

export default function CreateAgentModal({ onClose }: Props) {
  const { addAgent } = useAgents()
  const { models } = useModels()
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('🤖')
  const [model, setModel] = useState(models[0]?.id || '')
  const [context, setContext] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addAgent({ name: name.trim(), avatar, model, context: context.trim() })
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
