import { WORDS } from './words'

/** Which slot the next word lands in. */
export type SlotOrder = 'sequence' | 'random'

export interface RwConfig {
  cols: number
  rows: number
  order: SlotOrder
  /** Words per minute at the start of a session. */
  startWpm: number
  wordsPerRound: number
  rounds: number
}

export const RW_DEFAULT: RwConfig = {
  cols: 3,
  rows: 3,
  order: 'sequence',
  startWpm: 300,
  wordsPerRound: 10,
  rounds: 8,
}

export interface RwPreset {
  id: string
  name: string
  note: string
  config: RwConfig
}

export const RW_PRESETS: RwPreset[] = [
  {
    id: 'standard',
    name: 'STANDARD',
    note: 'Slots fill in order',
    config: { ...RW_DEFAULT },
  },
  {
    id: 'hard',
    name: 'HARD',
    note: 'Slots jump at random',
    config: { ...RW_DEFAULT, order: 'random', startWpm: 350 },
  },
]

/** Words per minute to milliseconds on screen. */
export const intervalMs = (wpm: number): number => Math.max(40, Math.round(60000 / wpm))

export const WPM_STEP = 50
export const WPM_FLOOR = 100

export const slotCount = (config: RwConfig): number => config.cols * config.rows

function shuffled<T>(items: readonly T[]): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export interface RwRound {
  /** The words shown, in order. The last one is what gets asked about. */
  words: string[]
  /** Slot index for each word. */
  slots: number[]
}

export function createRwRound(config: RwConfig): RwRound {
  const words = shuffled(WORDS).slice(0, config.wordsPerRound)
  const total = slotCount(config)
  const slots: number[] = []
  for (let i = 0; i < words.length; i++) {
    if (config.order === 'sequence') {
      slots.push(i % total)
    } else {
      // Never the same slot twice running: a word that does not move is not a
      // test of anything.
      let next = Math.floor(Math.random() * total)
      while (slots.length > 0 && next === slots[slots.length - 1]) {
        next = Math.floor(Math.random() * total)
      }
      slots.push(next)
    }
  }
  return { words, slots }
}

/**
 * Six candidates for "which word was last": the answer, then other words from
 * the same round. Distractors you actually saw make this a memory test rather
 * than a familiarity test.
 */
export function recallChoices(round: RwRound, count = 6): string[] {
  const answer = round.words[round.words.length - 1]
  const seen = shuffled(round.words.filter((w) => w !== answer)).slice(0, count - 1)
  const pool = shuffled(WORDS.filter((w) => !round.words.includes(w)))
  while (seen.length < count - 1) seen.push(pool.pop()!)
  return shuffled([answer, ...seen])
}

export function rwKey(config: RwConfig): string {
  return ['rw', `${config.rows}x${config.cols}`, config.order, `${config.wordsPerRound}w`].join('/')
}

export const rwLabel = (config: RwConfig): string =>
  `${config.rows} × ${config.cols} · ${config.order} · ${config.wordsPerRound} words`
