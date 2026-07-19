import { useCallback, useState } from 'react'
import type { Task, Agent } from '../types'
import { getPixelAvatar } from './PixelAvatar'

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
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState<string | null>(null)
  const taskAgents = agents.filter((a) => task.agents.includes(a.id))

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('text/task-id', task.id)
    e.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
  }, [task.id])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleExecute = useCallback(async () => {
    if (!window.electronAPI) return
    const agent = agents.find((a) => task.agents.includes(a.id))
    if (!agent) return

    setRunning(true)
    setOutput(null)

    const result = await window.electronAPI.executeTask({
      agentName: agent.name,
      model: agent.model,
      context: agent.context,
      taskTitle: task.title,
      taskDescription: task.description || '',
      executor: agent.executor || 'opencode',
    })

    setRunning(false)

    if (result.success) {
      setOutput(result.output || '✅ Tarea ejecutada (sin salida)')
    } else {
      setOutput(`❌ Error: ${result.error || 'Error desconocido'}`)
    }
  }, [task, agents])

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
        <button
          className="card-execute-btn"
          onClick={handleExecute}
          disabled={running}
          title={running ? 'Ejecutando...' : 'Ejecutar tarea'}
        >
          {running ? '⏳' : '▶'}
        </button>
        {taskAgents.length > 0 && (
          <div className="card-agents">
            {taskAgents.map((agent) => (
              <div
                key={agent.id}
                className="card-agent-avatar"
                title={`${agent.name} (${agent.executor || 'opencode'})`}
              >
                <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getPixelAvatar(agent.avatar)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {running && (
        <div className="card-running">
          <span>Ejecutando...</span>
        </div>
      )}
      {output && (
        <div className="card-output">
          <pre>{output}</pre>
          <button className="card-output-close" onClick={() => setOutput(null)}>✕</button>
        </div>
      )}
    </div>
  )
}
