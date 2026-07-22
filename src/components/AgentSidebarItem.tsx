import { getPixelAvatar } from './PixelAvatar'
import type { Agent } from '../types'

interface Props {
  agent: Agent
  collapsed: boolean
  taskTitle?: string
  selected: boolean
  onClick: () => void
}

const statusColors: Record<string, string> = {
  active: 'var(--status-active)',
  busy: 'var(--status-busy)',
  inactive: 'var(--status-inactive)',
  waiting_input: 'var(--status-waiting)',
}

const statusLabels: Record<string, string> = {
  active: 'Activo',
  busy: 'Ocupado',
  inactive: 'Inactivo',
  waiting_input: 'Esperando input',
}

const modeLabels: Record<string, string> = {
  plan: 'Plan',
  executor: 'Executor',
  advisor: 'Advisor',
  orchestrator: 'Orchestrator',
}

export default function AgentSidebarItem({ agent, collapsed, taskTitle, selected, onClick }: Props) {
  const dotClass = `status-dot ${agent.status}`
  const avatarClass = `sidebar-item-avatar${agent.status === 'busy' ? ' avatar-busy' : ''}`
  const tooltipLines = [
    agent.name,
    `Estado: ${statusLabels[agent.status]}`,
    `Modo: ${modeLabels[agent.defaultMode]}`,
  ]
  if (agent.model) tooltipLines.push(`Modelo: ${agent.model}`)
  if (taskTitle) tooltipLines.push(`Tarea: ${taskTitle}`)
  const tooltip = tooltipLines.join('\n')

  const orchestratorClass = agent.defaultMode === 'orchestrator' ? ' sidebar-item-orchestrator' : ''

  if (collapsed) {
    return (
      <button
        className={`sidebar-item sidebar-item-collapsed${selected ? ' sidebar-item-selected' : ''}${orchestratorClass}`}
        onClick={onClick}
        title={tooltip}
        type="button"
      >
        <div className="sidebar-item-avatar-wrapper">
          <div className={avatarClass}>
            {getPixelAvatar(agent.avatar)}
          </div>
          <span className={dotClass} style={{ backgroundColor: statusColors[agent.status] }} />
        </div>
      </button>
    )
  }

  return (
    <button
      className={`sidebar-item${selected ? ' sidebar-item-selected' : ''}${orchestratorClass}`}
      onClick={onClick}
      title={tooltip}
      type="button"
    >
      <div className="sidebar-item-avatar-wrapper">
        <div className={avatarClass}>
          {getPixelAvatar(agent.avatar)}
        </div>
        <span className={dotClass} style={{ backgroundColor: statusColors[agent.status] }} />
      </div>
      <div className="sidebar-item-info">
        <span className="sidebar-item-name">{agent.name}</span>
        {taskTitle && <span className="sidebar-task-label">{taskTitle}</span>}
      </div>
    </button>
  )
}
