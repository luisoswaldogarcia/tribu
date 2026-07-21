import { useCallback, useState } from 'react'
import type { Agent, Column } from '../types'
import KanbanCard from './KanbanCard'

interface Props {
  column: Column
  agents: Agent[]
  onDrop: (taskId: string, columnId: string) => void
  highlightAgentId?: string | null
  onExecute?: (taskId: string, agentId: string) => void
  onCancel?: (taskId: string) => void
  onOpenChat?: (taskId: string) => void
}

export default function KanbanColumn({ column, agents, onDrop, highlightAgentId, onExecute, onCancel, onOpenChat }: Props) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
    const taskId = event.dataTransfer.getData('text/task-id')
    if (taskId) onDrop(taskId, column.id)
  }, [column.id, onDrop])

  return (
    <div
      className={`column${isDragOver ? ' drag-over' : ''}`}
      onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move' }}
      onDragEnter={() => setIsDragOver(true)}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="column-header">
        <span className="column-dot" style={{ background: column.color }} />
        <span className="column-title">{column.title}</span>
        <span className="column-count">{column.tasks.length}</span>
      </div>
      {column.tasks.map((task) => <KanbanCard key={task.id} task={task} agents={agents} highlightAgentId={highlightAgentId} columnId={column.id} onExecute={onExecute} onCancel={onCancel} onOpenChat={onOpenChat} />)}
    </div>
  )
}
