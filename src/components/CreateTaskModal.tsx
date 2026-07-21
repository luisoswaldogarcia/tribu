import { useState } from 'react'
import type { Priority } from '../types'
import { useAgents } from '../context/AgentContext'

interface Props {
  onClose: () => void
  onCreate: (title: string, description: string, agentId: string, priority: Priority, workingDir: string) => void
}

export default function CreateTaskModal({ onClose, onCreate }: Props) {
  const { agents } = useAgents()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [priority, setPriority] = useState<Priority>('media')
  const [workingDir, setWorkingDir] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onCreate(title.trim(), description.trim(), selectedAgentId, priority, workingDir.trim())
  }

  const handleSelectDirectory = async () => {
    const dir = await window.electronAPI?.selectDirectory()
    if (dir) setWorkingDir(dir)
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
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="¿Qué hay que hacer?" autoFocus />
          </label>
          <label>
            Descripción
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles opcionales..." rows={3} />
          </label>
          <label>
            Agente (opcional)
            <select value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)}>
              <option value="">Sin agente asignado</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.avatar} {agent.name} ({agent.executor})</option>
              ))}
            </select>
          </label>
          <label>
            Prioridad
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </label>
          <label>
            Directorio de trabajo
            <div className="input-with-button">
              <input
                type="text"
                value={workingDir}
                onChange={(e) => setWorkingDir(e.target.value)}
                placeholder="/ruta/al/proyecto"
              />
              <button type="button" className="btn-secondary btn-small" onClick={handleSelectDirectory}>
                📁
              </button>
            </div>
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Crear tarea</button>
          </div>
        </form>
      </div>
    </div>
  )
}
