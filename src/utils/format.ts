/**
 * Display helpers.
 *
 * Every timestamp in this API is an integer count of milliseconds since the
 * Unix epoch, never an RFC 3339 string — so all of these take a number and the
 * conversion happens here, at the display boundary, rather than at call sites.
 */

const DASH = '—'

export function formatDateTime(ms: number | undefined | null): string {
  if (!ms) return DASH
  return new Date(ms).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(ms: number | undefined | null): string {
  if (!ms) return DASH
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** "3 minutes ago" / "in 2 hours". Falls back to an absolute date past a week. */
export function formatRelative(ms: number | undefined | null): string {
  if (!ms) return DASH

  const diff = ms - Date.now()
  const abs = Math.abs(diff)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['second', 1000],
    ['minute', 60_000],
    ['hour', 3_600_000],
    ['day', 86_400_000],
  ]

  if (abs > 7 * 86_400_000) return formatDate(ms)

  let unit: Intl.RelativeTimeFormatUnit = 'second'
  let size = 1000
  for (const [candidate, candidateSize] of units) {
    if (abs >= candidateSize) {
      unit = candidate
      size = candidateSize
    }
  }

  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  return formatter.format(Math.round(diff / size), unit)
}

export function formatBytes(bytes: number | undefined | null): string {
  if (bytes === undefined || bytes === null) return DASH
  if (bytes < 1024) return `${bytes} B`

  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`
}

/** Seconds as a compact duration: 90 -> "1m 30s", 3600 -> "1h". */
export function formatDuration(seconds: number | undefined | null): string {
  if (seconds === undefined || seconds === null) return DASH
  if (seconds === 0) return 'none'
  if (seconds < 60) return `${seconds}s`

  const parts: string[] = []
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60

  if (hours) parts.push(`${hours}h`)
  if (minutes) parts.push(`${minutes}m`)
  if (rest) parts.push(`${rest}s`)
  return parts.join(' ')
}

/** Title-cases an enum slug for display: `app_password` -> `App password`. */
export function humanise(value: string | undefined | null): string {
  if (!value) return DASH
  const spaced = value.replace(/[_-]/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function truncate(value: string | undefined | null, max = 80): string {
  if (!value) return DASH
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}
