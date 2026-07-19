import { useState, useCallback, useEffect, useRef } from 'react'
import type { Column, Task, Priority } from '../types'
import { initialColumns, agents, getColumnName } from '../data'
import KanbanColumn from './KanbanColumn'
import CreateTaskModal from './CreateTaskModal'

function generateId(): string {
  return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

const priorities: Priority[] = ['alta', 'media', 'baja']

function inferPriority(): Priority {
  return priorities[Math.floor(Math.random() * priorities.length)]
}

export default function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(initialColumns)
  const [showModal, setShowModal] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!window.electronAPI) return
    window.electronAPI.loadBoard().then((data) => {
      if (data?.columns) {
        setColumns(data.columns)
      }
      setLoaded(true)
    })
  }, [])

  const persist = useCallback((cols: Column[]) => {
    if (!window.electronAPI) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      window.electronAPI?.saveBoard({ columns: cols })
    }, 500)
  }, [])

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

        if (window.electronAPI) {
          window.electronAPI.notify(
            '🔄 Tribu - Tarea movida',
            `${agentName} movió "${mt.title}" de "${getColumnName(sourceColumnId)}" a "${getColumnName(targetColumnId)}"`,
          )
        }

        persist(result)
        return result
      })
    },
    [persist],
  )

  const handleCreate = useCallback(
    (title: string, description: string, agentId: string, _model: string, _context: string) => {
      const newTask: Task = {
        id: generateId(),
        title,
        description: description || undefined,
        priority: inferPriority(),
        agents: [agentId],
      }
      setColumns((prev) => {
        const next = prev.map((col) =>
          col.id === 'todo'
            ? { ...col, tasks: [...col.tasks, newTask] }
            : col,
        )
        persist(next)
        return next
      })
      setShowModal(false)

      const agentName = agents.find((a) => a.id === agentId)?.name || 'Alguien'
      if (window.electronAPI) {
        window.electronAPI.notify(
          '📋 Tribu - Nueva tarea',
          `${agentName} creó "${title}" en Por hacer`,
        )
      }
    },
    [persist],
  )

  if (!loaded && window.electronAPI) {
    return null
  }

  return (
    <>
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
      <button className="fab" onClick={() => setShowModal(true)}>+</button>
      {showModal && (
        <CreateTaskModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </>
  )
}
