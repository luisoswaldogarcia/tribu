import { PxlKitIcon, AnimatedPxlKitIcon } from '@pxlkit/core'
import type { PxlKitData, AnimatedPxlKitData } from '@pxlkit/core'

// UI pack
import { Pencil, Trash, Copy, Play, Pause, Close, Check, Gear, Menu, Home, Search, List, Grid, Clock, Robot, Settings, ArrowRight, Download, Upload, ExternalLink, Lock, LockOpen } from '@pxlkit/ui'

// Feedback pack
import { CheckCircle, XCircle, InfoCircle, WarningTriangle, ChatDots, Bell, Send, MessageSquare, Hourglass } from '@pxlkit/feedback'

// Effects pack (animated)
import { Flame, GlowPulse, RadarPing, SparkBurst } from '@pxlkit/effects'

/**
 * Semantic icon name → Pxlkit icon data mapping.
 * Use these names throughout the app for consistency.
 */
const staticIcons: Record<string, PxlKitData> = {
  // Actions
  edit: Pencil,
  delete: Trash,
  duplicate: Copy,
  play: Play,
  pause: Pause,
  close: Close,
  check: Check,
  gear: Gear,
  menu: Menu,
  settings: Settings,
  search: Search,
  list: List,
  grid: Grid,
  home: Home,
  clock: Clock,
  robot: Robot,
  send: Send,
  download: Download,
  upload: Upload,
  'external-link': ExternalLink,
  'arrow-right': ArrowRight,
  lock: Lock,
  'lock-open': LockOpen,

  // Feedback / Status
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  'info-circle': InfoCircle,
  warning: WarningTriangle,
  chat: ChatDots,
  'message-square': MessageSquare,
  bell: Bell,
  hourglass: Hourglass,
}

const animatedIcons: Record<string, AnimatedPxlKitData> = {
  flame: Flame as AnimatedPxlKitData,
  'glow-pulse': GlowPulse as AnimatedPxlKitData,
  'radar-ping': RadarPing as AnimatedPxlKitData,
  'spark-burst': SparkBurst as AnimatedPxlKitData,
}

export type IconName = keyof typeof staticIcons | keyof typeof animatedIcons

interface IconProps {
  /** Semantic icon name */
  name: string
  /** Icon size in pixels (default 16) */
  size?: number
  /** Optional tint color (uses Pxlkit "tinted" appearance) */
  color?: string
  /** If true, plays the animation loop (only for animated icons) */
  animated?: boolean
  /** Additional CSS class */
  className?: string
  /** Accessible title for the icon */
  title?: string
}

/**
 * Unified icon component wrapping Pxlkit.
 * 
 * Usage:
 *   <Icon name="edit" size={16} />
 *   <Icon name="flame" size={16} animated />
 *   <Icon name="check-circle" size={16} color="#6bcb77" />
 */
export default function Icon({ name, size = 16, color, animated, className, title }: IconProps) {
  // Check animated icons first
  const animatedIcon = animatedIcons[name]
  if (animatedIcon) {
    return (
      <span className={className} title={title} role="img" aria-hidden={!title}>
        <AnimatedPxlKitIcon
          icon={animatedIcon}
          size={size}
          trigger={animated ? 'loop' : 'once'}
          appearance={color ? 'tinted' : undefined}
          color={color}
        />
      </span>
    )
  }

  // Static icons
  const staticIcon = staticIcons[name]
  if (staticIcon) {
    return (
      <span className={className} title={title} role="img" aria-hidden={!title}>
        <PxlKitIcon
          icon={staticIcon}
          size={size}
          appearance={color ? 'tinted' : undefined}
          color={color}
        />
      </span>
    )
  }

  // Fallback — render nothing for unknown icons
  if (import.meta.env.DEV) {
    console.warn(`[Icon] Unknown icon name: "${name}"`)
  }
  return null
}
