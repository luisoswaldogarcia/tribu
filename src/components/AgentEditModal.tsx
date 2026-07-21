import { useState, useEffect } from 'react'
import { useAgents } from '../context/AgentContext'
import { getPixelAvatar } from './PixelAvatar'
import Icon from './Icon'
import { AVATAR_POOL } from '../utils/avatarPool'
import type { Agent, AgentMode, AgentExecutor } from '../types'

interface Props {
  agent: Agent
  onClose: () => void
}

const modes: { value: AgentMode; label: string }[] = [
  { value: 'plan', label: 'Plan' },
  { value: 'executor', label: 'Executor' },
  { value: 'advisor', label: 'Advisor' },
]

const executors: { value: AgentExecutor; label: string }[] = [
  { value: 'opencode', label: 'OpenCode' },
  { value: 'kiro-cli', label: 'Kiro CLI' },
]

export default function AgentEditModal({ agent, onClose }: Props) {
  const { updateAgent } = useAgents()
  const [name, setName] = useState(agent.name)
  const [avatar, setAvatar] = useState(agent.avatar)
  const [defaultMode, setDefaultMode] = useState<AgentMode>(agent.defaultMode)
  const [executor, setExecutor] = useState<AgentExecutor>(agent.executor)
  const [model, setModel] = useState(agent.model || '')
  const [models, setModels] = useState<string[]>(['auto'])
  const [loadingModels, setLoadingModels] = useState(false)
  const [context, setContext] = useState(agent.context || '')

  // Load models when executor changes
  useEffect(() => {
    let cancelled = false
    setLoadingModels(true)
    setModels(['auto'])

    if (window.electronAPI?.getModels) {
      window.electronAPI.getModels(executor).then((result) => {
        if (!cancelled) {
          setModels(result.length > 0 ? result : ['auto'])
          setLoadingModels(false)
        }
      }).catch(() => {
        if (!cancelled) {
          setModels(['auto'])
          setLoadingModels(false)
        }
      })
    } else {
      setLoadingModels(false)
    }

    return () => { cancelled = true }
  }, [executor])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    updateAgent(agent.id, {
      name: trimmedName,
      avatar,
      defaultMode,
      executor,
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
          <button className="modal-close" onClick={onClose}><Icon name="close" size={14} /></button>
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
            Executor (CLI)
            <select value={executor} onChange={(e) => setExecutor(e.target.value as AgentExecutor)}>
              {executors.map((ex) => (
                <option key={ex.value} value={ex.value}>{ex.label}</option>
              ))}
            </select>
          </label>
          <label>
            Modo por defecto
            <select value={defaultMode} onChange={(e) => setDefaultMode(e.target.value as AgentMode)}>
              {modes.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </label>
          <label>
            Modelo
            <select value={model} onChange={(e) => setModel(e.target.value)} disabled={loadingModels}>
              {loadingModels ? (
                <option value="">Cargando modelos...</option>
              ) : (
                models.map((m) => (
                  <option key={m} value={m === 'auto' ? '' : m}>{m}</option>
                ))
              )}
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
          {agent.agentFile && (
            <div className="agent-file-info">
              Perfil: <code>{agent.agentFile}</code>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
