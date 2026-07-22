import { getPixelAvatar } from './PixelAvatar'
import Icon from './Icon'
import type { Agent, Task, TaskStatus } from '../types'

interface Props {
  task: Task
  agents: Agent[]
  highlightAgentId?: string | null
  columnId?: string
  subtaskProgress?: { completed: number; total: number }
  onExecute?: (taskId: string, agentId: string) => void
  onCancel?: (taskId: string) => void
  onOpenChat?: (taskId: string) => void
}

const priorityLabels: Record<string, { icon: string; label: string }> = {
  alta: { icon: 'flame', label: 'Alta' },
  media: { icon: 'list', label: 'Media' },
  baja: { icon: 'check', label: 'Baja' },
}

const statusIcons: Record<TaskStatus, string | null> = {
  idle: null,
  running: 'glow-pulse',
  done: 'check-circle',
  error: 'x-circle',
  hold: 'pause',
}

export default function KanbanCard({ task, agents, highlightAgentId, columnId, subtaskProgress, onExecute, onCancel, onOpenChat }: Props) {
  const taskAgents = agents.filter((agent) => task.agents.includes(agent.id))
  const isHighlighted = highlightAgentId ? task.agents.includes(highlightAgentId) : false
  const isRunning = task.executionStatus === 'running'
  const canExecute = columnId === 'todo' && task.agents.length > 0 && !isRunning
  const assignedAgent = taskAgents[0]
  const hasChat = (task.messages && task.messages.length > 0) || isRunning || task.executionStatus === 'hold' || task.executionStatus === 'done' || task.executionStatus === 'error' || !!task.parentId

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

  const handleClick = () => {
    if (onOpenChat && hasChat) {
      onOpenChat(task.id)
    }
  }

  return (
    <div className={`card${isHighlighted ? ' card-highlighted' : ''}${isRunning ? ' card-running' : ''}${hasChat ? ' card-clickable' : ''}`} draggable onDragStart={handleDragStart} onClick={handleClick}>
      <div className="card-title">
        {task.parentId && <span className="card-subtask-badge">Sub-tarea</span>}
        {task.executionStatus && statusIcons[task.executionStatus] && (
          <span className="card-status-indicator">
            <Icon name={statusIcons[task.executionStatus]!} size={14} />{' '}
          </span>
        )}
        {task.title}
        {hasChat && <span className="card-chat-badge" title="Ver chat"><Icon name="chat" size={12} /></span>}
        {subtaskProgress && <span className="card-subtask-progress">{subtaskProgress.completed}/{subtaskProgress.total} completadas</span>}
      </div>
      {task.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{task.description}</div>}
      {task.holdReason && (
        <div className="card-hold-reason">
          <Icon name="pause" size={12} /> {task.holdReason}
        </div>
      )}

      {/* Mini-streaming output preview */}
      {isRunning && task.outputPreview && (
        <div className="card-output-preview">
          <pre>{task.outputPreview}</pre>
        </div>
      )}

      <div className="card-footer">
        <span className={`card-priority priority-${task.priority}`}>
          <Icon name={priorityLabels[task.priority].icon} size={12} /> {priorityLabels[task.priority].label}
        </span>
        <span style={{ flex: 1 }} />

        {/* Execute / Cancel buttons */}
        {canExecute && (
          <button className="card-action-btn card-execute-btn" onClick={handleExecute} title="Ejecutar tarea">
            <Icon name="play" size={14} />
          </button>
        )}
        {isRunning && (
          <button className="card-action-btn card-cancel-btn" onClick={handleCancel} title="Cancelar ejecución">
            <Icon name="pause" size={14} />
          </button>
        )}

        {taskAgents.length > 0 && (
          <div className="card-agents">
            {taskAgents.map((agent) => (
              <div key={agent.id} className={`card-agent-avatar${isRunning ? ' avatar-busy' : ''}`} title={agent.name}>
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
