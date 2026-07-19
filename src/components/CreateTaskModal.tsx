import { useState } from 'react'
import { agents as allAgents, opencodeModels } from '../data'

interface Props {
  onClose: () => void
  onCreate: (title: string, description: string, agentId: string, model: string, context: string) => void
}

export default function CreateTaskModal({ onClose, onCreate }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState(allAgents[0]?.id || '')
  const [model, setModel] = useState(opencodeModels[0]?.id || '')
  const [context, setContext] = useState(allAgents[0]?.context || '')

  const handleAgentChange = (id: string) => {
    setSelectedAgentId(id)
    const agent = allAgents.find((a) => a.id === id)
    if (agent) {
      setContext(agent.context)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !selectedAgentId) return
    onCreate(title.trim(), description.trim(), selectedAgentId, model, context)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nueva tarea</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            Título
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Qué hay que hacer?"
              autoFocus
            />
          </label>
          <label>
            Descripción
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles opcionales..."
              rows={3}
            />
          </label>
          <label>
            Agente
            <select
              value={selectedAgentId}
              onChange={(e) => handleAgentChange(e.target.value)}
            >
              {allAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.avatar} {agent.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Modelo
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {opencodeModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Contexto / Instrucciones
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="¿Qué instrucciones tiene este agente?"
              rows={2}
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Crear tarea
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
