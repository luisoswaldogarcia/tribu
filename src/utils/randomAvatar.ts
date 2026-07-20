import { AVATAR_POOL } from './avatarPool'

/**
 * Select a random avatar emoji from the pool, avoiding ones already in use.
 * If all avatars are taken, allows repetition.
 */
export function randomAvatar(existingAvatars: string[] = []): string {
  const available = AVATAR_POOL.filter((emoji) => !existingAvatars.includes(emoji))
  const pool = available.length > 0 ? available : AVATAR_POOL
  return pool[Math.floor(Math.random() * pool.length)]
}
