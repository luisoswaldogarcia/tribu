import { describe, it, expect } from 'vitest'
import { defaultAgents, initialColumns, getColumnName, normalizeAgents, normalizeTasks, normalizeMessages } from '../data'

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

  it('initialColumns has todo, wip, hold, done', () => {
    const ids = initialColumns.map((column) => column.id)
    expect(ids).toEqual(expect.arrayContaining(['todo', 'wip', 'hold', 'done']))
  })

  it('getColumnName returns known names', () => {
    expect(getColumnName('todo')).toBe('To Do')
    expect(getColumnName('wip')).toBe('In Progress')
    expect(getColumnName('hold')).toBe('On Hold')
    expect(getColumnName('done')).toBe('Done')
  })

  it('getColumnName returns id for unknown', () => {
    expect(getColumnName('unknown')).toBe('unknown')
  })

  it('normalizes legacy agents without new fields — assigns defaults', () => {
    const result = normalizeAgents([{ id: 'a1', name: 'Zeref', avatar: '🧙' }])
    expect(result).toEqual([
      { id: 'a1', name: 'Zeref', avatar: '🧙', status: 'active', defaultMode: 'executor', executor: 'opencode' },
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
    expect(result[0].executor).toBe('opencode') // empty string falls back to default
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

describe('normalizeTasks', () => {
  it('normalizes a valid task with all fields', () => {
    const input = [{
      id: 't1',
      title: 'Test task',
      description: 'A description',
      priority: 'alta',
      agents: ['a1'],
      workingDir: '/home/user/project',
      sessionId: 'ses_123',
      log: 'some output',
      outputPreview: 'last line',
      executionStatus: 'done',
    }]
    const result = normalizeTasks(input)
    expect(result).toHaveLength(1)
    expect(result[0].workingDir).toBe('/home/user/project')
    expect(result[0].sessionId).toBe('ses_123')
    expect(result[0].log).toBe('some output')
    expect(result[0].executionStatus).toBe('done')
    // Legacy log should be migrated to messages
    expect(result[0].messages).toHaveLength(1)
    expect(result[0].messages![0].role).toBe('agent')
    expect(result[0].messages![0].content).toBe('some output')
  })

  it('assigns defaults for missing optional fields', () => {
    const result = normalizeTasks([{ id: 't1', title: 'Basic', priority: 'baja', agents: [] }])
    expect(result).toHaveLength(1)
    expect(result[0]).not.toHaveProperty('workingDir')
    expect(result[0]).not.toHaveProperty('sessionId')
    expect(result[0]).not.toHaveProperty('messages')
    expect(result[0]).not.toHaveProperty('executionStatus')
  })

  it('preserves structured messages when present', () => {
    const messages = [
      { role: 'agent', content: 'Working on it...', timestamp: '2026-07-20T01:00:00Z' },
      { role: 'user', content: 'Proceed', timestamp: '2026-07-20T01:01:00Z' },
      { role: 'agent', content: 'Done!', timestamp: '2026-07-20T01:02:00Z' },
    ]
    const result = normalizeTasks([{ id: 't1', title: 'Chat task', priority: 'media', agents: ['a1'], messages }])
    expect(result[0].messages).toHaveLength(3)
    expect(result[0].messages![0]).toEqual({ role: 'agent', content: 'Working on it...', timestamp: '2026-07-20T01:00:00Z' })
    expect(result[0].messages![1]).toEqual({ role: 'user', content: 'Proceed', timestamp: '2026-07-20T01:01:00Z' })
  })

  it('prefers messages over log when both exist', () => {
    const input = [{
      id: 't1',
      title: 'Both',
      priority: 'media',
      agents: [],
      log: 'old log',
      messages: [{ role: 'agent', content: 'new structured', timestamp: '2026-07-20T00:00:00Z' }],
    }]
    const result = normalizeTasks(input)
    expect(result[0].messages).toHaveLength(1)
    expect(result[0].messages![0].content).toBe('new structured')
    expect(result[0]).not.toHaveProperty('log')
  })

  it('filters out invalid entries', () => {
    const result = normalizeTasks([null, {}, { id: 't1' }, { id: 't1', title: 'Valid', priority: 'media', agents: [] }])
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Valid')
  })

  it('returns empty for non-array input', () => {
    expect(normalizeTasks(null)).toEqual([])
    expect(normalizeTasks(undefined)).toEqual([])
  })
})

describe('normalizeMessages', () => {
  it('normalizes valid messages', () => {
    const input = [
      { role: 'agent', content: 'Hello', timestamp: '2026-07-20T00:00:00Z' },
      { role: 'user', content: 'Hi', timestamp: '2026-07-20T00:01:00Z' },
    ]
    const result = normalizeMessages(input)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ role: 'agent', content: 'Hello', timestamp: '2026-07-20T00:00:00Z' })
    expect(result[1]).toEqual({ role: 'user', content: 'Hi', timestamp: '2026-07-20T00:01:00Z' })
  })

  it('filters out invalid messages', () => {
    const input = [
      null,
      { role: 'invalid', content: 'bad' },
      { role: 'agent' },
      { role: 'agent', content: 'good', timestamp: '2026-07-20T00:00:00Z' },
    ]
    const result = normalizeMessages(input)
    expect(result).toHaveLength(1)
    expect(result[0].content).toBe('good')
  })

  it('assigns timestamp if missing', () => {
    const input = [{ role: 'user', content: 'no timestamp' }]
    const result = normalizeMessages(input)
    expect(result).toHaveLength(1)
    expect(result[0].timestamp).toBeTruthy()
  })
})
