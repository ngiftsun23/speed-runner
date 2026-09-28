import { DEFAULT_CONFIG, sizeLabel, type Config } from './engine'

export interface Preset {
  id: string
  name: string
  config: Config
}

/** Presets are tap mode; only Custom carries Eyes mode. */
const preset = (over: Partial<Config>): Config => ({
  ...DEFAULT_CONFIG,
  eyes: false,
  ...over,
})

export const PRESETS: Preset[] = [
  {
    id: 'standard',
    name: 'STANDARD TABLE',
    config: preset({ cols: 5, rows: 5 }),
  },
  {
    id: 'random',
    name: 'RANDOM ORDER',
    config: preset({ cols: 5, rows: 5, order: 'random' }),
  },
  {
    id: 'gorbov',
    name: 'SCHULTE-GORBOV',
    config: preset({ cols: 5, rows: 5, order: 'gorbov', colored: true }),
  },
  {
    id: 'large',
    name: 'LARGE TABLE',
    config: preset({ cols: 5, rows: 6 }),
  },
  {
    id: 'hardcore',
    name: 'HARDCORE',
    config: preset({ cols: 5, rows: 5, order: 'random', shuffle: true, colored: true }),
  },
]

export const ORDER_BADGE: Record<Config['order'], string> = {
  sequential: '1→5',
  random: '1⤨ 5',
  gorbov: '1⇄25',
}

/** Compact description of what a config turns on, for the card badges. */
export function badgesFor(config: Config): string[] {
  const badges = [sizeLabel(config), ORDER_BADGE[config.order]]
  if (config.mode === 'letters') badges.push('letters')
  if (config.shuffle) badges.push('shuffle')
  if (config.colored && config.order !== 'gorbov') badges.push('colour')
  if (config.eyes) badges.push('eyes')
  return badges
}
