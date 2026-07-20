/** Pool of available pixel-art avatar emojis for agents. */
export const AVATAR_POOL = [
  '🧙', '🤖', '🦊', '🐉', '👾', '🧝', '🧞', '🐱', '🦉', '⭐', '🌈', '👑',
] as const

export type AvatarEmoji = (typeof AVATAR_POOL)[number]
