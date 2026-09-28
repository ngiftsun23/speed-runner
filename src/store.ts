import { DEFAULT_CONFIG, configKey, type Config } from './engine'

export interface Result {
  at: number
  key: string
  seconds: number
  errors: number
}

const STORAGE_KEY = 'schulte.results.v1'

export function loadResults(): Result[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Result[]) : []
  } catch {
    return []
  }
}

export function saveResult(config: Config, seconds: number, errors: number): Result {
  const result: Result = { at: Date.now(), key: configKey(config), seconds, errors }
  try {
    const all = loadResults()
    all.push(result)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // Private mode or blocked storage: the round still counts, it just is not kept.
  }
  return result
}

export function resultsFor(config: Config): Result[] {
  const key = configKey(config)
  return loadResults().filter((r) => r.key === key)
}

/** Keep only results from the last `days`, or all of them when null. */
export function withinDays(results: Result[], days: number | null): Result[] {
  if (days === null) return results
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return results.filter((r) => r.at >= cutoff)
}

export function todayResultsFor(config: Config): Result[] {
  const midnight = new Date()
  midnight.setHours(0, 0, 0, 0)
  return resultsFor(config).filter((r) => r.at >= midnight.getTime())
}

const CUSTOM_KEY = 'schulte.custom.v1'

export function loadCustomConfig(): Config {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY)
    if (!raw) return { ...DEFAULT_CONFIG }
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<Config>) }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function saveCustomConfig(config: Config): void {
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(config))
  } catch {
    // Storage blocked: the config still applies for this session.
  }
}

export interface Summary {
  count: number
  best: number
  avg: number
}

export function summarise(results: Result[]): Summary | null {
  if (results.length === 0) return null
  const times = results.map((r) => r.seconds)
  const total = times.reduce((a, b) => a + b, 0)
  return {
    count: times.length,
    best: Math.min(...times),
    avg: total / times.length,
  }
}
