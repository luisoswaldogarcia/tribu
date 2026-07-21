import { getPixelAvatar } from './PixelAvatar'
import type { Agent, Task, TaskStatus } from '../types'

interface Props {
  task: Task
  agents: Agent[]
  highlightAgentId?: string | null
  columnId?: string
  onExecute?: (taskId: string, agentId: string) => void
  onCancel?: (taskId: string) => void
}

const priorityLabels: Record<string, string> = {
  alta: '🔥 Alta',
  media: '📋 Media',
  baja: '🟢 Baja',
}

const statusIndicators: Record<TaskStatus, string> = {
  idle: '',
  running: '⏳',
  done: '✅',
  error: '❌',
  hold: '⏸',
}

export default function KanbanCard({ task, agents, highlightAgentId, columnId, onExecute, onCancel }: Props) {
  const taskAgents = agents.filter((agent) => task.agents.includes(agent.id))
  const isHighlighted = highlightAgentId ? task.agents.includes(highlightAgentId) : false
  const isRunning = task.executionStatus === 'running'
  const canExecute = columnId === 'todo' && task.agents.length > 0 && !isRunning
  const assignedAgent = taskAgents[0]

  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('text/task-id', task.id)
    event.dataTransfer.effectAllowed = 'move'
  }

  const handleExecute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (assignedAgent && onExecute) {
      onExecute(task.id, assignedAgent.id)
    }
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onCancel) {
      onCancel(task.id)
    }
  }

  return (
    <div className={`card${isHighlighted ? ' card-highlighted' : ''}${isRunning ? ' card-running' : ''}`} draggable onDragStart={handleDragStart}>
      <div className="card-title">
        {task.executionStatus && statusIndicators[task.executionStatus] && (
          <span className="card-status-indicator">{statusIndicators[task.executionStatus]} </span>
        )}
        {task.title}
      </div>
      {task.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{task.description}</div>}
      {task.holdReason && <div className="card-hold-reason">⏸ {task.holdReason}</div>}

      {/* Mini-streaming output preview */}
      {isRunning && task.outputPreview && (
        <div className="card-output-preview">
          <pre>{task.outputPreview}</pre>
        </div>
      )}

      <div className="card-footer">
        <span className={`card-priority priority-${task.priority}`}>{priorityLabels[task.priority]}</span>
        <span style={{ flex: 1 }} />

        {/* Execute / Cancel buttons */}
        {canExecute && (
          <button className="card-action-btn card-execute-btn" onClick={handleExecute} title="Ejecutar tarea">
            ▶
          </button>
        )}
        {isRunning && (
          <button className="card-action-btn card-cancel-btn" onClick={handleCancel} title="Cancelar ejecución">
            ⏹
          </button>
        )}

        {taskAgents.length > 0 && (
          <div className="card-agents">
            {taskAgents.map((agent) => (
              <div key={agent.id} className="card-agent-avatar" title={agent.name}>
                <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getPixelAvatar(agent.avatar)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
