import { useCallback, useState } from 'react'
import type { Column, Agent } from '../types'
import KanbanCard from './KanbanCard'

interface Props {
  column: Column
  agents: Agent[]
  onDrop: (taskId: string, columnId: string) => void
}

export default function KanbanColumn({ column, agents, onDrop }: Props) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDragEnter = useCallback(() => setIsDragOver(true), [])
  const handleDragLeave = useCallback(() => setIsDragOver(false), [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const taskId = e.dataTransfer.getData('text/task-id')
      if (taskId) onDrop(taskId, column.id)
    },
    [column.id, onDrop],
  )

  return (
    <div
      className={`column${isDragOver ? ' drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="column-header">
        <span className="column-dot" style={{ background: column.color }} />
        <span className="column-title">{column.title}</span>
        <span className="column-count">{column.tasks.length}</span>
      </div>
      {column.tasks.map((task) => (
        <KanbanCard key={task.id} task={task} agents={agents} />
      ))}
    </div>
  )
}
