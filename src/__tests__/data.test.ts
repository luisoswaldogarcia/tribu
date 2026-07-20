import { describe, it, expect } from 'vitest'
import { defaultAgents, initialColumns, getColumnName, normalizeAgents } from '../data'

describe('data', () => {
  it('default agents have required fields with correct types', () => {
    for (const agent of defaultAgents) {
      expect(agent.id).toBeTruthy()
      expect(agent.name).toBeTruthy()
      expect(agent.avatar).toBeTruthy()
      expect(agent.status).toMatch(/^(active|inactive|busy|waiting_input)$/)
      expect(agent.defaultMode).toMatch(/^(plan|executor|advisor)$/)
    }
  })

  it('initialColumns has todo, wip, done', () => {
    const ids = initialColumns.map((column) => column.id)
    expect(ids).toEqual(expect.arrayContaining(['todo', 'wip', 'done']))
  })

  it('getColumnName returns known names', () => {
    expect(getColumnName('todo')).toBe('Por hacer')
    expect(getColumnName('wip')).toBe('En progreso')
    expect(getColumnName('done')).toBe('Terminado')
  })

  it('getColumnName returns id for unknown', () => {
    expect(getColumnName('unknown')).toBe('unknown')
  })

  it('normalizes legacy agents without new fields — assigns defaults', () => {
    const result = normalizeAgents([{ id: 'a1', name: 'Zeref', avatar: '🧙' }])
    expect(result).toEqual([
      { id: 'a1', name: 'Zeref', avatar: '🧙', status: 'active', defaultMode: 'executor' },
    ])
  })

  it('preserves all valid fields when present', () => {
    const full = {
      id: 'a1',
      name: 'Zeref',
      avatar: '🧙',
      status: 'busy',
      defaultMode: 'plan',
      model: 'claude',
      executor: 'opencode',
      context: 'Planificador principal',
      currentTaskId: 't4',
    }
    const result = normalizeAgents([full])
    expect(result).toEqual([full])
  })

  it('ignores invalid status and mode values — falls back to defaults', () => {
    const result = normalizeAgents([{ id: 'a1', name: 'Test', avatar: '🤖', status: 'invalid', defaultMode: 'invalid' }])
    expect(result[0].status).toBe('active')
    expect(result[0].defaultMode).toBe('executor')
  })

  it('strips unknown extra fields', () => {
    const result = normalizeAgents([{ id: 'a1', name: 'Test', avatar: '🤖', foo: 'bar', baz: 123 }])
    expect(result[0]).not.toHaveProperty('foo')
    expect(result[0]).not.toHaveProperty('baz')
  })

  it('does not include optional fields when empty/undefined', () => {
    const result = normalizeAgents([{ id: 'a1', name: 'Test', avatar: '🤖', model: '', executor: '', context: '' }])
    expect(result[0]).not.toHaveProperty('model')
    expect(result[0]).not.toHaveProperty('executor')
    expect(result[0]).not.toHaveProperty('context')
  })

  it('returns empty array for non-array input', () => {
    expect(normalizeAgents(null)).toEqual([])
    expect(normalizeAgents(undefined)).toEqual([])
    expect(normalizeAgents('string')).toEqual([])
    expect(normalizeAgents(42)).toEqual([])
  })

  it('filters out invalid entries', () => {
    const result = normalizeAgents([null, undefined, {}, { id: 'a1' }, { name: 'Test' }, { id: 'a1', name: 'Valid', avatar: '🤖' }])
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Valid')
  })
})
