/**
 * Even numbers: a table of odd numbers hides a handful of even ones. Find and
 * tap every even number, then the next table. Timed, like a Schulte table —
 * the measure is how long the whole set takes.
 */

export interface EvenConfig {
  cols: number
  rows: number
  /** How many of the cells are even. */
  evens: number
  digits: number
  /** Tables to clear in one round. */
  tables: number
}

export const EVEN_DEFAULT: EvenConfig = {
  cols: 4,
  rows: 10,
  evens: 6,
  digits: 4,
  tables: 5,
}

export interface EvenPreset {
  id: string
  name: string
  note: string
  config: EvenConfig
}

export const EVEN_PRESETS: EvenPreset[] = [
  {
    id: 'easy',
    name: 'EASY',
    note: 'A smaller table, three digits',
    config: { ...EVEN_DEFAULT, rows: 7, digits: 3 },
  },
  {
    id: 'standard',
    name: 'STANDARD',
    note: 'Six evens in forty numbers',
    config: { ...EVEN_DEFAULT },
  },
  {
    id: 'hard',
    name: 'HARD',
    note: 'Longer numbers, more of them',
    config: { ...EVEN_DEFAULT, rows: 12, digits: 5 },
  },
]

export const cellsIn = (config: EvenConfig): number => config.cols * config.rows

const randomDigit = () => Math.floor(Math.random() * 10)

/** A number of the given length whose last digit has the requested parity. */
function numberWithParity(digits: number, even: boolean): string {
  let out = String(1 + Math.floor(Math.random() * 9))
  for (let i = 1; i < digits - 1; i++) out += String(randomDigit())
  const last = Math.floor(Math.random() * 5) * 2 + (even ? 0 : 1)
  return out + String(last)
}

export interface EvenTable {
  values: string[]
  /** Positions of the even numbers. */
  targets: Set<number>
}

export function buildTable(config: EvenConfig): EvenTable {
  const total = cellsIn(config)
  const positions = Array.from({ length: total }, (_, i) => i)
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[positions[i], positions[j]] = [positions[j], positions[i]]
  }
  const targets = new Set(positions.slice(0, config.evens))
  const values = Array.from({ length: total }, (_, i) =>
    numberWithParity(config.digits, targets.has(i)),
  )
  return { values, targets }
}

export function evenKey(config: EvenConfig): string {
  return ['even', `${config.rows}x${config.cols}`, `${config.digits}d`, `${config.tables}t`].join('/')
}

export const evenLabel = (config: EvenConfig): string =>
  `${config.evens} evens in ${cellsIn(config)} · ${config.digits} digits · ${config.tables} tables`
