import { useEffect, useState } from 'react'
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

  const handleCreate = (title: string, description: string, agentId: string, priority: Priority) => {
    const newTask: Task = {
      id: generateId(),
      title,
      description: description || undefined,
      priority,
      agents: agentId ? [agentId] : [],
    }
    eventBus.publish({ type: 'task.created', task: newTask, timestamp: eventTimestamp() })
    setShowCreateModal(false)
    const agentName = agents.find((agent) => agent.id === agentId)?.name || 'Unassigned'
    window.electronAPI?.notify('📋 Tribu - New task', `${agentName} created "${title}" in To Do`)
  }

  if (!loaded && window.electronAPI) return null

  return (
    <>
      <div className="board">
        {columns.map((column) => <KanbanColumn key={column.id} column={column} agents={agents} onDrop={handleDrop} highlightAgentId={highlightAgentId} />)}
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
