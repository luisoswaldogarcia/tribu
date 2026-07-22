import { useEffect, useState, useCallback, useMemo } from 'react'
import type { Column, Priority, Task, ChatMessage } from '../types'
import { initialColumns, getColumnName, normalizeAgents } from '../data'
import { eventBus, eventTimestamp } from '../events/EventBus'
import { useAgents } from '../context/AgentContext'
import KanbanColumn from './KanbanColumn'
import CreateTaskModal from './CreateTaskModal'
import CreateAgentModal from './CreateAgentModal'
import TaskChatModal from './TaskChatModal'

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
  const { agents, setPersistedAgents, updateAgent } = useAgents()
  const [columns, setColumns] = useState<Column[]>(initialColumns)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateAgent, setShowCreateAgent] = useState(false)
  const [chatTaskId, setChatTaskId] = useState<string | null>(null)
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

    // Mark agent as busy
    updateAgent(agentId, { status: 'busy', currentTaskId: taskId })

    const result = await window.electronAPI?.executeTask(taskId, agentId)
    if (!result?.success) {
      window.electronAPI?.notify('❌ Tribu - Error', result?.error || 'Error al ejecutar tarea')
      setColumns((prev) => prev.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) => t.id === taskId ? { ...t, executionStatus: 'error' } : t),
      })))
      // Release agent on error
      updateAgent(agentId, { status: 'active', currentTaskId: undefined })
    }
  }, [updateAgent])

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
          // Accumulate into messages: append to last agent message or create new one
          const messages = [...(t.messages || [])]
          const lastMsg = messages[messages.length - 1]
          if (lastMsg && lastMsg.role === 'agent') {
            messages[messages.length - 1] = { ...lastMsg, content: lastMsg.content + chunk }
          } else {
            messages.push({ role: 'agent', content: chunk, timestamp: new Date().toISOString() } as ChatMessage)
          }
          return { ...t, outputPreview: preview, messages }
        }),
      })))
    })

    const unsubFinish = window.electronAPI.onTaskFinished(({ taskId, exitCode, sessionId, log }) => {
      // Release the agent assigned to this task
      setColumns((currentCols) => {
        const taskInCols = currentCols.flatMap((col) => col.tasks).find((t) => t.id === taskId)
        if (taskInCols && taskInCols.agents.length > 0) {
          taskInCols.agents.forEach((aid) => updateAgent(aid, { status: 'active', currentTaskId: undefined }))
        }
        return currentCols
      })

      setColumns((prev) => {
        let task: Task | undefined
        const withoutTask = prev.map((col) => {
          const found = col.tasks.find((t) => t.id === taskId)
          if (found) {
            // If no messages were accumulated during streaming, create one from the full log
            const messages = (found.messages && found.messages.length > 0)
              ? found.messages
              : (log ? [{ role: 'agent' as const, content: log, timestamp: new Date().toISOString() }] : [])
            task = {
              ...found,
              executionStatus: exitCode === 0 ? 'done' : 'error',
              log,
              messages,
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
      // Set agent to waiting_input
      setColumns((currentCols) => {
        const taskInCols = currentCols.flatMap((col) => col.tasks).find((t) => t.id === taskId)
        if (taskInCols && taskInCols.agents.length > 0) {
          taskInCols.agents.forEach((aid) => updateAgent(aid, { status: 'waiting_input' }))
        }
        return currentCols
      })

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

  // Subscribe to orchestration events — reload board from disk when subtasks are created/finished
  useEffect(() => {
    if (!window.electronAPI) return

    const reloadBoard = () => {
      window.electronAPI!.loadBoard().then((data) => {
        if (data?.columns) setColumns(data.columns)
        if (data?.agents) setPersistedAgents(normalizeAgents(data.agents))
      })
    }

    const unsubCreated = window.electronAPI.onSubtaskCreated(() => reloadBoard())
    const unsubSubFinished = window.electronAPI.onSubtaskFinished(() => reloadBoard())
    const unsubOrchComplete = window.electronAPI.onOrchestrationComplete(() => reloadBoard())
    const unsubSubError = window.electronAPI.onSubtaskError(() => reloadBoard())

    return () => {
      unsubCreated()
      unsubSubFinished()
      unsubOrchComplete()
      unsubSubError()
    }
  }, [setPersistedAgents])

  // Calculate subtask progress for parent tasks
  const subtaskProgressMap = useMemo(() => {
    const allTasks = columns.flatMap((col) => col.tasks)
    const doneTasks = columns.find((col) => col.id === 'done')?.tasks || []
    const map: Record<string, { completed: number; total: number }> = {}
    for (const task of allTasks) {
      const subtasks = allTasks.filter((t) => t.parentId === task.id)
      if (subtasks.length > 0) {
        const completed = subtasks.filter((st) => doneTasks.some((dt) => dt.id === st.id)).length
        map[task.id] = { completed, total: subtasks.length }
      }
    }
    return map
  }, [columns])

  if (!loaded && window.electronAPI) return null

  // Find the task for the chat modal
  const chatTask = chatTaskId
    ? columns.flatMap((col) => col.tasks).find((t) => t.id === chatTaskId) || null
    : null

  const handleOpenChat = (taskId: string) => {
    setChatTaskId(taskId)
  }

  const handleSendInput = async (taskId: string, text: string) => {
    // Check if task is done/error — reactivate by moving to TODO
    const currentTask = columns.flatMap((col) => col.tasks).find((t) => t.id === taskId)
    const isFinished = currentTask?.executionStatus === 'done' || currentTask?.executionStatus === 'error'

    if (isFinished) {
      // Reactivate: move task from done/error to TODO with new message
      setColumns((prev) => {
        let task: Task | undefined
        const withoutTask = prev.map((col) => {
          const found = col.tasks.find((t) => t.id === taskId)
          if (found) {
            const messages = [...(found.messages || []), { role: 'user' as const, content: text, timestamp: new Date().toISOString() }]
            task = { ...found, messages, executionStatus: 'idle', outputPreview: '' }
          }
          return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
        })
        if (!task) return prev
        return withoutTask.map((col) => col.id === 'todo' ? { ...col, tasks: [...col.tasks, task as Task] } : col)
      })
      window.electronAPI?.notify('🔄 Tribu', 'Tarea reactivada en To Do')
      return
    }

    // Add user message to the task's messages immediately
    setColumns((prev) => prev.map((col) => ({
      ...col,
      tasks: col.tasks.map((t) => {
        if (t.id !== taskId) return t
        const messages = [...(t.messages || []), { role: 'user' as const, content: text, timestamp: new Date().toISOString() }]
        return { ...t, messages, executionStatus: t.executionStatus === 'hold' ? 'running' : t.executionStatus }
      }),
    })))

    // Send input to the backend
    const result = await window.electronAPI?.sendTaskInput(taskId, text)
    if (result && !result.success && !result.fallback) {
      // If sending failed entirely, notify
      window.electronAPI?.notify('❌ Tribu', result.error || 'No se pudo enviar input')
    }
  }

  return (
    <>
      <div className="board">
        {columns.map((column) => <KanbanColumn key={column.id} column={column} agents={agents} onDrop={handleDrop} highlightAgentId={highlightAgentId} subtaskProgressMap={subtaskProgressMap} onExecute={handleExecute} onCancel={handleCancel} onOpenChat={handleOpenChat} />)}
      </div>
      <div className="fab-group">
        <button className="fab fab-agent" onClick={() => setShowCreateAgent(true)} title="Agregar agente">👤</button>
        <button className="fab" onClick={() => setShowCreateModal(true)} title="Nueva tarea">＋</button>
      </div>
      {showCreateModal && <CreateTaskModal onClose={() => setShowCreateModal(false)} onCreate={handleCreate} />}
      {showCreateAgent && <CreateAgentModal onClose={() => setShowCreateAgent(false)} />}
      {chatTask && <TaskChatModal task={chatTask} agents={agents} onClose={() => setChatTaskId(null)} onSendInput={handleSendInput} />}
    </>
  )
}
