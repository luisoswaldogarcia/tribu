import { describe, it, expect } from 'vitest'
import { randomAvatar } from '../utils/randomAvatar'
import { AVATAR_POOL } from '../utils/avatarPool'

describe('randomAvatar', () => {
  it('returns an emoji from the pool', () => {
    const avatar = randomAvatar()
    expect(AVATAR_POOL).toContain(avatar)
  })

  it('avoids avatars already in use', () => {
    const used = ['🧙', '🤖', '🦊']
    for (let i = 0; i < 30; i++) {
      const avatar = randomAvatar(used)
      expect(used).not.toContain(avatar)
    }
  })

  it('returns from full pool when all avatars are taken', () => {
    const allUsed = [...AVATAR_POOL]
    const avatar = randomAvatar(allUsed)
    expect(AVATAR_POOL).toContain(avatar)
  })

  it('returns from remaining pool when most are taken', () => {
    const allButOne = AVATAR_POOL.slice(0, -1)
    const lastEmoji = AVATAR_POOL[AVATAR_POOL.length - 1]
    for (let i = 0; i < 20; i++) {
      const avatar = randomAvatar([...allButOne])
      expect(avatar).toBe(lastEmoji)
    }
  })

  it('handles empty existingAvatars', () => {
    const avatar = randomAvatar([])
    expect(AVATAR_POOL).toContain(avatar)
  })

  it('generates diverse results across calls', () => {
    const results = new Set<string>()
    for (let i = 0; i < 50; i++) {
      results.add(randomAvatar())
    }
    // With 12 options, 50 calls should hit at least 5 unique
    expect(results.size).toBeGreaterThanOrEqual(5)
  })
})
