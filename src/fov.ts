/** Field of vision: judge whether the letters at the edges of the grid match. */

export type FieldType = 'cross' | 'extended'

export interface FovConfig {
  /** Odd, 3–9: a cross needs a true centre row and column. */
  cols: number
  rows: number
  field: FieldType
  /** How long the field letters stay up. */
  flashMs: number
  /** Blank time before the next trial. */
  gapMs: number
  trials: number
}

export const FOV_DEFAULT: FovConfig = {
  cols: 7,
  rows: 7,
  field: 'cross',
  flashMs: 400,
  gapMs: 800,
  trials: 20,
}

export interface FovPreset {
  id: string
  name: string
  config: FovConfig
}

export const FOV_PRESETS: FovPreset[] = [
  { id: 'easy', name: 'EASY', config: { ...FOV_DEFAULT, cols: 5, rows: 5, flashMs: 600, gapMs: 900 } },
  { id: 'standard', name: 'STANDARD', config: { ...FOV_DEFAULT } },
  { id: 'hard', name: 'HARD', config: { ...FOV_DEFAULT, cols: 9, rows: 9, field: 'extended', flashMs: 300, gapMs: 700 } },
]

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export const fovCellCount = (config: FovConfig): number => config.cols * config.rows

export const fovCenter = (config: FovConfig): number =>
  ((config.rows - 1) / 2) * config.cols + (config.cols - 1) / 2

/**
 * The positions that carry the test letters. The cross uses the midpoint of
 * each edge; extended adds the four corners.
 */
export function fieldPositions(config: FovConfig): number[] {
  const { cols, rows } = config
  const midCol = (cols - 1) / 2
  const midRow = (rows - 1) / 2
  const positions = [
    midCol,
    (rows - 1) * cols + midCol,
    midRow * cols,
    midRow * cols + cols - 1,
  ]
  if (config.field === 'extended') {
    positions.push(0, cols - 1, (rows - 1) * cols, rows * cols - 1)
  }
  return positions
}

const randomLetter = () => LETTERS[Math.floor(Math.random() * LETTERS.length)]

/** Background clutter, fixed for the whole round. Field cells stay empty. */
export function fillerLetters(config: FovConfig): (string | null)[] {
  const field = new Set(fieldPositions(config))
  const centre = fovCenter(config)
  return Array.from({ length: fovCellCount(config) }, (_, i) =>
    i === centre || field.has(i) ? null : randomLetter(),
  )
}

export interface FovTrial {
  /** Letter shown at each field position, by grid index. */
  letters: Map<number, string>
  hasMismatch: boolean
}

export function createTrial(config: FovConfig): FovTrial {
  const positions = fieldPositions(config)
  const base = randomLetter()
  const letters = new Map(positions.map((p) => [p, base]))
  // Half the trials carry a mismatch, so sitting still is a real decision
  // rather than the answer that is right most of the time.
  const hasMismatch = Math.random() < 0.5
  if (hasMismatch) {
    let odd = randomLetter()
    while (odd === base) odd = randomLetter()
    letters.set(positions[Math.floor(Math.random() * positions.length)], odd)
  }
  return { letters, hasMismatch }
}

export interface FovScore {
  hits: number
  misses: number
  falseAlarms: number
  correctRejections: number
}

export const emptyScore = (): FovScore => ({
  hits: 0,
  misses: 0,
  falseAlarms: 0,
  correctRejections: 0,
})

export function scoreTrial(score: FovScore, hasMismatch: boolean, responded: boolean): void {
  if (hasMismatch && responded) score.hits++
  else if (hasMismatch) score.misses++
  else if (responded) score.falseAlarms++
  else score.correctRejections++
}

export const correctCount = (score: FovScore): number => score.hits + score.correctRejections

export function fovKey(config: FovConfig): string {
  return [
    'fov',
    `${config.rows}x${config.cols}`,
    config.field,
    `${config.flashMs}ms`,
    `${config.trials}t`,
  ].join('/')
}

export const fovLabel = (config: FovConfig): string =>
  `${config.rows} × ${config.cols} · ${config.field} · ${config.flashMs}ms`
