import { useState, useCallback } from 'react'
import type { Column, Task } from '../types'
import { initialColumns, agents, getColumnName } from '../data'
import KanbanColumn from './KanbanColumn'

export default function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(initialColumns)

  const handleDrop = useCallback(
    (taskId: string, targetColumnId: string) => {
      setColumns((prev) => {
        let movedTask: Task | null = null
        let sourceColumnId = ''

        const newColumns = prev.map((col) => {
          if (col.tasks.some((t) => t.id === taskId)) {
            movedTask = col.tasks.find((t) => t.id === taskId)!
            sourceColumnId = col.id
            return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
          }
          return col
        })
        if (!movedTask || !sourceColumnId) return prev

        const result = newColumns.map((col) => {
          if (col.id === targetColumnId) {
            return { ...col, tasks: [...col.tasks, movedTask!] }
          }
          return col
        })

        const mt = movedTask as Task
        const agentName =
          mt.agents.length > 0
            ? agents.find((a) => a.id === mt.agents[0])?.name || 'Alguien'
            : 'Alguien'
        const taskTitle = mt.title

        if (window.electronAPI) {
          window.electronAPI.notify(
            '🔄 Tribu - Tarea movida',
            `${agentName} movió "${taskTitle}" de "${getColumnName(sourceColumnId)}" a "${getColumnName(targetColumnId)}"`,
          )
        }

        return result
      })
    },
    [],
  )

  return (
    <div className="board">
      {columns.map((col) => (
        <KanbanColumn
          key={col.id}
          column={col}
          agents={agents}
          onDrop={handleDrop}
        />
      ))}
    </div>
  )
}
