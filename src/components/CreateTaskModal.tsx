import { useState } from 'react'
import type { Priority } from '../types'

interface Props {
  onClose: () => void
  onCreate: (title: string, description: string, priority: Priority) => void
}

export default function CreateTaskModal({ onClose, onCreate }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('media')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onCreate(title.trim(), description.trim(), priority)
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
            Prioridad
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="alta">🔥 Alta</option>
              <option value="media">📋 Media</option>
              <option value="baja">🟢 Baja</option>
            </select>
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
