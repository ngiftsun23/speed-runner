export type Mode = 'numeric' | 'letters'

/** How the sequence of targets is built. */
export type Order =
  /** 1, 2, 3 … */
  | 'sequential'
  /** every target in a random order. */
  | 'random'
  /** two interleaved halves: 1, n, 2, n-1 … each half its own colour. */
  | 'gorbov'

export interface Config {
  cols: number
  rows: number
  mode: Mode
  order: Order
  /** Reshuffle the whole grid after every find. */
  shuffle: boolean
  /** Confirm with a button instead of tapping the cell. */
  eyes: boolean
  colored: boolean
}

export const DEFAULT_CONFIG: Config = {
  cols: 6,
  rows: 4,
  mode: 'numeric',
  order: 'sequential',
  shuffle: false,
  eyes: true,
  colored: false,
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export const cellCount = (config: Config): number => config.cols * config.rows

/**
 * Grid position left blank to hold the fixation point, or -1 when the grid has
 * no single centre cell. Only an odd × odd grid has one.
 */
export function centerIndex(config: Config): number {
  if (config.cols % 2 === 0 || config.rows % 2 === 0) return -1
  return ((config.rows - 1) / 2) * config.cols + (config.cols - 1) / 2
}

/** How many numbers the grid actually holds, once the centre is reserved. */
export const playableCount = (config: Config): number =>
  cellCount(config) - (centerIndex(config) === -1 ? 0 : 1)

export function labelsFor(config: Config): string[] {
  const n = playableCount(config)
  if (config.mode === 'letters') {
    if (n > LETTERS.length) {
      throw new Error(`letters mode supports at most ${LETTERS.length} cells, got ${n}`)
    }
    return Array.from({ length: n }, (_, i) => LETTERS[i])
  }
  return Array.from({ length: n }, (_, i) => String(i + 1))
}

export function shuffled<T>(items: readonly T[]): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Where the Gorbov split falls: labels before this index are the ascending half. */
export const gorbovSplit = (n: number): number => Math.ceil(n / 2)

/**
 * Gorbov colour group for a label: 0 for the ascending half, 1 for the
 * descending half. Returns 0 for every label outside Gorbov mode.
 */
export function gorbovGroup(config: Config, label: string): 0 | 1 {
  if (config.order !== 'gorbov') return 0
  const labels = labelsFor(config)
  return labels.indexOf(label) < gorbovSplit(labels.length) ? 0 : 1
}

export function buildSequence(config: Config): string[] {
  const labels = labelsFor(config)
  if (config.order === 'random') return shuffled(labels)
  if (config.order !== 'gorbov') return labels

  const split = gorbovSplit(labels.length)
  const ascending = labels.slice(0, split)
  const descending = labels.slice(split).reverse()
  const sequence: string[] = []
  for (let i = 0; i < ascending.length; i++) {
    sequence.push(ascending[i])
    if (i < descending.length) sequence.push(descending[i])
  }
  return sequence
}

/** Deal the labels into grid positions, leaving the centre cell empty. */
export function layoutCells(config: Config): (string | null)[] {
  const hole = centerIndex(config)
  const labels = shuffled(labelsFor(config))
  const cells: (string | null)[] = []
  let next = 0
  for (let i = 0; i < cellCount(config); i++) {
    cells.push(i === hole ? null : labels[next++])
  }
  return cells
}

export interface Round {
  config: Config
  /** Labels by grid position; null at the reserved centre cell. */
  cells: (string | null)[]
  /** Labels in the order they must be found. */
  sequence: string[]
  cursor: number
  /** Milliseconds spent on each find, in order. */
  splits: number[]
  errors: number
  startedAt: number
  lastFoundAt: number
  finishedAt: number | null
}

export function createRound(config: Config, now = performance.now()): Round {
  return {
    config,
    cells: layoutCells(config),
    sequence: buildSequence(config),
    cursor: 0,
    splits: [],
    errors: 0,
    startedAt: now,
    lastFoundAt: now,
    finishedAt: null,
  }
}

export function currentTarget(round: Round): string | null {
  return round.sequence[round.cursor] ?? null
}

export function isDone(round: Round): boolean {
  return round.cursor >= round.sequence.length
}

export function targetCellIndex(round: Round): number {
  const target = currentTarget(round)
  return target === null ? -1 : round.cells.indexOf(target)
}

/**
 * Accept the current target as found and advance.
 * Returns the grid position it was sitting at, so the UI can flash it.
 */
export function confirmFound(round: Round, now = performance.now()): number {
  const foundAt = targetCellIndex(round)
  round.splits.push(now - round.lastFoundAt)
  round.lastFoundAt = now
  round.cursor++
  if (isDone(round)) {
    round.finishedAt = now
  } else if (round.config.shuffle) {
    // Reshuffle the numbers, but the centre stays reserved.
    round.cells = layoutCells(round.config)
  }
  return foundAt
}

/** Tap input: advances on the right cell, counts an error on any other. */
export function tapCell(round: Round, position: number, now = performance.now()): boolean {
  if (round.cells[position] !== currentTarget(round)) {
    round.errors++
    return false
  }
  confirmFound(round, now)
  return true
}

export function elapsedMs(round: Round, now = performance.now()): number {
  return (round.finishedAt ?? now) - round.startedAt
}

/** Index of the slowest find, or -1 if nothing was recorded. */
export function slowestFind(round: Round): number {
  let worst = -1
  for (let i = 0; i < round.splits.length; i++) {
    if (worst === -1 || round.splits[i] > round.splits[worst]) worst = i
  }
  return worst
}

export function configKey(config: Config): string {
  return [
    `${config.cols}x${config.rows}`,
    config.mode,
    config.order,
    config.shuffle ? 'shuffle' : 'noshuffle',
    config.eyes ? 'eyes' : 'tap',
    config.colored ? 'color' : 'plain',
  ].join('/')
}

/**
 * Strip the drill prefix from a stored key. Keys written before the app held
 * more than one drill have no prefix, so they are returned unchanged.
 */
export function stripDrill(key: string): string {
  const parts = key.split('/')
  return parts.length > 6 ? parts.slice(1).join('/') : key
}

/** Rebuild a config from a stored key, for reading history back. */
export function parseConfigKey(key: string): Config {
  const [size, mode, order, shuffle, eyes, colour] = stripDrill(key).split('/')
  const [cols, rows] = size.split('x').map(Number)
  return {
    cols,
    rows,
    mode: mode === 'letters' ? 'letters' : 'numeric',
    order: order === 'random' || order === 'gorbov' ? order : 'sequential',
    shuffle: shuffle === 'shuffle',
    eyes: eyes === 'eyes',
    colored: colour === 'color',
  }
}

/** Grids are labelled rows × cols, matching the app this is modelled on. */
export const sizeLabel = (config: Config): string => `${config.rows} × ${config.cols}`
