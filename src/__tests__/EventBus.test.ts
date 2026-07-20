import { describe, it, expect, vi, afterEach } from 'vitest'
import { EventBus } from '../events/EventBus'

const event = {
  type: 'task.created' as const,
  timestamp: '2026-07-20T00:00:00.000Z',
  task: { id: 't1', title: 'Nueva tarea', priority: 'media' as const, agents: [] },
}

describe('EventBus', () => {
  afterEach(() => vi.restoreAllMocks())

  it('publishes events to subscribers', () => {
    const bus = new EventBus()
    const listener = vi.fn()
    bus.subscribe(listener)

    bus.publish(event)

    expect(listener).toHaveBeenCalledWith(event)
  })

  it('removes a subscription', () => {
    const bus = new EventBus()
    const listener = vi.fn()
    const unsubscribe = bus.subscribe(listener)

    unsubscribe()
    bus.publish(event)

    expect(listener).not.toHaveBeenCalled()
  })

  it('isolates listener errors', () => {
    const bus = new EventBus()
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const failing = vi.fn(() => { throw new Error('boom') })
    const healthy = vi.fn()
    bus.subscribe(failing)
    bus.subscribe(healthy)

    bus.publish(event)

    expect(error).toHaveBeenCalledOnce()
    expect(healthy).toHaveBeenCalledWith(event)
  })
})
