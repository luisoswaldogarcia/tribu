/**
 * Fantasy/RPG name generator for AI agents.
 * Combines syllable-based prefixes and suffixes to create unique names.
 */

export const prefixes = [
  'Zeph', 'Thorn', 'Kal', 'Nyx', 'Vex', 'Aur', 'Drak', 'Syl', 'Mor', 'Fen',
  'Lux', 'Grim', 'Ash', 'Vor', 'Eld', 'Rix', 'Gor', 'Thal', 'Kyn', 'Bael',
  'Xan', 'Jor', 'Ven', 'Cyr', 'Oth', 'Rav', 'Sol', 'Zen', 'Ark', 'Myr',
]

export const suffixes = [
  'ius', 'veil', 'drin', 'ara', 'ox', 'ion', 'thos', 'mir', 'lok', 'enn',
  'is', 'or', 'ax', 'un', 'ael', 'yr', 'oth', 'ek', 'on', 'ira',
  'us', 'ein', 'al', 'ix', 'os', 'eth', 'an', 'ur', 'iel', 'ak',
]

const MAX_RETRIES = 10

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Generate a fantasy/RPG agent name that is not already in use.
 * If after MAX_RETRIES all combinations collide, appends a numeric suffix.
 */
export function generateAgentName(existingNames: string[] = []): string {
  const existing = new Set(existingNames.map((n) => n.toLowerCase()))

  for (let i = 0; i < MAX_RETRIES; i++) {
    const name = pickRandom(prefixes) + pickRandom(suffixes)
    if (!existing.has(name.toLowerCase())) return name
  }

  // Fallback: append numeric suffix
  const base = pickRandom(prefixes) + pickRandom(suffixes)
  let counter = 2
  while (existing.has(`${base}${counter}`.toLowerCase())) {
    counter++
  }
  return `${base}${counter}`
}
