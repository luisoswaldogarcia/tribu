import { useState, useEffect } from 'react'
import { useAgents } from '../context/AgentContext'
import { getPixelAvatar } from './PixelAvatar'
import Icon from './Icon'
import { AVATAR_POOL } from '../utils/avatarPool'
import { generateAgentName } from '../utils/nameGenerator'
import { randomAvatar } from '../utils/randomAvatar'
import type { AgentMode, AgentExecutor } from '../types'

interface Props {
  onClose: () => void
}

const modes: { value: AgentMode; label: string; description?: string }[] = [
  { value: 'plan', label: 'Plan', description: 'Genera planes y documentos' },
  { value: 'executor', label: 'Executor', description: 'Ejecuta tareas directamente' },
  { value: 'advisor', label: 'Advisor', description: 'Asesora sin ejecutar' },
  { value: 'orchestrator', label: 'Orchestrator', description: 'Descompone y delega tareas a otros agentes' },
]

const executors: { value: AgentExecutor; label: string }[] = [
  { value: 'opencode', label: 'OpenCode' },
  { value: 'kiro-cli', label: 'Kiro CLI' },
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
  const [executor, setExecutor] = useState<AgentExecutor>('opencode')
  const [model, setModel] = useState('')
  const [models, setModels] = useState<string[]>(['auto'])
  const [loadingModels, setLoadingModels] = useState(false)
  const [context, setContext] = useState('')
  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoadingModels(true)
    setModels(['auto'])
    setModel('')

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

  const handleGenerateAgent = async () => {
    if (!description.trim()) return
    setGenerating(true)
    setGenerateError('')

    const result = await window.electronAPI?.generateAgentFile(executor, description.trim(), defaultMode)
    setGenerating(false)

    if (result?.success && result.path) {
      const trimmedName = name.trim()
      if (!trimmedName) return
      addAgent({
        name: trimmedName,
        avatar,
        status: 'active',
        defaultMode,
        executor,
        model: model || undefined,
        context: context.trim() || undefined,
        agentFile: result.path,
      })
      window.electronAPI?.notify('👤 Tribu - Nuevo agente', `"${trimmedName}" se unió a la tribu con perfil generado`)
      onClose()
    } else {
      setGenerateError(result?.error || 'Error al generar el archivo del agente')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    addAgent({
      name: trimmedName,
      avatar,
      status: 'active',
      defaultMode,
      executor,
      model: model || undefined,
      context: context.trim() || undefined,
    })
    window.electronAPI?.notify('👤 Tribu - Nuevo agente', `"${trimmedName}" se unió a la tribu`)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Agregar agente</h2>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={14} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-two-col">
            {/* Left column: Identity */}
            <div className="modal-col">
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
              {defaultMode === 'orchestrator' && (
                <p className="mode-hint">Este agente descompondrá tareas y las delegará a agentes especializados. No ejecuta directamente.</p>
              )}
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
            </div>

            {/* Right column: Configuration */}
            <div className="modal-col">
              <label>
                Contexto / instrucciones (opcional)
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Instrucciones o contexto para el agente..."
                  rows={4}
                />
              </label>

              <fieldset className="agent-generation-fieldset">
                <legend>Generar perfil de agente (.md)</legend>
                <label>
                  Descripción de especialización
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej: Experto en React y TypeScript, se enfoca en componentes accesibles..."
                    rows={3}
                  />
                </label>
                {generateError && <div className="error-message">{generateError}</div>}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleGenerateAgent}
                  disabled={generating || !description.trim()}
                >
                  {generating ? 'Generando...' : 'Generar y crear agente'}
                </button>
              </fieldset>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Agregar sin perfil</button>
          </div>
        </form>
      </div>
    </div>
  )
}
