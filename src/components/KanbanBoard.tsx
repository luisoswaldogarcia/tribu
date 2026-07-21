import { useEffect, useState, useCallback } from 'react'
import type { Column, Priority, Task } from '../types'
import { initialColumns, getColumnName, normalizeAgents } from '../data'
import { eventBus, eventTimestamp } from '../events/EventBus'
import { useAgents } from '../context/AgentContext'
import KanbanColumn from './KanbanColumn'
import CreateTaskModal from './CreateTaskModal'
import CreateAgentModal from './CreateAgentModal'

function generateId(): string {
  return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function applyEvent(columns: Column[], event: Parameters<typeof eventBus.publish>[0]): Column[] {
  if (event.type === 'task.created') {
    if (columns.some((column) => column.tasks.some((task) => task.id === event.task.id))) return columns
    return columns.map((column) => column.id === 'todo' ? { ...column, tasks: [...column.tasks, event.task] } : column)
  }

  if (event.type === 'task.updated') {
    return columns.map((column) => ({
      ...column,
      tasks: column.tasks.map((task) => task.id === event.task.id ? event.task : task),
    }))
  }

  if (event.type === 'task.moved') {
    let movedTask: Task | undefined
    const withoutTask = columns.map((column) => {
      if (column.id !== event.fromColumnId) return column
      movedTask = column.tasks.find((task) => task.id === event.taskId)
      return { ...column, tasks: column.tasks.filter((task) => task.id !== event.taskId) }
    })
    if (!movedTask) return columns
    return withoutTask.map((column) => column.id === event.toColumnId
      ? { ...column, tasks: [...column.tasks, movedTask as Task] }
      : column)
  }

  if (event.type === 'task.completed') {
    let completed: Task | undefined
    const withoutTask = columns.map((column) => {
      const task = column.tasks.find((candidate) => candidate.id === event.taskId)
      if (task) completed = task
      return { ...column, tasks: column.tasks.filter((candidate) => candidate.id !== event.taskId) }
    })
    return completed
      ? withoutTask.map((column) => column.id === 'done' ? { ...column, tasks: [...column.tasks, completed as Task] } : column)
      : columns
  }

  return columns
}

export default function KanbanBoard({ onColumnsChange, highlightAgentId }: { onColumnsChange?: (columns: Column[]) => void; highlightAgentId?: string | null }) {
  const { agents, setPersistedAgents } = useAgents()
  const [columns, setColumns] = useState<Column[]>(initialColumns)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateAgent, setShowCreateAgent] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!window.electronAPI) return
    window.electronAPI.loadBoard().then((data) => {
      if (data?.columns) setColumns(data.columns)
      if (data?.agents) setPersistedAgents(normalizeAgents(data.agents))
      setLoaded(true)
    })
  }, [setPersistedAgents])

  useEffect(() => eventBus.subscribe((event) => {
    setColumns((previous) => applyEvent(previous, event))
  }), [])

  useEffect(() => {
    if (!window.electronAPI || !loaded) return
    const timer = setTimeout(() => {
      window.electronAPI?.saveBoard({ columns, agents })
    }, 150)
    return () => clearTimeout(timer)
  }, [agents, columns, loaded])

  useEffect(() => {
    onColumnsChange?.(columns)
  }, [columns, onColumnsChange])

  const handleDrop = (taskId: string, targetColumnId: string) => {
    const sourceColumn = columns.find((column) => column.tasks.some((task) => task.id === taskId))
    const movedTask = sourceColumn?.tasks.find((task) => task.id === taskId)
    if (!sourceColumn || !movedTask || sourceColumn.id === targetColumnId) return

    const agentName = agents.find((agent) => movedTask.agents.includes(agent.id))?.name || 'Someone'
    window.electronAPI?.notify(
      '🔄 Tribu - Task moved',
      `${agentName} moved "${movedTask.title}" from "${getColumnName(sourceColumn.id)}" to "${getColumnName(targetColumnId)}"`,
    )
    eventBus.publish({
      type: 'task.moved',
      taskId,
      fromColumnId: sourceColumn.id,
      toColumnId: targetColumnId,
      timestamp: eventTimestamp(),
    })
  }

  const handleCreate = (title: string, description: string, agentId: string, priority: Priority, workingDir: string) => {
    const newTask: Task = {
      id: generateId(),
      title,
      description: description || undefined,
      priority,
      agents: agentId ? [agentId] : [],
      workingDir: workingDir || undefined,
    }
    eventBus.publish({ type: 'task.created', task: newTask, timestamp: eventTimestamp() })
    setShowCreateModal(false)
    const agentName = agents.find((agent) => agent.id === agentId)?.name || 'Unassigned'
    window.electronAPI?.notify('📋 Tribu - New task', `${agentName} created "${title}" in To Do`)
  }

  // --- Task execution ---
  const handleExecute = useCallback(async (taskId: string, agentId: string) => {
    // Mark task as running and move to WIP
    setColumns((prev) => {
      let task: Task | undefined
      const withoutTask = prev.map((col) => {
        const found = col.tasks.find((t) => t.id === taskId)
        if (found) task = { ...found, executionStatus: 'running', outputPreview: '' }
        return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
      })
      if (!task) return prev
      return withoutTask.map((col) => col.id === 'wip' ? { ...col, tasks: [...col.tasks, task as Task] } : col)
    })

    const result = await window.electronAPI?.executeTask(taskId, agentId)
    if (!result?.success) {
      window.electronAPI?.notify('❌ Tribu - Error', result?.error || 'Error al ejecutar tarea')
      setColumns((prev) => prev.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) => t.id === taskId ? { ...t, executionStatus: 'error' } : t),
      })))
    }
  }, [])

  const handleCancel = useCallback(async (taskId: string) => {
    await window.electronAPI?.cancelTask(taskId)
    setColumns((prev) => prev.map((col) => ({
      ...col,
      tasks: col.tasks.map((t) => t.id === taskId ? { ...t, executionStatus: 'idle', outputPreview: '' } : t),
    })))
  }, [])

  // Subscribe to streaming output
  useEffect(() => {
    if (!window.electronAPI) return

    const unsubOutput = window.electronAPI.onTaskOutput(({ taskId, chunk }) => {
      setColumns((prev) => prev.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) => {
          if (t.id !== taskId) return t
          // Keep only last 5 lines for preview
          const lines = ((t.outputPreview || '') + chunk).split('\n')
          const preview = lines.slice(-5).join('\n')
          return { ...t, outputPreview: preview }
        }),
      })))
    })

    const unsubFinish = window.electronAPI.onTaskFinished(({ taskId, exitCode, sessionId, log }) => {
      setColumns((prev) => {
        let task: Task | undefined
        const withoutTask = prev.map((col) => {
          const found = col.tasks.find((t) => t.id === taskId)
          if (found) {
            task = {
              ...found,
              executionStatus: exitCode === 0 ? 'done' : 'error',
              log,
              sessionId: sessionId || found.sessionId,
              outputPreview: '',
            }
          }
          return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
        })
        if (!task) return prev
        const targetCol = exitCode === 0 ? 'done' : 'wip'
        return withoutTask.map((col) => col.id === targetCol ? { ...col, tasks: [...col.tasks, task as Task] } : col)
      })
      const status = exitCode === 0 ? '✅ completada' : '❌ con error'
      window.electronAPI?.notify('🤖 Tribu - Tarea finalizada', `Tarea ${status}`)
    })

    const unsubWaiting = window.electronAPI.onTaskWaitingInput(({ taskId }) => {
      setColumns((prev) => {
        let task: Task | undefined
        const withoutTask = prev.map((col) => {
          const found = col.tasks.find((t) => t.id === taskId)
          if (found) {
            task = { ...found, executionStatus: 'hold', holdReason: 'Esperando input del usuario', outputPreview: '' }
          }
          return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
        })
        if (!task) return prev
        return withoutTask.map((col) => col.id === 'hold' ? { ...col, tasks: [...col.tasks, task as Task] } : col)
      })
      window.electronAPI?.notify('⏸ Tribu - Agente esperando', 'El agente necesita input, tarea movida a On Hold')
    })

    return () => {
      unsubOutput()
      unsubFinish()
      unsubWaiting()
    }
  }, [])

  if (!loaded && window.electronAPI) return null

  return (
    <>
      <div className="board">
        {columns.map((column) => <KanbanColumn key={column.id} column={column} agents={agents} onDrop={handleDrop} highlightAgentId={highlightAgentId} onExecute={handleExecute} onCancel={handleCancel} />)}
      </div>
      <div className="fab-group">
        <button className="fab fab-agent" onClick={() => setShowCreateAgent(true)} title="Agregar agente">👤</button>
        <button className="fab" onClick={() => setShowCreateModal(true)} title="Nueva tarea">＋</button>
      </div>
      {showCreateModal && <CreateTaskModal onClose={() => setShowCreateModal(false)} onCreate={handleCreate} />}
      {showCreateAgent && <CreateAgentModal onClose={() => setShowCreateAgent(false)} />}
    </>
  )
}
