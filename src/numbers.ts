/**
 * Remember numbers: a number is flashed, then keyed back from memory. The
 * length follows success, so it settles around the digit span.
 */

export interface NumConfig {
  startDigits: number
  flashMs: number
  trials: number
}

export const NUM_DEFAULT: NumConfig = {
  startDigits: 4,
  flashMs: 500,
  trials: 12,
}

/**
 * Typical adult digit span is around 7 ± 2 for digits presented one per
 * second, and lower for a brief simultaneous flash. Twelve is past any real
 * ceiling; it exists so the slots still fit across a phone screen.
 */
export const MAX_DIGITS = 12
export const MIN_DIGITS = 3

export interface NumPreset {
  id: string
  name: string
  note: string
  config: NumConfig
}

export const NUM_PRESETS: NumPreset[] = [
  {
    id: 'easy',
    name: 'EASY',
    note: 'A long look at a short number',
    config: { ...NUM_DEFAULT, startDigits: 3, flashMs: 800 },
  },
  {
    id: 'standard',
    name: 'STANDARD',
    note: 'Half a second',
    config: { ...NUM_DEFAULT },
  },
  {
    id: 'hard',
    name: 'HARD',
    note: 'More to hold, same glance',
    config: { ...NUM_DEFAULT, startDigits: 5 },
  },
]

/** A digit string of the given length. The first digit is never zero. */
export function makeNumber(digits: number): string {
  let out = String(1 + Math.floor(Math.random() * 9))
  for (let i = 1; i < digits; i++) out += String(Math.floor(Math.random() * 10))
  return out
}

export const nextLength = (digits: number, correct: boolean): number =>
  correct ? Math.min(MAX_DIGITS, digits + 1) : Math.max(MIN_DIGITS, digits - 1)

export function numKey(config: NumConfig): string {
  return ['num', `${config.flashMs}ms`, `${config.trials}t`].join('/')
}

export const numLabel = (config: NumConfig): string =>
  `${config.flashMs}ms flash · from ${config.startDigits} digits`
