import { useState } from 'react'
import { useAgents } from '../context/AgentContext'
import { getPixelAvatar } from './PixelAvatar'
import AgentEditModal from './AgentEditModal'
import CreateAgentModal from './CreateAgentModal'
import type { Agent, AgentMode, Column } from '../types'

interface Props {
  onClose: () => void
  columns: Column[]
}

const statusLabels: Record<string, string> = {
  active: '🟢 Activo',
  inactive: '⚫ Inactivo',
  busy: '🟡 Ocupado',
  waiting_input: '🔴 Esperando',
}

const modeLabels: Record<string, string> = {
  plan: '📐 Plan',
  executor: '⚡ Executor',
  advisor: '💡 Advisor',
}

const modeOptions: AgentMode[] = ['plan', 'executor', 'advisor']

export default function AgentDetailView({ onClose, columns }: Props) {
  const { agents, removeAgent, toggleAgentStatus, duplicateAgent, setAgentMode } = useAgents()
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  function getTaskTitle(taskId?: string): string | null {
    if (!taskId) return null
    for (const col of columns) {
      const task = col.tasks.find((t) => t.id === taskId)
      if (task) return task.title
    }
    return null
  }

  return (
    <div className="agent-detail-view">
      <div className="agent-detail-header">
        <h2>Gestión de agentes</h2>
        <div className="agent-detail-header-actions">
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>+ Agregar agente</button>
          <button className="agent-detail-close" onClick={onClose} title="Cerrar">✕</button>
        </div>
      </div>
      <div className="agent-detail-table-wrapper">
        <table className="agent-detail-table">
          <thead>
            <tr>
              <th>Agente</th>
              <th>Estado</th>
              <th>Modo</th>
              <th>Modelo</th>
              <th>Tarea actual</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => {
              const taskTitle = getTaskTitle(agent.currentTaskId)
              return (
                <tr key={agent.id} className={agent.status === 'inactive' ? 'agent-row-inactive' : ''}>
                  <td className="agent-detail-name-cell">
                    <span className="agent-detail-avatar">{getPixelAvatar(agent.avatar)}</span>
                    <strong>{agent.name}</strong>
                  </td>
                  <td>{statusLabels[agent.status]}</td>
                  <td>
                    <select
                      value={agent.defaultMode}
                      onChange={(e) => setAgentMode(agent.id, e.target.value as AgentMode)}
                      className="agent-mode-select"
                    >
                      {modeOptions.map((m) => (
                        <option key={m} value={m}>{modeLabels[m]}</option>
                      ))}
                    </select>
                  </td>
                  <td>{agent.model || '—'}</td>
                  <td className="agent-detail-task-cell">{taskTitle || '—'}</td>
                  <td className="agent-detail-actions-cell">
                    <button onClick={() => setEditingAgent(agent)} title="Editar">✏️</button>
                    <button onClick={() => duplicateAgent(agent.id)} title="Duplicar">📋</button>
                    <button
                      onClick={() => toggleAgentStatus(agent.id)}
                      disabled={agent.status === 'busy' || agent.status === 'waiting_input'}
                      title={agent.status === 'active' ? 'Desactivar' : 'Activar'}
                    >
                      {agent.status === 'active' ? '⏸' : '▶'}
                    </button>
                    <button onClick={() => removeAgent(agent.id)} title="Eliminar" className="agent-delete-btn">🗑️</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {editingAgent && <AgentEditModal agent={editingAgent} onClose={() => setEditingAgent(null)} />}
      {showCreateModal && <CreateAgentModal onClose={() => setShowCreateModal(false)} />}
    </div>
  )
}
