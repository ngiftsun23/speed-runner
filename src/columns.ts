import { WORDS } from './words'

export interface ColConfig {
  /** Fixations per line: 1 to 3. */
  cols: number
  /** Words inside one fixation: 1 to 4. */
  wordsPerCell: number
  rows: number
  /** Words per minute; adjustable mid-round. */
  wpm: number
}

export const COL_DEFAULT: ColConfig = {
  cols: 2,
  wordsPerCell: 1,
  rows: 16,
  wpm: 250,
}

export interface ColPreset {
  id: string
  name: string
  config: ColConfig
}

/** The ladder runs along two axes: more fixations per line, then wider chunks. */
export const COL_PRESETS: ColPreset[] = [
  { id: 'c1w1', name: 'ONE COLUMN', config: { ...COL_DEFAULT, cols: 1, wordsPerCell: 1 } },
  { id: 'c2w1', name: 'TWO COLUMNS', config: { ...COL_DEFAULT, cols: 2, wordsPerCell: 1 } },
  { id: 'c3w1', name: 'THREE COLUMNS', config: { ...COL_DEFAULT, cols: 3, wordsPerCell: 1 } },
  { id: 'c2w2', name: 'TWO WORDS', config: { ...COL_DEFAULT, cols: 2, wordsPerCell: 2 } },
  { id: 'c1w4', name: 'FOUR WORDS', config: { ...COL_DEFAULT, cols: 1, wordsPerCell: 4 } },
]

export const cellTotal = (config: ColConfig): number => config.cols * config.rows

export const WPM_STEP = 50
export const WPM_MIN = 100
export const WPM_MAX = 900

/**
 * How long one cell is held. A wider chunk is given proportionally longer, so
 * the words-per-minute figure means the same thing at every chunk size.
 */
export const cellMs = (config: ColConfig): number =>
  Math.max(60, Math.round((60000 / config.wpm) * config.wordsPerCell))

/** A page of cells in reading order: left to right, then down. */
export function buildPage(config: ColConfig): string[] {
  const pool = WORDS.slice()
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  let next = 0
  const take = () => {
    if (next >= pool.length) next = 0
    return pool[next++]
  }
  return Array.from({ length: cellTotal(config) }, () =>
    Array.from({ length: config.wordsPerCell }, take).join(' '),
  )
}

export function colKey(config: ColConfig): string {
  return ['col', `${config.cols}c`, `${config.wordsPerCell}w`, `${config.rows}r`].join('/')
}

export const colLabel = (config: ColConfig): string =>
  `${config.cols} column${config.cols === 1 ? '' : 's'} · ${config.wordsPerCell} word${config.wordsPerCell === 1 ? '' : 's'} per stop`
