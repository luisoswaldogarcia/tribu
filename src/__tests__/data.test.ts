import { describe, it, expect } from 'vitest'
import { agents, initialColumns, getColumnName } from '../data'

describe('data', () => {
  it('agents have all required fields', () => {
    for (const agent of agents) {
      expect(agent.id).toBeTruthy()
      expect(agent.name).toBeTruthy()
      expect(agent.avatar).toBeTruthy()
      expect(agent.model).toBeTruthy()
      expect(agent.context).toBeTruthy()
    }
  })

  it('initialColumns has todo, wip, done', () => {
    const ids = initialColumns.map((c) => c.id)
    expect(ids).toContain('todo')
    expect(ids).toContain('wip')
    expect(ids).toContain('done')
  })

  it('getColumnName returns known names', () => {
    expect(getColumnName('todo')).toBe('Por hacer')
    expect(getColumnName('wip')).toBe('En progreso')
    expect(getColumnName('done')).toBe('Terminado')
  })

  it('getColumnName returns id for unknown', () => {
    expect(getColumnName('unknown')).toBe('unknown')
  })

  it('all tasks have createdBy', () => {
    for (const col of initialColumns) {
      for (const task of col.tasks) {
        expect(task.createdBy).toBeTruthy()
      }
    }
  })
})
