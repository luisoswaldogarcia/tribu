import type { ReactNode } from 'react'

const pixelAvatars: Record<string, ReactNode> = {
  '🧙': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="8" y="1" width="8" height="3" fill="#6c63ff" rx="0.5"/>
      <rect x="6" y="4" width="12" height="2" fill="#6c63ff" rx="0.5"/>
      <rect x="7" y="6" width="10" height="10" fill="#f0d5b8" rx="1"/>
      <rect x="9" y="9" width="2" height="2" fill="#1a1b23" rx="0.3"/>
      <rect x="13" y="9" width="2" height="2" fill="#1a1b23" rx="0.3"/>
      <rect x="8" y="13" width="8" height="3" fill="#6c63ff" rx="0.5"/>
    </svg>
  ),
  '🤖': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="11" y="1" width="2" height="3" fill="#888" rx="0.5"/>
      <rect x="10" y="0" width="4" height="2" fill="#8b83ff" rx="0.5"/>
      <rect x="6" y="4" width="12" height="10" fill="#8b83ff" rx="1"/>
      <rect x="8" y="7" width="3" height="3" fill="#1a1b23" rx="0.3"/>
      <rect x="13" y="7" width="3" height="3" fill="#1a1b23" rx="0.3"/>
      <rect x="9" y="11" width="6" height="1" fill="#1a1b23"/>
    </svg>
  ),
  '🦊': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="3" width="4" height="4" fill="#ff6b6b" rx="0.5"/>
      <rect x="15" y="3" width="4" height="4" fill="#ff6b6b" rx="0.5"/>
      <rect x="5" y="6" width="14" height="10" fill="#ff6b6b" rx="1"/>
      <rect x="8" y="9" width="2" height="2" fill="#fff" rx="0.3"/>
      <rect x="14" y="9" width="2" height="2" fill="#fff" rx="0.3"/>
      <rect x="9" y="9" width="1" height="2" fill="#1a1b23"/>
      <rect x="15" y="9" width="1" height="2" fill="#1a1b23"/>
      <rect x="11" y="11" width="2" height="1" fill="#1a1b23"/>
    </svg>
  ),
  '🐉': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="6" y="4" width="12" height="10" fill="#4ade80" rx="1"/>
      <rect x="4" y="8" width="3" height="4" fill="#4ade80" rx="0.5"/>
      <rect x="17" y="8" width="3" height="4" fill="#4ade80" rx="0.5"/>
      <rect x="9" y="7" width="2" height="2" fill="#fff" rx="0.3"/>
      <rect x="13" y="7" width="2" height="2" fill="#fff" rx="0.3"/>
      <rect x="10" y="7" width="1" height="2" fill="#1a1b23"/>
      <rect x="14" y="7" width="1" height="2" fill="#1a1b23"/>
      <rect x="7" y="14" width="10" height="5" fill="#4ade80" rx="1"/>
      <rect x="6" y="11" width="4" height="2" fill="#4ade80" rx="0.5"/>
    </svg>
  ),
  '👾': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="3" width="14" height="14" fill="#c084fc" rx="1"/>
      <rect x="7" y="6" width="3" height="3" fill="#1a1b23" rx="0.3"/>
      <rect x="14" y="6" width="3" height="3" fill="#1a1b23" rx="0.3"/>
      <rect x="8" y="12" width="8" height="2" fill="#1a1b23" rx="0.5"/>
      <rect x="3" y="10" width="2" height="6" fill="#c084fc" rx="1"/>
      <rect x="19" y="10" width="2" height="6" fill="#c084fc" rx="1"/>
      <rect x="5" y="12" width="2" height="4" fill="#1a1b23" rx="0.5"/>
      <rect x="17" y="12" width="2" height="4" fill="#1a1b23" rx="0.5"/>
    </svg>
  ),
  '🧝': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="1" width="6" height="3" fill="#fbbf24" rx="0.5"/>
      <rect x="7" y="4" width="10" height="10" fill="#f0d5b8" rx="1"/>
      <rect x="5" y="6" width="3" height="5" fill="#fbbf24" rx="0.5"/>
      <rect x="16" y="6" width="3" height="5" fill="#fbbf24" rx="0.5"/>
      <rect x="9" y="8" width="2" height="2" fill="#34d399" rx="0.3"/>
      <rect x="13" y="8" width="2" height="2" fill="#34d399" rx="0.3"/>
      <rect x="10" y="12" width="4" height="2" fill="#1a1b23" rx="0.5"/>
    </svg>
  ),
  '🧞': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="8" y="2" width="8" height="6" fill="#f472b6" rx="1"/>
      <rect x="6" y="5" width="12" height="8" fill="#f472b6" rx="1" opacity="0.6"/>
      <rect x="7" y="8" width="10" height="10" fill="#f472b6" rx="1"/>
      <rect x="9" y="10" width="2" height="2" fill="#fff" rx="0.3"/>
      <rect x="13" y="10" width="2" height="2" fill="#fff" rx="0.3"/>
      <rect x="10" y="14" width="4" height="1" fill="#fff"/>
    </svg>
  ),
  '🐱': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5" width="4" height="3" fill="#f59e0b" rx="0.5"/>
      <rect x="16" y="5" width="4" height="3" fill="#f59e0b" rx="0.5"/>
      <rect x="6" y="5" width="12" height="11" fill="#f59e0b" rx="1"/>
      <rect x="8" y="9" width="2" height="2" fill="#1a1b23" rx="0.3"/>
      <rect x="14" y="9" width="2" height="2" fill="#1a1b23" rx="0.3"/>
      <rect x="10" y="13" width="4" height="2" fill="#fff" rx="0.5"/>
    </svg>
  ),
  '🦉': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="7" y="3" width="10" height="12" fill="#92400e" rx="1"/>
      <rect x="8" y="5" width="4" height="6" fill="#fff" rx="0.5"/>
      <rect x="12" y="5" width="4" height="6" fill="#fff" rx="0.5"/>
      <rect x="9" y="7" width="2" height="2" fill="#1a1b23" rx="0.5"/>
      <rect x="13" y="7" width="2" height="2" fill="#1a1b23" rx="0.5"/>
      <rect x="10" y="12" width="4" height="2" fill="#f59e0b" rx="0.5"/>
      <rect x="7" y="15" width="10" height="4" fill="#92400e" rx="1"/>
    </svg>
  ),
  '⭐': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="0" width="6" height="6" fill="#fbbf24" rx="1"/>
      <rect x="5" y="5" width="14" height="4" fill="#fbbf24" rx="1"/>
      <rect x="3" y="9" width="18" height="6" fill="#fbbf24" rx="1"/>
      <rect x="5" y="15" width="14" height="4" fill="#fbbf24" rx="1"/>
      <rect x="9" y="19" width="6" height="4" fill="#fbbf24" rx="1"/>
    </svg>
  ),
  '🌈': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="10" width="18" height="3" fill="#ff6b6b" rx="1"/>
      <rect x="5" y="13" width="14" height="3" fill="#fbbf24" rx="1"/>
      <rect x="7" y="16" width="10" height="3" fill="#4ade80" rx="1"/>
      <rect x="9" y="19" width="6" height="3" fill="#60a5fa" rx="1"/>
    </svg>
  ),
  '👑': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="9" width="16" height="10" fill="#fbbf24" rx="1"/>
      <rect x="5" y="4" width="4" height="6" fill="#fbbf24" rx="0.5"/>
      <rect x="10" y="2" width="4" height="8" fill="#fbbf24" rx="0.5"/>
      <rect x="15" y="4" width="4" height="6" fill="#fbbf24" rx="0.5"/>
      <rect x="7" y="9" width="10" height="2" fill="#1a1b23" rx="0.5"/>
    </svg>
  ),
}

export function getPixelAvatar(emoji: string): ReactNode {
  return pixelAvatars[emoji] || (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="7" y="5" width="10" height="10" fill="#6c63ff" rx="2"/>
      <rect x="9" y="8" width="2" height="2" fill="#1a1b23" rx="0.3"/>
      <rect x="13" y="8" width="2" height="2" fill="#1a1b23" rx="0.3"/>
      <rect x="10" y="12" width="4" height="2" fill="#1a1b23" rx="0.3"/>
      <rect x="8" y="15" width="8" height="6" fill="#6c63ff" rx="1"/>
    </svg>
  )
}
