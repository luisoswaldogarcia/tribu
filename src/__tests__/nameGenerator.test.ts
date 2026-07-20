import { describe, it, expect } from 'vitest'
import { generateAgentName, prefixes, suffixes } from '../utils/nameGenerator'

describe('generateAgentName', () => {
  it('returns a non-empty string', () => {
    const name = generateAgentName()
    expect(name).toBeTruthy()
    expect(name.length).toBeGreaterThan(0)
  })

  it('starts with a known prefix', () => {
    const name = generateAgentName()
    const hasPrefix = prefixes.some((p) => name.startsWith(p))
    expect(hasPrefix).toBe(true)
  })

  it('ends with a known suffix (or numeric fallback)', () => {
    const name = generateAgentName()
    const hasSuffix = suffixes.some((s) => name.endsWith(s))
    // Could also end with a number in fallback case
    const endsWithNumber = /\d+$/.test(name)
    expect(hasSuffix || endsWithNumber).toBe(true)
  })

  it('avoids names already in existingNames', () => {
    const existing = ['Zephius', 'Thornveil']
    const results = new Set<string>()
    for (let i = 0; i < 50; i++) {
      results.add(generateAgentName(existing))
    }
    // None of the generated names should match existing (case insensitive)
    const lowerExisting = existing.map((n) => n.toLowerCase())
    for (const name of results) {
      expect(lowerExisting).not.toContain(name.toLowerCase())
    }
  })

  it('comparison is case-insensitive', () => {
    const existing = ['zephius', 'THORNVEIL']
    const results = new Set<string>()
    for (let i = 0; i < 50; i++) {
      results.add(generateAgentName(existing))
    }
    for (const name of results) {
      expect(name.toLowerCase()).not.toBe('zephius')
      expect(name.toLowerCase()).not.toBe('thornveil')
    }
  })

  it('appends numeric suffix when all combos are exhausted', () => {
    // Create a list that includes all possible combinations
    const allCombos: string[] = []
    for (const p of prefixes) {
      for (const s of suffixes) {
        allCombos.push(p + s)
      }
    }
    const name = generateAgentName(allCombos)
    expect(name).toBeTruthy()
    // Should end with a number since all base combos are taken
    expect(/\d+$/.test(name)).toBe(true)
  })

  it('generates diverse names across multiple calls', () => {
    const names = new Set<string>()
    for (let i = 0; i < 20; i++) {
      names.add(generateAgentName())
    }
    // With 900 combos, 20 calls should produce at least 10 unique names
    expect(names.size).toBeGreaterThanOrEqual(10)
  })
})
