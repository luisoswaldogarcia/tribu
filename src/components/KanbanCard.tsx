import { getPixelAvatar } from './PixelAvatar'
import type { Agent, Task } from '../types'

interface Props {
  task: Task
  agents: Agent[]
  highlightAgentId?: string | null
}

const priorityLabels: Record<string, string> = {
  alta: '🔥 Alta',
  media: '📋 Media',
  baja: '🟢 Baja',
}

export default function KanbanCard({ task, agents, highlightAgentId }: Props) {
  const taskAgents = agents.filter((agent) => task.agents.includes(agent.id))
  const isHighlighted = highlightAgentId ? task.agents.includes(highlightAgentId) : false

  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('text/task-id', task.id)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className={`card${isHighlighted ? ' card-highlighted' : ''}`} draggable onDragStart={handleDragStart}>
      <div className="card-title">{task.title}</div>
      {task.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{task.description}</div>}
      {task.holdReason && <div className="card-hold-reason">⏸ {task.holdReason}</div>}
      <div className="card-footer">
        <span className={`card-priority priority-${task.priority}`}>{priorityLabels[task.priority]}</span>
        <span style={{ flex: 1 }} />
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
