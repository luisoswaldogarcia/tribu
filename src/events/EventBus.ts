import type { Task } from '../types'

interface EventBase {
  timestamp: string
}

export type TribuEvent =
  | (EventBase & { type: 'task.created'; task: Task })
  | (EventBase & { type: 'task.updated'; task: Task })
  | (EventBase & { type: 'task.moved'; taskId: string; fromColumnId: string; toColumnId: string })
  | (EventBase & { type: 'task.completed'; taskId: string })
  | (EventBase & { type: 'agent.status_changed'; agentId: string; status: string })
  | (EventBase & { type: 'agent.message'; agentId: string; message: string })
  | (EventBase & { type: 'task.error'; taskId: string; message: string })

export type EventListener = (event: TribuEvent) => void

export class EventBus {
  private readonly listeners = new Set<EventListener>()

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  publish(event: TribuEvent): void {
    for (const listener of [...this.listeners]) {
      try {
        listener(event)
      } catch (error) {
        console.error('Tribu event listener failed', error)
      }
    }
  }

  clear(): void {
    this.listeners.clear()
  }
}

export const eventBus = new EventBus()

export function eventTimestamp(): string {
  return new Date().toISOString()
}

export type AgentEvent = Extract<TribuEvent, { type: `agent.${string}` }>
export type TaskEvent = Extract<TribuEvent, { type: `task.${string}` }>
