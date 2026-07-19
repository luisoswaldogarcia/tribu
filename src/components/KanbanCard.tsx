import { useCallback, useState } from 'react'
import type { Task, Agent } from '../types'

interface Props {
  task: Task
  agents: Agent[]
}

const priorityLabels: Record<string, string> = {
  alta: '🔥 Alta',
  media: '📋 Media',
  baja: '🟢 Baja',
}

export default function KanbanCard({ task, agents }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const taskAgents = agents.filter((a) => task.agents.includes(a.id))

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('text/task-id', task.id)
    e.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
  }, [task.id])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  return (
    <div
      className={`card${isDragging ? ' dragging' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="card-title">{task.title}</div>
      {task.description && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            marginBottom: 8,
          }}
        >
          {task.description}
        </div>
      )}
      <div className="card-footer">
        <span className={`card-priority priority-${task.priority}`}>
          {priorityLabels[task.priority]}
        </span>
        {taskAgents.length > 0 && (
          <div className="card-agents">
            {taskAgents.map((agent) => (
              <div
                key={agent.id}
                className="card-agent-avatar"
                style={{ background: '#2a2b38' }}
                title={`${agent.name}: ${agent.context}`}
              >
                {agent.avatar}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
