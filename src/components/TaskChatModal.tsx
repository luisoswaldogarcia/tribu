import { useEffect, useRef, useMemo } from 'react'
import { AnsiUp } from 'ansi_up'
import type { Agent, ChatMessage, Task, TaskStatus } from '../types'
import { getPixelAvatar } from './PixelAvatar'
import Icon from './Icon'

interface Props {
  task: Task
  agents: Agent[]
  onClose: () => void
  onSendInput: (taskId: string, text: string) => void
}

const statusLabels: Record<TaskStatus, { icon: string; label: string }> = {
  idle: { icon: 'clock', label: 'Inactiva' },
  running: { icon: 'glow-pulse', label: 'Ejecutando' },
  done: { icon: 'check-circle', label: 'Completada' },
  error: { icon: 'x-circle', label: 'Error' },
  hold: { icon: 'pause', label: 'Esperando input' },
}

function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function getPlaceholder(status: TaskStatus): string {
  if (status === 'done' || status === 'error') return 'Escribe para reactivar la tarea...'
  return 'Escribe tu respuesta...'
}

export default function TaskChatModal({ task, agents, onClose, onSendInput }: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const taskAgent = agents.find((a) => task.agents.includes(a.id))
  const status = task.executionStatus || 'idle'
  const statusInfo = statusLabels[status]
  const messages = task.messages || []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal modal-wide chat-modal">
        <div className="modal-header">
          <div className="chat-header-info">
            {taskAgent && (
              <div className="chat-header-avatar">
                {getPixelAvatar(taskAgent.avatar)}
              </div>
            )}
            <div>
              <h2>{task.title}</h2>
              <span className="chat-status">
                <Icon name={statusInfo.icon} size={14} /> {statusInfo.label}
                {taskAgent && <span className="chat-agent-name"> — {taskAgent.name}</span>}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={14} /></button>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              Sin mensajes aún. Ejecuta la tarea para ver el log del agente.
            </div>
          )}
          {messages.map((msg, idx) => (
            <ChatBubble key={idx} message={msg} agentName={taskAgent?.name} />
          ))}
          {status === 'running' && (
            <div className="chat-typing">
              <span className="chat-typing-dot" />
              <span className="chat-typing-dot" />
              <span className="chat-typing-dot" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          taskId={task.id}
          enabled={true}
          placeholder={getPlaceholder(status)}
          onSend={onSendInput}
        />
      </div>
    </div>
  )
}

function ChatBubble({ message, agentName }: { message: ChatMessage; agentName?: string }) {
  const isAgent = message.role === 'agent'

  const htmlContent = useMemo(() => {
    if (!isAgent) return ''
    const ansiUp = new AnsiUp()
    ansiUp.use_classes = true
    return ansiUp.ansi_to_html(message.content)
  }, [isAgent, message.content])

  return (
    <div className={`chat-bubble ${isAgent ? 'chat-bubble-agent' : 'chat-bubble-user'}`}>
      <div className="chat-bubble-header">
        <span className="chat-bubble-role">{isAgent ? (agentName || 'Agente') : 'Tú'}</span>
        <span className="chat-bubble-time">{formatTime(message.timestamp)}</span>
      </div>
      <div className="chat-bubble-content">
        {isAgent ? (
          <pre className="chat-agent-output" dangerouslySetInnerHTML={{ __html: htmlContent }} />
        ) : (
          <p>{message.content}</p>
        )}
      </div>
    </div>
  )
}

function ChatInput({ taskId, enabled, placeholder, onSend }: { taskId: string; enabled: boolean; placeholder: string; onSend: (taskId: string, text: string) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const text = textareaRef.current?.value.trim()
    if (!text) return
    onSend(taskId, text)
    if (textareaRef.current) textareaRef.current.value = ''
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-input-area">
      <textarea
        ref={textareaRef}
        className="chat-textarea"
        placeholder={placeholder}
        disabled={!enabled}
        onKeyDown={handleKeyDown}
        rows={2}
      />
      <button
        className="chat-send-btn"
        onClick={handleSend}
        disabled={!enabled}
        title="Enviar (Enter)"
      >
        <Icon name="send" size={16} />
      </button>
    </div>
  )
}
