import '@fontsource-variable/inter'
import '@fontsource-variable/syne'
import './style.css'
import {
  centerIndex,
  cellCount,
  confirmFound,
  createRound,
  currentTarget,
  elapsedMs,
  gorbovGroup,
  isDone,
  parseConfigKey,
  playableCount,
  sizeLabel,
  slowestFind,
  tapCell,
  type Config,
  type Round,
} from './engine'
import { PRESETS, badgesFor } from './presets'
import { EXERCISES } from './exercises'
import {
  FOV_DEFAULT,
  FOV_PRESETS,
  correctCount,
  createTrial,
  emptyScore,
  fieldPositions,
  fillerLetters,
  fovCellCount,
  fovCenter,
  fovKey,
  fovLabel,
  scoreTrial,
  type FovConfig,
} from './fov'
import {
  RW_DEFAULT,
  RW_PRESETS,
  WPM_FLOOR,
  WPM_STEP,
  createRwRound,
  intervalMs,
  recallChoices,
  rwKey,
  rwLabel,
  slotCount,
  type RwConfig,
} from './runningWords'
import {
  COL_DEFAULT,
  COL_PRESETS,
  WPM_MAX,
  WPM_MIN,
  WPM_STEP as COL_WPM_STEP,
  buildPage,
  cellMs,
  cellTotal,
  colKey,
  colLabel,
  type ColConfig,
} from './columns'
import {
  MAX_DIGITS,
  NUM_PRESETS,
  makeNumber,
  nextLength,
  numKey,
  numLabel,
  type NumConfig,
} from './numbers'
import {
  EVEN_PRESETS,
  buildTable,
  evenKey,
  evenLabel,
  type EvenConfig,
} from './evens'
import { coverArt } from './art'
import { timesChart } from './chart'
import {
  loadCustomConfig,
  loadResults,
  resultsFor,
  saveCustomConfig,
  saveResult,
  loadStored,
  resultsForKey,
  saveKeyedResult,
  saveStored,
  summarise,
  todayResultsFor,
  withinDays,
  type Result,
} from './store'

const CELL_HUES = [8, 32, 128, 200, 265, 320]
const GORBOV_HUES = [200, 8]
const FLASH_MS = 180
/** Must match the grid gap in the stylesheet. */
const GRID_GAP = 3

const APP_NAME = 'Speed Runner'
/** Columns of words runs for one minute; the other drills use their own limits. */
const ROUND_MS = 60000

type Tab = 'home' | 'practice' | 'stats' | 'profile'

const app = document.querySelector<HTMLDivElement>('#app')!

let tab: Tab = 'practice'
let custom: Config = loadCustomConfig()
let round: Round | null = null
let activeName = ''
let tickHandle = 0

const fmt = (seconds: number, digits = 1) => seconds.toFixed(digits)
const secs = (ms: number) => ms / 1000

/* ---------------- icons ---------------- */

const ICONS: Record<string, string> = {
  home: '<path d="M3 10.5 12 3l9 7.5V21H3z"/>',
  practice: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  stats: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
  profile: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  chart: '<path d="M4 19h16"/><path d="M7 19v-5M12 19V8M17 19v-8"/>',
  sliders: '<path d="M4 8h16M4 16h16"/><circle cx="9" cy="8" r="2"/><circle cx="15" cy="16" r="2"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  restart: '<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v4h4"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  eye: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.5"/>',
  flash: '<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>',
  columns: '<rect x="3" y="4" width="4" height="16" rx="1"/><rect x="10" y="4" width="4" height="16" rx="1"/><rect x="17" y="4" width="4" height="16" rx="1"/>',
  dot: '<circle cx="12" cy="12" r="3"/><path d="M3 6h5M16 6h5M3 18h5M16 18h5"/>',
  hash: '<path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
  keypad: '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="9" r="1.2"/><circle cx="9" cy="15" r="1.2"/><circle cx="15" cy="15" r="1.2"/>',
  palette: '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="9" r="1.4"/><circle cx="15" cy="9" r="1.4"/><circle cx="9" cy="15" r="1.4"/><circle cx="15" cy="15" r="1.4"/>',
}

const icon = (name: string, size = 22) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor"
    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`

/* ---------------- shell ---------------- */

const NAV: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'practice', label: 'Practice' },
  { id: 'stats', label: 'Stats' },
  { id: 'profile', label: 'Profile' },
]

function renderTab(): void {
  stopTick()
  round = null
  const body =
    tab === 'practice'
      ? practiceBody()
      : tab === 'stats'
        ? statsBody()
        : tab === 'home'
          ? homeBody()
          : profileBody()

  app.innerHTML = `
    <div class="shell">
      <header class="topbar"><h1>${APP_NAME}</h1></header>
      <div class="scroll">${body}</div>
      <nav class="nav">
        ${NAV.map(
          (item) => `
          <button class="nav__item${item.id === tab ? ' is-active' : ''}" data-tab="${item.id}">
            <span class="nav__icon">${icon(item.id)}</span>
            <span class="nav__label">${item.label}</span>
          </button>`,
        ).join('')}
      </nav>
    </div>
  `

  app.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      tab = button.dataset.tab as Tab
      renderTab()
    })
  })
  wireTabBody()
}

function wireTabBody(): void {
  app.querySelectorAll<HTMLElement>('[data-exercise]').forEach((tile) => {
    tile.addEventListener('click', () => {
      const id = tile.dataset.exercise
      if (id === 'schulte') renderSchulte()
      else if (id === 'field') renderFovList()
      else if (id === 'rsvp') renderRwList()
      else if (id === 'columns') renderColList()
      else if (id === 'numbers') renderNumList()
      else if (id === 'even') renderEvenList()
    })
  })
  app.querySelectorAll<HTMLElement>('[data-open]').forEach((element) => {
    element.addEventListener('click', () => {
      const id = element.dataset.open!
      if (id === 'custom') return openDrill(custom, 'CUSTOM TABLE')
      const found = PRESETS.find((p) => p.id === id)!
      openDrill(found.config, found.name)
    })
  })
  app.querySelector<HTMLButtonElement>('[data-settings]')?.addEventListener('click', (event) => {
    event.stopPropagation()
    renderCustomSettings()
  })
  app.querySelectorAll<HTMLElement>('[data-progress]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation()
      const id = button.dataset.progress!
      const found = PRESETS.find((p) => p.id === id)
      if (found) renderTableStats(found.config, found.name, renderTab)
      else renderTableStats(custom, 'CUSTOM TABLE', renderTab)
    })
  })
  app.querySelectorAll<HTMLElement>('[data-stats-key]').forEach((row) => {
    row.addEventListener('click', () => {
      const key = row.dataset.statsKey!
      renderTableStats(parseConfigKey(key), labelForKey(key), renderTab)
    })
  })
  app.querySelector<HTMLButtonElement>('#reset')?.addEventListener('click', () => {
    if (!confirm('Delete all saved times?')) return
    localStorage.removeItem('schulte.results.v1')
    renderTab()
  })
}

/* ---------------- practice ---------------- */

const badgeRow = (config: Config) =>
  badgesFor(config)
    .map((b) => `<span class="badge">${b}</span>`)
    .join('')

function card(id: string, name: string, config: Config, accent: 'preset' | 'custom'): string {
  const today = summarise(todayResultsFor(config))
  const isCustom = accent === 'custom'
  return `
    <div class="card card--${accent}" data-open="${id}">
      <div class="card__main">
        <div class="card__head">
          <p class="card__name">${name}</p>
          <button class="card__icon" ${isCustom ? 'data-settings' : `data-progress="${id}"`}
            aria-label="${isCustom ? 'Custom settings' : 'Progress'}">
            ${icon(isCustom ? 'sliders' : 'chart', 22)}
          </button>
        </div>
        <div class="card__badges">${badgeRow(config)}</div>
        ${today ? `<p class="card__today">today ${today.count} · best ${fmt(today.best)}s</p>` : ''}
      </div>
    </div>
  `
}

function practiceBody(): string {
  return `
    <h2 class="section">Exercises</h2>
    <div class="tiles">
      ${EXERCISES.map(
        (e) => `
        <button class="tile${e.status === 'soon' ? ' is-soon' : ''}"
          data-exercise="${e.id}" ${e.status === 'soon' ? 'disabled' : ''}>
          <span class="tile__icon">${icon(e.icon, 26)}</span>
          <span class="tile__name">${e.name}</span>
          <span class="tile__note">${e.status === 'ready' ? e.trains : 'Not built yet'}</span>
        </button>`,
      ).join('')}
    </div>
  `
}

/** The Schulte drill's own screen: its presets, then the custom table. */
function renderSchulte(): void {
  app.innerHTML = `
    <div class="shell">
      <header class="topbar topbar--back">
        <button class="back" id="back">←</button><h1>Schulte tables</h1>
      </header>
      <div class="scroll">
        <p class="drill__note">Hold the centre of the grid and find the next number with the edges of your vision. Finish every grid.</p>
        <section class="group">
          ${PRESETS.map((p) => card(p.id, p.name, p.config, 'preset')).join('')}
        </section>
        <h2 class="section">Your table</h2>
        <section class="group">
          ${card('custom', 'CUSTOM TABLE', custom, 'custom')}
        </section>
      </div>
    </div>
  `
  app.querySelector<HTMLButtonElement>('#back')!.addEventListener('click', renderTab)
  wireTabBody()
}

/* ---------------- custom settings ---------------- */

function renderCustomSettings(): void {
  const draft: Config = { ...custom }

  const toggle = (key: 'shuffle' | 'eyes' | 'colored', label: string, note: string) => `
    <button class="row row--toggle" data-toggle="${key}">
      <span class="row__text"><span class="row__label">${label}</span><span class="row__note">${note}</span></span>
      <span class="switch${draft[key] ? ' is-on' : ''}"></span>
    </button>`

  const draw = () => {
    app.innerHTML = `
      <div class="shell">
        <header class="topbar topbar--back">
          <button class="back" id="back">←</button><h1>Custom table</h1>
        </header>
        <div class="scroll">
          <section class="group">
            <div class="row">
              <span class="row__text"><span class="row__label">Columns</span></span>
              <span class="stepper">
                <button data-step="cols:-1">−</button><b>${draft.cols}</b><button data-step="cols:1">+</button>
              </span>
            </div>
            <div class="row">
              <span class="row__text"><span class="row__label">Rows</span></span>
              <span class="stepper">
                <button data-step="rows:-1">−</button><b>${draft.rows}</b><button data-step="rows:1">+</button>
              </span>
            </div>
            <div class="row">
              <span class="row__text"><span class="row__label">Mode</span></span>
              <span class="segmented">
                <button data-mode="numeric" class="${draft.mode === 'numeric' ? 'is-on' : ''}">Numeric</button>
                <button data-mode="letters" class="${draft.mode === 'letters' ? 'is-on' : ''}">Letters</button>
              </span>
            </div>
            ${toggle('shuffle', 'Shuffle mode', 'Grid reshuffles after each find. Much harder.')}
            ${toggle('eyes', 'Eyes mode', 'Confirm with a button instead of tapping the cell.')}
            ${toggle('colored', 'Colored mode', 'Cells get different colours. Extra clutter.')}
          </section>
          <p class="note">${playableCount(draft)} numbers · shown as ${sizeLabel(draft)}</p>
        </div>
      </div>
    `

    app.querySelector<HTMLButtonElement>('#back')!.addEventListener('click', () => {
      custom = draft
      saveCustomConfig(custom)
      renderTab()
    })
    app.querySelectorAll<HTMLButtonElement>('[data-step]').forEach((button) => {
      button.addEventListener('click', () => {
        const [key, delta] = button.dataset.step!.split(':')
        const next = draft[key as 'cols' | 'rows'] + Number(delta)
        if (next < 2 || next > 10) return
        draft[key as 'cols' | 'rows'] = next
        if (draft.mode === 'letters' && cellCount(draft) > 26) draft.mode = 'numeric'
        draw()
      })
    })
    app.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        const mode = button.dataset.mode as Config['mode']
        if (mode === 'letters' && cellCount(draft) > 26) return
        draft.mode = mode
        draw()
      })
    })
    app.querySelectorAll<HTMLButtonElement>('[data-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.dataset.toggle as 'shuffle' | 'eyes' | 'colored'
        draft[key] = !draft[key]
        draw()
      })
    })
  }

  draw()
}

/* ---------------- table statistics ---------------- */

const RANGES: { label: string; days: number | null }[] = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 180 days', days: 180 },
  { label: 'All time', days: null },
]

let rangeIndex = 0

function renderTableStats(config: Config, name: string, back: () => void): void {
  const draw = () => {
    const all = resultsFor(config)
    const inRange = withinDays(all, RANGES[rangeIndex].days)
    const overall = summarise(all)
    const ranged = summarise(inRange)

    app.innerHTML = `
      <div class="shell">
        <header class="topbar topbar--back">
          <button class="back" id="back">←</button><h1>Statistics</h1>
        </header>
        <div class="scroll">
          <section class="hero">
            <div class="hero__row">
              <div>
                <p class="hero__label">BEST TIME</p>
                <p class="card__today">${name}</p>
              </div>
              <div class="hero__value">${overall ? fmt(overall.best) : '—'}</div>
            </div>
            <div class="card__badges hero__badges">${badgeRow(config)}</div>
          </section>

          <div class="chips">
            ${RANGES.map(
              (r, i) =>
                `<button class="chip${i === rangeIndex ? ' is-on' : ''}" data-range="${i}">${r.label}</button>`,
            ).join('')}
          </div>

          <section class="group">
            <div class="stat stat--count">
              <span class="stat__label">NUMBER OF<br />COMPLETED TABLES</span>
              <span class="stat__value">${ranged ? ranged.count : 0}</span>
            </div>
            <div class="stat stat--avg">
              <span class="stat__label">AVERAGE TIME</span>
              <span class="stat__value">${ranged ? fmt(ranged.avg) : '—'}</span>
            </div>
          </section>

          ${timesChart(inRange.map((r) => ({ at: r.at, seconds: r.seconds })))}
        </div>
      </div>
    `

    app.querySelector<HTMLButtonElement>('#back')!.addEventListener('click', back)
    app.querySelectorAll<HTMLButtonElement>('[data-range]').forEach((chip) => {
      chip.addEventListener('click', () => {
        rangeIndex = Number(chip.dataset.range)
        draw()
      })
    })
    wireChartTaps()
  }

  draw()
}

/** Tap a point to read its value; the two labelled points stay labelled. */
function wireChartTaps(): void {
  const figure = app.querySelector<HTMLElement>('.chart')
  if (!figure) return
  const readout = document.createElement('p')
  readout.className = 'ch-readout'
  readout.textContent = 'Tap a point to read its time'
  figure.append(readout)
  figure.querySelectorAll<SVGCircleElement>('.ch-dot').forEach((dot) => {
    const show = () => {
      figure.querySelectorAll('.ch-dot').forEach((d) => d.classList.remove('is-picked'))
      dot.classList.add('is-picked')
      readout.textContent = `${dot.dataset.value} · ${dot.dataset.date}`
    }
    dot.addEventListener('click', show)
    dot.addEventListener('focus', show)
  })
}

/* ---------------- stats ---------------- */

/** Rebuild a readable label from a stored config key. */
function labelForKey(key: string): string {
  const [size, mode, order, shuffle, eyes, colour] = key.split('/')
  const [cols, rows] = size.split('x').map(Number)
  const bits = [`${rows} × ${cols}`]
  if (mode === 'letters') bits.push('letters')
  if (order !== 'sequential') bits.push(order)
  if (shuffle === 'shuffle') bits.push('shuffle')
  if (eyes === 'eyes') bits.push('eyes')
  if (colour === 'color') bits.push('colour')
  return bits.join(' · ')
}

function statsBody(): string {
  const all = loadResults()
  if (all.length === 0) return `<p class="note">No rounds yet.</p>`

  const groups = new Map<string, Result[]>()
  for (const result of all) {
    const list = groups.get(result.key)
    if (list) list.push(result)
    else groups.set(result.key, [result])
  }

  return `<section class="group">${[...groups.entries()]
    .map(([key, results]) => {
      const summary = summarise(results)!
      const recent = results.slice(-5).map((r) => fmt(r.seconds)).join(' · ')
      return `
        <div class="card card--flat" data-stats-key="${key}">
          <div class="card__main">
            <div class="card__head">
              <p class="card__name card__name--small">${labelForKey(key)}</p>
              <span class="card__icon">${icon('chart', 22)}</span>
            </div>
            <p class="card__today">${summary.count} rounds · best ${fmt(summary.best)}s · avg ${fmt(summary.avg)}s</p>
            <p class="card__today">last: ${recent}</p>
          </div>
        </div>`
    })
    .join('')}</section>`
}

function homeBody(): string {
  const today = summarise(todayResultsFor(custom))
  return `
    ${coverArt()}
    <h2 class="lede">Short daily drills for reading speed and concentration.</h2>
    <p class="body">
      Every exercise here trains one specific thing and times you at it, so you can
      see whether you are actually getting faster rather than guessing.
    </p>

    <h2 class="section">What you are training</h2>
    <ul class="bullets">
      <li><b>Visual search</b> — finding a target in a cluttered field without hunting row by row.</li>
      <li><b>Holding fixation</b> — keeping your eyes still while taking in what sits around them.</li>
      <li><b>Pace</b> — moving forward through text without stopping to re-read.</li>
      <li><b>Concentration</b> — staying on the task while something competes for your attention.</li>
    </ul>

    <h2 class="section">How to use it</h2>
    <p class="body">
      Five to eight minutes is a session: one warm-up you ignore, three timed rounds,
      then stop. Change one setting at a time, and only once the current one feels
      comfortable. Finish every grid you start.
    </p>

    <section class="group">
      <div class="card card--flat">
        <div class="card__main">
          <p class="card__name card__name--small">Today</p>
          ${today ? `<p class="card__today">${today.count} rounds · best ${fmt(today.best)}s · avg ${fmt(today.avg)}s on your custom table</p>` : `<p class="card__today">Nothing logged yet.</p>`}
        </div>
      </div>
    </section>

    <p class="footnote">
      These drills make you better at the drills. How much that carries over to
      ordinary reading is modest and varies by person — the timer is honest about
      the exercise, not about your reading speed.
    </p>
  `
}

function profileBody(): string {
  return `
    <section class="group">
      <div class="card card--flat">
        <div class="card__main">
          <p class="card__name card__name--small">Saved on this device</p>
          <p class="card__today">${loadResults().length} rounds</p>
        </div>
      </div>
    </section>
    <button class="ghost" id="reset">Delete all times</button>
  `
}

/* ---------------- drill ---------------- */

/**
 * The drill screen. It opens in a ready state: empty grid, fixation dot, and
 * START in the same slot the confirm button will occupy, so the button never
 * moves once the round is running.
 */
function openDrill(config: Config, name: string): void {
  stopTick()
  round = null
  activeName = name

  app.innerHTML = `
    <main class="screen">
      <header class="bar">
        <button class="bar__btn" id="quit" aria-label="Back to practice">${icon('back', 20)}</button>
        <span class="target" id="target">${name}</span>
        <span class="bar__right">
          <span class="clock" id="clock">0.0</span>
          <button class="bar__btn" id="restart" aria-label="Restart this grid">
            ${icon('restart', 20)}
          </button>
        </span>
      </header>
      <div class="gridwrap">
        <div class="grid" id="grid" style="--cols:${config.cols}"></div>
        <div class="dot"></div>
      </div>
      <button class="primary confirm" id="action">START</button>
      <p class="hint hint--bottom" id="hint">Fixate the dot, then press START</p>
    </main>
  `

  const grid = app.querySelector<HTMLDivElement>('#grid')!
  for (let i = 0; i < cellCount(config); i++) {
    const cell = document.createElement('div')
    cell.className = 'cell'
    grid.append(cell)
  }

  placeDot(config.cols, config.rows, !centerShowsTarget(config))

  const target = app.querySelector<HTMLElement>('#target')!
  target.classList.add('target--name')

  app.querySelector<HTMLButtonElement>('#quit')!.addEventListener('click', () => {
    stopTick()
    round = null
    renderTab()
  })
  app.querySelector<HTMLButtonElement>('#restart')!.addEventListener('click', () => {
    openDrill(config, name)
  })
  // One handler for the life of the screen. The button is START before a round
  // exists and CONFIRM afterwards; adding a second listener on start would
  // leave the first one live, restarting the round on every confirm.
  app.querySelector<HTMLButtonElement>('#action')!.addEventListener('click', () => {
    if (round) onConfirm()
    else beginRound(config)
  })
}

/**
 * Put the fixation dot on the nearest gridline intersection rather than the
 * exact centre. With an odd number of columns or rows the centre falls inside
 * a cell, where the dot would sit on top of a number.
 */
function placeDot(cols: number, rows: number, showDot: boolean): void {
  const wrap = app.querySelector<HTMLElement>('.gridwrap')
  const grid = app.querySelector<HTMLElement>('#grid')
  const dot = app.querySelector<HTMLElement>('.dot')
  if (!wrap || !grid || !dot) return

  // A grid that carries its own centre marker hides the separate dot.
  dot.hidden = !showDot

  const apply = () => {
    const wrapBox = wrap.getBoundingClientRect()
    if (wrapBox.width === 0 || wrapBox.height === 0) return

    // Square cells, sized so the whole grid fits the space it has. A tall grid
    // such as the 6-row Large table is limited by height, not width.
    const cell = Math.min(
      (wrapBox.width - GRID_GAP * (cols - 1)) / cols,
      (wrapBox.height - GRID_GAP * (rows - 1)) / rows,
    )
    if (cell <= 0) return
    grid.style.width = `${cell * cols + GRID_GAP * (cols - 1)}px`
    grid.style.setProperty('--cell', `${cell}px`)

    // The grid is centred in the wrap, so the wrap's centre is the geometric
    // centre of the grid rectangle. No nudging: this is the fixation point.
    dot.style.left = `${wrapBox.width / 2}px`
    dot.style.top = `${wrapBox.height / 2}px`
  }

  apply()
  new ResizeObserver(apply).observe(wrap)
}

function beginRound(config: Config): void {
  round = createRound(config)

  const action = app.querySelector<HTMLButtonElement>('#action')!
  const hint = app.querySelector<HTMLElement>('#hint')!
  const target = app.querySelector<HTMLElement>('#target')!
  const grid = app.querySelector<HTMLDivElement>('#grid')!

  target.classList.remove('target--name')

  // Nothing appears or disappears here: same elements, same heights, only the
  // text changes, so the grid does not move when the round starts.
  if (config.eyes) {
    action.textContent = 'CONFIRM'
    hint.textContent = 'Next number in mind before you confirm'
  } else {
    action.textContent = 'TAP IN ORDER'
    action.classList.add('is-static')
    action.disabled = true
    hint.textContent = 'Keep your gaze on the dot'
    grid.addEventListener('click', (event) => {
      const cell = (event.target as HTMLElement).closest('.cell')
      if (!cell || !round) return
      const position = Array.prototype.indexOf.call(grid.children, cell)
      if (tapCell(round, position)) {
        flash(position, 'found')
        afterAdvance()
      } else {
        flash(position, 'wrong')
      }
    })
  }

  paintCells()
  paintTarget()
  startTick()
}

/** Colour a label consistently, so colour is never a cue after a reshuffle. */
function hueFor(config: Config, label: string): number | null {
  if (config.order === 'gorbov') return GORBOV_HUES[gorbovGroup(config, label)]
  if (!config.colored) return null
  return CELL_HUES[(label.charCodeAt(0) + label.length) % CELL_HUES.length]
}

function paintCells(): void {
  const grid = app.querySelector<HTMLDivElement>('#grid')
  if (!grid || !round) return
  const config = round.config
  round.cells.forEach((label, i) => {
    const cell = grid.children[i] as HTMLElement
    const isHole = label === null
    // In random order the target cannot be worked out, so the reserved centre
    // cell carries it: you read the next number without leaving fixation.
    const showsTarget = isHole && centerShowsTarget(config)
    cell.textContent = (showsTarget ? currentTarget(round!) : label) ?? ''
    cell.classList.toggle('cell--hole', isHole && !showsTarget)
    cell.classList.toggle('cell--center-target', showsTarget)
    const hue = isHole ? null : hueFor(config, label)
    cell.classList.toggle('cell--colored', hue !== null)
    if (hue !== null) cell.style.setProperty('--hue', String(hue))
  })
}

const centerShowsTarget = (config: Config): boolean =>
  config.order === 'random' && centerIndex(config) !== -1

function paintTarget(): void {
  const el = app.querySelector<HTMLElement>('#target')
  if (!el || !round) return
  const target = currentTarget(round)
  el.textContent = target ?? '✓'
  const hue = target === null ? null : hueFor(round.config, target)
  el.style.color = hue === null ? '' : `hsl(${hue} 70% 68%)`
}

function onConfirm(): void {
  if (!round) return
  flash(confirmFound(round), 'found')
  afterAdvance()
}

function afterAdvance(): void {
  if (!round) return
  if (isDone(round)) return finish()
  if (round.config.shuffle || centerShowsTarget(round.config)) paintCells()
  paintTarget()
}

function flash(position: number, kind: 'found' | 'wrong'): void {
  const grid = app.querySelector<HTMLDivElement>('#grid')
  const cell = grid?.children[position] as HTMLElement | undefined
  if (!cell) return
  cell.classList.add(`cell--${kind}`)
  setTimeout(() => cell.classList.remove(`cell--${kind}`), FLASH_MS)
}

function startTick(): void {
  const clock = app.querySelector<HTMLElement>('#clock')
  const step = () => {
    if (!round || !clock) return
    clock.textContent = fmt(secs(elapsedMs(round)))
    tickHandle = requestAnimationFrame(step)
  }
  tickHandle = requestAnimationFrame(step)
}

function stopTick(): void {
  if (tickHandle) cancelAnimationFrame(tickHandle)
  tickHandle = 0
}

function finish(): void {
  stopTick()
  if (!round) return
  const finished = round
  const total = secs(elapsedMs(finished))
  const worst = slowestFind(finished)
  saveResult(finished.config, total, finished.errors)
  const today = summarise(todayResultsFor(finished.config))
  round = null

  app.innerHTML = `
    <main class="screen screen--center">
      <p class="eyebrow">${activeName}</p>
      <h1 class="title">${fmt(total)}s</h1>
      ${worst === -1 ? '' : `<p class="meta">slowest find: ${finished.sequence[worst]} — ${fmt(secs(finished.splits[worst]))}s</p>`}
      ${finished.errors > 0 ? `<p class="meta">${finished.errors} wrong tap${finished.errors === 1 ? '' : 's'}</p>` : ''}
      ${today ? `<p class="meta">today: ${today.count} · best ${fmt(today.best)}s · avg ${fmt(today.avg)}s</p>` : ''}
      <button class="primary" id="again">NEXT ROUND</button>
      <button class="ghost" id="done">Done</button>
    </main>
  `
  app
    .querySelector<HTMLButtonElement>('#again')!
    .addEventListener('click', () => openDrill(finished.config, activeName))
  app.querySelector<HTMLButtonElement>('#done')!.addEventListener('click', renderTab)
}


/* ---------------- field of vision ---------------- */

const FOV_STORE = 'speedrunner.fov.v1'
let fovCustom: FovConfig = loadStored<FovConfig>(FOV_STORE, { ...FOV_DEFAULT })
let fovTimer = 0

const clearFovTimer = () => {
  if (fovTimer) clearTimeout(fovTimer)
  fovTimer = 0
}

function fovCard(id: string, name: string, config: FovConfig, accent: 'preset' | 'custom'): string {
  const best = resultsForKey(fovKey(config)).reduce<number | null>(
    (b, r) => (r.score === undefined ? b : b === null || r.score > b ? r.score : b),
    null,
  )
  const isCustom = accent === 'custom'
  return `
    <div class="card card--${accent}" data-fov-open="${id}">
      <div class="card__main">
        <div class="card__head">
          <p class="card__name">${name}</p>
          ${isCustom ? `<button class="card__icon" data-fov-settings aria-label="Settings">${icon('sliders', 22)}</button>` : ''}
        </div>
        <div class="card__badges">
          <span class="badge">${config.rows} × ${config.cols}</span>
          <span class="badge">${config.field}</span>
          <span class="badge">${config.flashMs}ms</span>
          <span class="badge">${config.trials} trials</span>
        </div>
        ${best === null ? '' : `<p class="card__today">best ${best}/${config.trials}</p>`}
      </div>
    </div>`
}

function renderFovList(): void {
  app.innerHTML = `
    <div class="shell">
      <header class="topbar topbar--back">
        <button class="back" id="back">←</button><h1>Field of vision</h1>
      </header>
      <div class="scroll">
        <p class="drill__note">
          Hold the centre dot. Letters flash at the edges of the grid — if one of them
          does not match the others, press MISTAKE. Half the trials contain a mismatch,
          and pressing when there is none counts against you.
        </p>
        <section class="group">
          ${FOV_PRESETS.map((p) => fovCard(p.id, p.name, p.config, 'preset')).join('')}
        </section>
        <h2 class="section">Your field</h2>
        <section class="group">${fovCard('custom', 'CUSTOM FIELD', fovCustom, 'custom')}</section>
      </div>
    </div>`

  app.querySelector<HTMLButtonElement>('#back')!.addEventListener('click', renderTab)
  app.querySelectorAll<HTMLElement>('[data-fov-open]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.fovOpen!
      if (id === 'custom') return openFov(fovCustom, 'CUSTOM FIELD')
      const found = FOV_PRESETS.find((p) => p.id === id)!
      openFov(found.config, found.name)
    })
  })
  app.querySelector<HTMLElement>('[data-fov-settings]')?.addEventListener('click', (event) => {
    event.stopPropagation()
    renderFovSettings()
  })
}

function renderFovSettings(): void {
  const draft: FovConfig = { ...fovCustom }
  const ODD = [3, 5, 7, 9]
  const FLASH = [600, 400, 300, 200, 150]

  const draw = () => {
    app.innerHTML = `
      <div class="shell">
        <header class="topbar topbar--back">
          <button class="back" id="back">←</button><h1>Custom field</h1>
        </header>
        <div class="scroll">
          <section class="group">
            <div class="row row--stack">
              <span class="row__text"><span class="row__label">Rows</span></span>
              <span class="segmented">
                ${ODD.map((n) => `<button data-rows="${n}" class="${draft.rows === n ? 'is-on' : ''}">${n}</button>`).join('')}
              </span>
            </div>
            <div class="row row--stack">
              <span class="row__text"><span class="row__label">Columns</span></span>
              <span class="segmented">
                ${ODD.map((n) => `<button data-cols="${n}" class="${draft.cols === n ? 'is-on' : ''}">${n}</button>`).join('')}
              </span>
            </div>
            <div class="row row--stack">
              <span class="row__text">
                <span class="row__label">Field type</span>
                <span class="row__note">Cross uses the middle of each edge. Extended adds the corners.</span>
              </span>
              <span class="segmented">
                <button data-field="cross" class="${draft.field === 'cross' ? 'is-on' : ''}">Cross</button>
                <button data-field="extended" class="${draft.field === 'extended' ? 'is-on' : ''}">Extended</button>
              </span>
            </div>
            <div class="row row--stack">
              <span class="row__text">
                <span class="row__label">Flash time</span>
                <span class="row__note">How long the letters stay up.</span>
              </span>
              <span class="segmented">
                ${FLASH.map((n) => `<button data-flash="${n}" class="${draft.flashMs === n ? 'is-on' : ''}">${n}</button>`).join('')}
              </span>
            </div>
          </section>
          <p class="note">Only odd sizes: a cross needs a true centre row and column.</p>
        </div>
      </div>`

    app.querySelector<HTMLButtonElement>('#back')!.addEventListener('click', () => {
      fovCustom = draft
      saveStored(FOV_STORE, fovCustom)
      renderFovList()
    })
    const pick = (attr: string, apply: (value: string) => void) =>
      app.querySelectorAll<HTMLElement>(`[data-${attr}]`).forEach((b) =>
        b.addEventListener('click', () => {
          apply(b.dataset[attr]!)
          draw()
        }),
      )
    pick('rows', (v) => (draft.rows = Number(v)))
    pick('cols', (v) => (draft.cols = Number(v)))
    pick('field', (v) => (draft.field = v as FovConfig['field']))
    pick('flash', (v) => (draft.flashMs = Number(v)))
  }

  draw()
}

function openFov(config: FovConfig, name: string): void {
  clearFovTimer()
  const filler = fillerLetters(config)
  const field = fieldPositions(config)
  const centre = fovCenter(config)
  const score = emptyScore()
  let trialIndex = 0
  let responded = false
  let running = false

  app.innerHTML = `
    <main class="screen">
      <header class="bar">
        <button class="bar__btn" id="quit" aria-label="Back">${icon('back', 20)}</button>
        <span class="target target--name">${name}</span>
        <span class="bar__right">
          <span class="clock" id="progress">0/${config.trials}</span>
        </span>
      </header>
      <div class="progress"><span class="progress__fill" id="fill"></span></div>
      <div class="gridwrap">
        <div class="grid" id="grid" style="--cols:${config.cols}"></div>
        <div class="dot" hidden></div>
      </div>
      <button class="primary confirm" id="action">START</button>
      <p class="hint hint--bottom" id="hint">Fixate the centre dot, then press START</p>
    </main>`

  const grid = app.querySelector<HTMLDivElement>('#grid')!
  for (let i = 0; i < fovCellCount(config); i++) {
    const cell = document.createElement('div')
    cell.className = 'cell cell--quiet'
    if (i === centre) {
      cell.classList.add('cell--hole')
      cell.textContent = '·'
    } else if (field.includes(i)) {
      cell.classList.add('cell--field')
      cell.textContent = '·'
    } else {
      cell.textContent = filler[i] ?? ''
    }
    grid.append(cell)
  }
  placeDot(config.cols, config.rows, false)

  const action = app.querySelector<HTMLButtonElement>('#action')!
  const hint = app.querySelector<HTMLElement>('#hint')!
  const progress = app.querySelector<HTMLElement>('#progress')!
  const fill = app.querySelector<HTMLElement>('#fill')!

  const showField = (letters: Map<number, string> | null) => {
    field.forEach((i) => {
      const cell = grid.children[i] as HTMLElement
      cell.textContent = letters?.get(i) ?? '·'
      cell.classList.toggle('cell--field', letters === null)
    })
  }

  const endTrial = (hasMismatch: boolean) => {
    scoreTrial(score, hasMismatch, responded)
    trialIndex++
    progress.textContent = `${trialIndex}/${config.trials}`
    fill.style.width = `${(trialIndex / config.trials) * 100}%`
    if (trialIndex >= config.trials) return finishFov(config, name, score)
    fovTimer = window.setTimeout(nextTrial, 200)
  }

  const nextTrial = () => {
    // The response window runs through the flash and the blank after it, so a
    // late tap still counts — what matters is noticing, not reflex speed.
    responded = false
    const trial = createTrial(config)
    showField(trial.letters)
    fovTimer = window.setTimeout(() => {
      showField(null)
      fovTimer = window.setTimeout(() => endTrial(trial.hasMismatch), config.gapMs)
    }, config.flashMs)
  }

  action.addEventListener('click', () => {
    if (!running) {
      running = true
      action.textContent = 'MISTAKE'
      hint.textContent = 'Press when one letter does not match'
      nextTrial()
      return
    }
    responded = true
    action.classList.add('is-pressed')
    setTimeout(() => action.classList.remove('is-pressed'), 120)
  })

  app.querySelector<HTMLButtonElement>('#quit')!.addEventListener('click', () => {
    clearFovTimer()
    renderFovList()
  })
}

function finishFov(config: FovConfig, name: string, score: ReturnType<typeof emptyScore>): void {
  clearFovTimer()
  const correct = correctCount(score)
  saveKeyedResult(fovKey(config), {
    seconds: 0,
    errors: score.misses + score.falseAlarms,
    score: correct,
    trials: config.trials,
  })
  const best = resultsForKey(fovKey(config)).reduce(
    (b, r) => (r.score !== undefined && r.score > b ? r.score : b),
    0,
  )

  app.innerHTML = `
    <main class="screen screen--center">
      <p class="eyebrow">${name}</p>
      <h1 class="title">${correct}/${config.trials}</h1>
      <p class="meta">${fovLabel(config)}</p>
      <p class="meta">${score.hits} caught · ${score.misses} missed · ${score.falseAlarms} false</p>
      <p class="meta">best ${best}/${config.trials}</p>
      <button class="primary" id="again">NEXT ROUND</button>
      <button class="ghost" id="done">Done</button>
    </main>`
  app.querySelector<HTMLButtonElement>('#again')!.addEventListener('click', () => openFov(config, name))
  app.querySelector<HTMLButtonElement>('#done')!.addEventListener('click', renderFovList)
}


/* ---------------- running words ---------------- */

const RW_STORE = 'speedrunner.rw.v1'
let rwCustom: RwConfig = loadStored<RwConfig>(RW_STORE, { ...RW_DEFAULT })
let rwTimer = 0

const clearRwTimer = () => {
  if (rwTimer) clearTimeout(rwTimer)
  rwTimer = 0
}

function rwCard(id: string, name: string, note: string, config: RwConfig, accent: 'preset' | 'custom'): string {
  const best = resultsForKey(rwKey(config)).reduce(
    (b, r) => (r.score !== undefined && r.score > b ? r.score : b),
    0,
  )
  return `
    <div class="card card--${accent}" data-rw-open="${id}">
      <div class="card__main">
        <div class="card__head">
          <p class="card__name">${name}</p>
          ${accent === 'custom' ? `<button class="card__icon" data-rw-settings aria-label="Settings">${icon('sliders', 22)}</button>` : ''}
        </div>
        <p class="card__today">${note}</p>
        <div class="card__badges">
          <span class="badge">${config.rows} × ${config.cols}</span>
          <span class="badge">from ${config.startWpm} wpm</span>
          <span class="badge">${config.rounds} rounds</span>
        </div>
        ${best > 0 ? `<p class="card__today">best ${best} wpm</p>` : ''}
      </div>
    </div>`
}

function renderRwList(): void {
  app.innerHTML = `
    <div class="shell">
      <header class="topbar topbar--back">
        <button class="back" id="back">←</button><h1>Running words</h1>
      </header>
      <div class="scroll">
        <p class="drill__note">
          Words appear one at a time across the grid. Keep your gaze in the middle
          rather than chasing them, and remember the <b>last</b> word of each round.
          Answer correctly and the speed goes up; miss it and it comes back down.
        </p>
        <section class="group">
          ${RW_PRESETS.map((p) => rwCard(p.id, p.name, p.note, p.config, 'preset')).join('')}
        </section>
        <h2 class="section">Your setup</h2>
        <section class="group">${rwCard('custom', 'CUSTOM', 'Your own pace and length', rwCustom, 'custom')}</section>
      </div>
    </div>`

  app.querySelector<HTMLButtonElement>('#back')!.addEventListener('click', renderTab)
  app.querySelectorAll<HTMLElement>('[data-rw-open]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.rwOpen!
      if (id === 'custom') return openRw(rwCustom, 'CUSTOM')
      const found = RW_PRESETS.find((p) => p.id === id)!
      openRw(found.config, found.name)
    })
  })
  app.querySelector<HTMLElement>('[data-rw-settings]')?.addEventListener('click', (event) => {
    event.stopPropagation()
    renderRwSettings()
  })
}

function renderRwSettings(): void {
  const draft: RwConfig = { ...rwCustom }
  const SPEEDS = [150, 200, 250, 300, 400]
  const LENGTHS = [6, 8, 10, 12]
  const SIZES = [3, 4, 5]

  const draw = () => {
    app.innerHTML = `
      <div class="shell">
        <header class="topbar topbar--back">
          <button class="back" id="back">←</button><h1>Custom words</h1>
        </header>
        <div class="scroll">
          <section class="group">
            <div class="row row--stack">
              <span class="row__text"><span class="row__label">Grid</span>
                <span class="row__note">Slots the words can appear in.</span></span>
              <span class="segmented">
                ${SIZES.map((n) => `<button data-size="${n}" class="${draft.cols === n ? 'is-on' : ''}">${n}×${n}</button>`).join('')}
              </span>
            </div>
            <div class="row row--stack">
              <span class="row__text"><span class="row__label">Order</span>
                <span class="row__note">Sequence fills the slots in turn. Random jumps.</span></span>
              <span class="segmented">
                <button data-order="sequence" class="${draft.order === 'sequence' ? 'is-on' : ''}">Sequence</button>
                <button data-order="random" class="${draft.order === 'random' ? 'is-on' : ''}">Random</button>
              </span>
            </div>
            <div class="row row--stack">
              <span class="row__text"><span class="row__label">Starting speed</span>
                <span class="row__note">Words per minute. It adapts as you go.</span></span>
              <span class="segmented">
                ${SPEEDS.map((n) => `<button data-wpm="${n}" class="${draft.startWpm === n ? 'is-on' : ''}">${n}</button>`).join('')}
              </span>
            </div>
            <div class="row row--stack">
              <span class="row__text"><span class="row__label">Words per round</span></span>
              <span class="segmented">
                ${LENGTHS.map((n) => `<button data-len="${n}" class="${draft.wordsPerRound === n ? 'is-on' : ''}">${n}</button>`).join('')}
              </span>
            </div>
          </section>
        </div>
      </div>`

    app.querySelector<HTMLButtonElement>('#back')!.addEventListener('click', () => {
      rwCustom = draft
      saveStored(RW_STORE, rwCustom)
      renderRwList()
    })
    const pick = (attr: string, apply: (value: string) => void) =>
      app.querySelectorAll<HTMLElement>(`[data-${attr}]`).forEach((b) =>
        b.addEventListener('click', () => {
          apply(b.dataset[attr]!)
          draw()
        }),
      )
    pick('size', (v) => {
      draft.cols = Number(v)
      draft.rows = Number(v)
    })
    pick('order', (v) => (draft.order = v as RwConfig['order']))
    pick('wpm', (v) => (draft.startWpm = Number(v)))
    pick('len', (v) => (draft.wordsPerRound = Number(v)))
  }

  draw()
}

function openRw(config: RwConfig, name: string): void {
  clearRwTimer()
  let wpm = config.startWpm
  let roundIndex = 0
  let bestCorrect = 0

  const shell = (body: string) => `
    <main class="screen">
      <header class="bar">
        <button class="bar__btn" id="quit" aria-label="Back">${icon('back', 20)}</button>
        <span class="target target--name">${name}</span>
        <span class="bar__right"><span class="clock" id="speed">${wpm} wpm</span></span>
      </header>
      ${body}
    </main>`

  const wireQuit = () =>
    app.querySelector<HTMLButtonElement>('#quit')!.addEventListener('click', () => {
      clearRwTimer()
      renderRwList()
    })

  const showReady = () => {
    app.innerHTML = shell(`
      <div class="progress"><span class="progress__fill" id="fill"></span></div>
      <div class="gridwrap">
        <div class="slots" id="slots" style="--cols:${config.cols}"></div>
      </div>
      <button class="primary confirm" id="action">START</button>
      <p class="hint hint--bottom">Round ${roundIndex + 1} of ${config.rounds} · hold the middle, remember the last word</p>`)
    buildSlots()
    wireQuit()
    app.querySelector<HTMLButtonElement>('#action')!.addEventListener('click', runRound)
  }

  const buildSlots = () => {
    const host = app.querySelector<HTMLDivElement>('#slots')!
    host.innerHTML = ''
    for (let i = 0; i < slotCount(config); i++) {
      const slot = document.createElement('span')
      slot.className = 'slot'
      host.append(slot)
    }
  }

  const runRound = () => {
    const round = createRwRound(config)
    const gap = intervalMs(wpm)
    app.innerHTML = shell(`
      <div class="progress"><span class="progress__fill" id="fill"></span></div>
      <div class="gridwrap">
        <div class="slots" id="slots" style="--cols:${config.cols}"></div>
      </div>
      <div class="confirm confirm--spacer"></div>
      <p class="hint hint--bottom">Remember the last word</p>`)
    buildSlots()
    wireQuit()
    const slots = app.querySelector<HTMLDivElement>('#slots')!
    const fill = app.querySelector<HTMLElement>('#fill')!

    let i = 0
    const step = () => {
      if (i > 0) (slots.children[round.slots[i - 1]] as HTMLElement).textContent = ''
      if (i >= round.words.length) return askRecall(round)
      const cell = slots.children[round.slots[i]] as HTMLElement
      cell.textContent = round.words[i]
      fill.style.width = `${((i + 1) / round.words.length) * 100}%`
      i++
      rwTimer = window.setTimeout(step, gap)
    }
    step()
  }

  const askRecall = (round: ReturnType<typeof createRwRound>) => {
    const answer = round.words[round.words.length - 1]
    const choices = recallChoices(round)
    // Same skeleton as the ready and running states - progress bar, content
    // area, action button - so only the middle changes between rounds.
    app.innerHTML = shell(`
      <div class="progress"><span class="progress__fill" style="width:100%"></span></div>
      <div class="gridwrap">
        <div class="choices">
          ${choices.map((w) => `<button class="choice" data-word="${w}">${w}</button>`).join('')}
        </div>
      </div>
      <button class="primary confirm is-static" data-word="">I DON'T KNOW</button>
      <p class="hint hint--bottom">Which word came last?</p>`)
    wireQuit()
    let answered = false
    app.querySelectorAll<HTMLElement>('[data-word]').forEach((button) => {
      button.addEventListener('click', () => {
        if (answered) return
        answered = true
        const correct = button.dataset.word === answer

        // Show what the answer was before moving on: a wrong pick goes red and
        // the right one goes green, so a miss still teaches you the word.
        if (!correct && button.classList.contains('choice')) button.classList.add('is-wrong')
        app
          .querySelectorAll<HTMLElement>('.choice')
          .forEach((c) => c.dataset.word === answer && c.classList.add('is-right'))

        if (correct) {
          bestCorrect = Math.max(bestCorrect, wpm)
          wpm += WPM_STEP
        } else {
          wpm = Math.max(WPM_FLOOR, wpm - WPM_STEP)
        }
        roundIndex++
        rwTimer = window.setTimeout(() => {
          if (roundIndex >= config.rounds) return finishRw(config, name, bestCorrect, wpm)
          showReady()
        }, correct ? 450 : 900)
      })
    })
  }

  showReady()
}

function finishRw(config: RwConfig, name: string, best: number, ended: number): void {
  clearRwTimer()
  saveKeyedResult(rwKey(config), { seconds: 0, errors: 0, score: best, trials: config.rounds })
  const allTime = resultsForKey(rwKey(config)).reduce(
    (b, r) => (r.score !== undefined && r.score > b ? r.score : b),
    0,
  )

  app.innerHTML = `
    <main class="screen screen--center">
      <p class="eyebrow">${name}</p>
      <h1 class="title">${best || '—'}</h1>
      <p class="meta">fastest speed you answered correctly, in words per minute</p>
      <p class="meta">${rwLabel(config)} · finished at ${ended} wpm</p>
      <p class="meta">best ever ${allTime} wpm</p>
      <button class="primary" id="again">AGAIN</button>
      <button class="ghost" id="done">Done</button>
    </main>`
  app.querySelector<HTMLButtonElement>('#again')!.addEventListener('click', () => openRw(config, name))
  app.querySelector<HTMLButtonElement>('#done')!.addEventListener('click', renderRwList)
}


/* ---------------- columns of words ---------------- */

const COL_STORE = 'speedrunner.col.v1'
let colCustom: ColConfig = loadStored<ColConfig>(COL_STORE, { ...COL_DEFAULT })
let colTimer = 0

const clearColTimer = () => {
  if (colTimer) clearTimeout(colTimer)
  colTimer = 0
}

function colCard(id: string, name: string, config: ColConfig, accent: 'preset' | 'custom'): string {
  const best = resultsForKey(colKey(config)).reduce(
    (b, r) => (r.score !== undefined && r.score > b ? r.score : b),
    0,
  )
  return `
    <div class="card card--${accent}" data-col-open="${id}">
      <div class="card__main">
        <div class="card__head">
          <p class="card__name">${name}</p>
          ${accent === 'custom' ? `<button class="card__icon" data-col-settings aria-label="Settings">${icon('sliders', 22)}</button>` : ''}
        </div>
        <p class="card__today">${colLabel(config)}</p>
        <div class="card__badges">
          <span class="badge">${config.rows} lines</span>
          <span class="badge">from ${config.wpm} wpm</span>
        </div>
        ${best > 0 ? `<p class="card__today">held ${best} wpm</p>` : ''}
      </div>
    </div>`
}

function renderColList(): void {
  app.innerHTML = `
    <div class="shell">
      <header class="topbar topbar--back">
        <button class="back" id="back">←</button><h1>Columns of words</h1>
      </header>
      <div class="scroll">
        <p class="drill__note">
          A band moves through the page one stop at a time. Take each highlighted group
          in a single look and let the band pull you along — do not go back. More
          columns means more stops per line; more words per stop means a wider group.
        </p>
        <section class="group">
          ${COL_PRESETS.map((p) => colCard(p.id, p.name, p.config, 'preset')).join('')}
        </section>
        <h2 class="section">Your setup</h2>
        <section class="group">${colCard('custom', 'CUSTOM', colCustom, 'custom')}</section>
      </div>
    </div>`

  app.querySelector<HTMLButtonElement>('#back')!.addEventListener('click', renderTab)
  app.querySelectorAll<HTMLElement>('[data-col-open]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.colOpen!
      if (id === 'custom') return openCol(colCustom, 'CUSTOM')
      const found = COL_PRESETS.find((p) => p.id === id)!
      openCol(found.config, found.name)
    })
  })
  app.querySelector<HTMLElement>('[data-col-settings]')?.addEventListener('click', (event) => {
    event.stopPropagation()
    renderColSettings()
  })
}

function renderColSettings(): void {
  const draft: ColConfig = { ...colCustom }
  const COLS = [1, 2, 3]
  const WORDS_PER = [1, 2, 3, 4]
  const LINES = [8, 12, 16, 20]
  const SPEEDS = [150, 200, 250, 300, 400]

  const draw = () => {
    app.innerHTML = `
      <div class="shell">
        <header class="topbar topbar--back">
          <button class="back" id="back">←</button><h1>Custom columns</h1>
        </header>
        <div class="scroll">
          <section class="group">
            <div class="row row--stack">
              <span class="row__text"><span class="row__label">Columns</span>
                <span class="row__note">Stops per line.</span></span>
              <span class="segmented">
                ${COLS.map((n) => `<button data-c="${n}" class="${draft.cols === n ? 'is-on' : ''}">${n}</button>`).join('')}
              </span>
            </div>
            <div class="row row--stack">
              <span class="row__text"><span class="row__label">Words per stop</span>
                <span class="row__note">How wide a group each look has to take.</span></span>
              <span class="segmented">
                ${WORDS_PER.map((n) => `<button data-w="${n}" class="${draft.wordsPerCell === n ? 'is-on' : ''}">${n}</button>`).join('')}
              </span>
            </div>
            <div class="row row--stack">
              <span class="row__text"><span class="row__label">Lines</span></span>
              <span class="segmented">
                ${LINES.map((n) => `<button data-r="${n}" class="${draft.rows === n ? 'is-on' : ''}">${n}</button>`).join('')}
              </span>
            </div>
            <div class="row row--stack">
              <span class="row__text"><span class="row__label">Starting speed</span>
                <span class="row__note">Words per minute. Adjustable while running.</span></span>
              <span class="segmented">
                ${SPEEDS.map((n) => `<button data-s="${n}" class="${draft.wpm === n ? 'is-on' : ''}">${n}</button>`).join('')}
              </span>
            </div>
          </section>
        </div>
      </div>`

    app.querySelector<HTMLButtonElement>('#back')!.addEventListener('click', () => {
      colCustom = draft
      saveStored(COL_STORE, colCustom)
      renderColList()
    })
    const pick = (attr: string, apply: (value: number) => void) =>
      app.querySelectorAll<HTMLElement>(`[data-${attr}]`).forEach((b) =>
        b.addEventListener('click', () => {
          apply(Number(b.dataset[attr]!))
          draw()
        }),
      )
    pick('c', (v) => (draft.cols = v))
    pick('w', (v) => (draft.wordsPerCell = v))
    pick('r', (v) => (draft.rows = v))
    pick('s', (v) => (draft.wpm = v))
  }

  draw()
}

function openCol(config: ColConfig, name: string): void {
  clearColTimer()
  const page = buildPage(config)
  let wpm = config.wpm
  let index = -1
  let running = false

  app.innerHTML = `
    <main class="screen">
      <header class="bar">
        <button class="bar__btn" id="quit" aria-label="Back">${icon('back', 20)}</button>
        <span class="target target--name">${name}</span>
        <span class="bar__right"><span class="clock" id="speed">${wpm} wpm</span></span>
      </header>
      <div class="progress"><span class="progress__fill" id="fill"></span></div>
      <div class="gridwrap gridwrap--page">
        <div class="page" id="page" style="--cols:${config.cols}">
          ${page.map((cell) => `<span class="pcell">${cell}</span>`).join('')}
        </div>
      </div>
      <div class="pacer">
        <button class="pacer__btn" id="slower" aria-label="Slower">◀◀</button>
        <button class="primary pacer__go" id="action">START</button>
        <button class="pacer__btn" id="faster" aria-label="Faster">▶▶</button>
      </div>
      <p class="hint hint--bottom">One look per highlighted group. Never go back.</p>
    </main>`

  const cells = app.querySelectorAll<HTMLElement>('.pcell')
  const speedOut = app.querySelector<HTMLElement>('#speed')!
  const fill = app.querySelector<HTMLElement>('#fill')!
  const action = app.querySelector<HTMLButtonElement>('#action')!
  let deadline = 0
  let wordsRead = 0

  const refill = () => {
    const fresh = buildPage(config)
    cells.forEach((cell, i) => (cell.textContent = fresh[i]))
  }

  const step = () => {
    if (index >= 0) cells[index].classList.remove('is-on')
    if (performance.now() >= deadline) return finishCol(config, name, wpm, wordsRead)
    index++
    // A page lasts seconds, not a minute, so it is refilled and the run
    // continues until the time is up.
    if (index >= cells.length) {
      refill()
      index = 0
    }
    cells[index].classList.add('is-on')
    wordsRead += config.wordsPerCell
    const left = Math.max(0, deadline - performance.now())
    fill.style.width = `${100 - (left / ROUND_MS) * 100}%`
    speedOut.textContent = `${wpm} wpm · ${Math.ceil(left / 1000)}s`
    colTimer = window.setTimeout(step, cellMs({ ...config, wpm }))
  }

  const setSpeed = (delta: number) => {
    wpm = Math.min(WPM_MAX, Math.max(WPM_MIN, wpm + delta))
    if (!running) speedOut.textContent = `${wpm} wpm`
  }

  app.querySelector<HTMLButtonElement>('#slower')!.addEventListener('click', () => setSpeed(-COL_WPM_STEP))
  app.querySelector<HTMLButtonElement>('#faster')!.addEventListener('click', () => setSpeed(COL_WPM_STEP))
  app.querySelector<HTMLButtonElement>('#quit')!.addEventListener('click', () => {
    clearColTimer()
    renderColList()
  })
  action.addEventListener('click', () => {
    if (running) return
    running = true
    action.textContent = 'RUNNING'
    action.classList.add('is-static')
    action.disabled = true
    deadline = performance.now() + ROUND_MS
    step()
  })
}

function finishCol(config: ColConfig, name: string, endedAt: number, wordsRead: number): void {
  clearColTimer()
  // A minute of reading, so words read is words per minute by definition.
  saveKeyedResult(colKey(config), {
    seconds: 60,
    errors: 0,
    score: wordsRead,
    trials: cellTotal(config),
  })
  const best = resultsForKey(colKey(config)).reduce(
    (b, r) => (r.score !== undefined && r.score > b ? r.score : b),
    0,
  )

  app.innerHTML = `
    <main class="screen screen--center">
      <p class="eyebrow">${name}</p>
      <h1 class="title">${wordsRead}</h1>
      <p class="meta">words read in one minute · finished at ${endedAt} wpm</p>
      <p class="meta">${colLabel(config)}</p>
      <p class="meta">best ${best} wpm</p>
      <button class="primary" id="again">ANOTHER MINUTE</button>
      <button class="ghost" id="done">Done</button>
    </main>`
  app
    .querySelector<HTMLButtonElement>('#again')!
    .addEventListener('click', () => openCol({ ...config, wpm: endedAt }, name))
  app.querySelector<HTMLButtonElement>('#done')!.addEventListener('click', renderColList)
}


/* ---------------- remember numbers ---------------- */

let numTimer = 0

const clearNumTimer = () => {
  if (numTimer) clearTimeout(numTimer)
  numTimer = 0
}

function numCard(id: string, name: string, note: string, config: NumConfig): string {
  const best = resultsForKey(numKey(config)).reduce(
    (b, r) => (r.score !== undefined && r.score > b ? r.score : b),
    0,
  )
  return `
    <div class="card card--preset" data-num-open="${id}">
      <div class="card__main">
        <div class="card__head"><p class="card__name">${name}</p></div>
        <p class="card__today">${note}</p>
        <div class="card__badges">
          <span class="badge">${config.flashMs}ms</span>
          <span class="badge">from ${config.startDigits} digits</span>
          <span class="badge">${config.trials} numbers</span>
        </div>
        ${best > 0 ? `<p class="card__today">longest recalled: ${best} digits</p>` : ''}
      </div>
    </div>`
}

function renderNumList(): void {
  app.innerHTML = `
    <div class="shell">
      <header class="topbar topbar--back">
        <button class="back" id="back">←</button><h1>Remember numbers</h1>
      </header>
      <div class="scroll">
        <p class="drill__note">
          A number appears for a moment, then you key it back. Get it right and the next
          one is a digit longer; get it wrong and it drops back. Most people settle
          somewhere between four and seven digits.
        </p>
        <section class="group">
          ${NUM_PRESETS.map((p) => numCard(p.id, p.name, p.note, p.config)).join('')}
        </section>
      </div>
    </div>`

  app.querySelector<HTMLButtonElement>('#back')!.addEventListener('click', renderTab)
  app.querySelectorAll<HTMLElement>('[data-num-open]').forEach((el) => {
    el.addEventListener('click', () => {
      const found = NUM_PRESETS.find((p) => p.id === el.dataset.numOpen!)!
      openNum(found.config, found.name)
    })
  })
}

function openNum(config: NumConfig, name: string): void {
  clearNumTimer()
  let digits = config.startDigits
  let trial = 0
  let correctCount = 0
  let longest = 0
  let answer = ''
  let typed = ''
  let accepting = false

  const draw = (state: 'ready' | 'flash' | 'entry') => {
    const slots = Array.from({ length: digits }, (_, i) => {
      const shown = state === 'flash' ? answer[i] : typed[i] ?? ''
      return `<span class="nslot${shown ? ' is-filled' : ''}">${shown || '–'}</span>`
    }).join('')

    app.innerHTML = `
      <main class="screen">
        <header class="bar">
          <button class="bar__btn" id="quit" aria-label="Back">${icon('back', 20)}</button>
          <span class="target target--name">${digits} digits</span>
          <span class="bar__right"><span class="clock">${trial}/${config.trials}</span></span>
        </header>
        <div class="progress"><span class="progress__fill" style="width:${(trial / config.trials) * 100}%"></span></div>
        <div class="gridwrap"><div class="nslots" id="slots">${slots}</div></div>
        ${
          state === 'ready'
            ? `<button class="primary confirm" id="action">START</button>
               <p class="hint hint--bottom">Look at the middle. The number will flash.</p>`
            : `<div class="keypad" id="keypad">
                 ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button class="key" data-key="${n}">${n}</button>`).join('')}
                 <button class="key key--wide" data-key="0">0</button>
                 <button class="key" data-key="del">⌫</button>
               </div>`
        }
      </main>`

    app.querySelector<HTMLButtonElement>('#quit')!.addEventListener('click', () => {
      clearNumTimer()
      renderNumList()
    })
    app.querySelector<HTMLButtonElement>('#action')?.addEventListener('click', flash)
    app.querySelector<HTMLElement>('#keypad')?.addEventListener('click', (event) => {
      const key = (event.target as HTMLElement).closest<HTMLElement>('[data-key]')
      if (!key || !accepting) return
      press(key.dataset.key!)
    })
  }

  const flash = () => {
    answer = makeNumber(digits)
    typed = ''
    accepting = false
    draw('flash')
    numTimer = window.setTimeout(() => {
      accepting = true
      draw('entry')
    }, config.flashMs)
  }

  const press = (key: string) => {
    if (key === 'del') {
      typed = typed.slice(0, -1)
      draw('entry')
      return
    }
    if (typed.length >= digits) return
    typed += key
    draw('entry')
    // Checked as soon as the last slot is filled: no submit button to hunt for.
    if (typed.length === digits) {
      accepting = false
      numTimer = window.setTimeout(judge, 150)
    }
  }

  const judge = () => {
    const right = typed === answer
    if (right) {
      correctCount++
      longest = Math.max(longest, digits)
    }
    const slots = app.querySelectorAll<HTMLElement>('.nslot')
    slots.forEach((slot, i) => {
      slot.classList.add(typed[i] === answer[i] ? 'is-right' : 'is-wrong')
      if (!right) slot.textContent = answer[i]
    })
    trial++
    digits = nextLength(digits, right)
    numTimer = window.setTimeout(
      () => (trial >= config.trials ? finishNum(config, name, longest, correctCount) : flash()),
      right ? 600 : 1400,
    )
  }

  draw('ready')
}

function finishNum(config: NumConfig, name: string, longest: number, correct: number): void {
  clearNumTimer()
  saveKeyedResult(numKey(config), {
    seconds: 0,
    errors: config.trials - correct,
    score: longest,
    trials: config.trials,
  })
  const best = resultsForKey(numKey(config)).reduce(
    (b, r) => (r.score !== undefined && r.score > b ? r.score : b),
    0,
  )

  app.innerHTML = `
    <main class="screen screen--center">
      <p class="eyebrow">${name}</p>
      <h1 class="title">${longest || '—'}</h1>
      <p class="meta">longest number recalled, in digits</p>
      <p class="meta">${correct} of ${config.trials} correct · ${numLabel(config)}</p>
      <p class="meta">best ${best} digits${best >= MAX_DIGITS ? ' · at the ceiling' : ''}</p>
      <button class="primary" id="again">AGAIN</button>
      <button class="ghost" id="done">Done</button>
    </main>`
  app.querySelector<HTMLButtonElement>('#again')!.addEventListener('click', () => openNum(config, name))
  app.querySelector<HTMLButtonElement>('#done')!.addEventListener('click', renderNumList)
}


/* ---------------- even numbers ---------------- */

let evenTimer = 0

function evenCard(id: string, name: string, note: string, config: EvenConfig): string {
  const done = resultsForKey(evenKey(config))
  const best = done.reduce<number | null>(
    (b, r) => (b === null || r.seconds < b ? r.seconds : b),
    null,
  )
  return `
    <div class="card card--preset" data-even-open="${id}">
      <div class="card__main">
        <div class="card__head"><p class="card__name">${name}</p></div>
        <p class="card__today">${note}</p>
        <div class="card__badges">
          <span class="badge">${config.rows} × ${config.cols}</span>
          <span class="badge">${config.evens} evens</span>
          <span class="badge">${config.tables} tables</span>
        </div>
        ${best === null ? '' : `<p class="card__today">best ${fmt(best)}s</p>`}
      </div>
    </div>`
}

function renderEvenList(): void {
  app.innerHTML = `
    <div class="shell">
      <header class="topbar topbar--back">
        <button class="back" id="back">←</button><h1>Even numbers</h1>
      </header>
      <div class="scroll">
        <p class="drill__note">
          Every table hides a few even numbers among the odd ones. Find and tap them all,
          then the next table appears. Scan by rows or by columns, whichever suits you,
          and stay relaxed — rushing costs more in wrong taps than it gains.
        </p>
        <section class="group">
          ${EVEN_PRESETS.map((p) => evenCard(p.id, p.name, p.note, p.config)).join('')}
        </section>
      </div>
    </div>`

  app.querySelector<HTMLButtonElement>('#back')!.addEventListener('click', renderTab)
  app.querySelectorAll<HTMLElement>('[data-even-open]').forEach((el) => {
    el.addEventListener('click', () => {
      const found = EVEN_PRESETS.find((p) => p.id === el.dataset.evenOpen!)!
      openEven(found.config, found.name)
    })
  })
}

function openEven(config: EvenConfig, name: string): void {
  if (evenTimer) cancelAnimationFrame(evenTimer)
  evenTimer = 0
  let tableIndex = 0
  let found = 0
  let errors = 0
  let startedAt = 0
  let table = buildTable(config)
  let running = false

  app.innerHTML = `
    <main class="screen">
      <header class="bar">
        <button class="bar__btn" id="quit" aria-label="Back">${icon('back', 20)}</button>
        <span class="target target--name" id="left">${config.evens} to find</span>
        <span class="bar__right"><span class="clock" id="clock">0.0</span></span>
      </header>
      <div class="progress"><span class="progress__fill" id="fill"></span></div>
      <div class="gridwrap gridwrap--page">
        <div class="etable" id="table" style="--cols:${config.cols}"></div>
      </div>
      <button class="primary confirm" id="action">START</button>
      <p class="hint hint--bottom">Tap every even number. Table 1 of ${config.tables}.</p>
    </main>`

  const host = app.querySelector<HTMLDivElement>('#table')!
  const left = app.querySelector<HTMLElement>('#left')!
  const clock = app.querySelector<HTMLElement>('#clock')!
  const fill = app.querySelector<HTMLElement>('#fill')!
  const hint = app.querySelector<HTMLElement>('.hint--bottom')!
  const action = app.querySelector<HTMLButtonElement>('#action')!

  const paint = () => {
    host.innerHTML = table.values
      .map((value, i) => `<button class="ecell" data-i="${i}">${value}</button>`)
      .join('')
  }

  const tick = () => {
    if (!running) return
    clock.textContent = fmt((performance.now() - startedAt) / 1000)
    evenTimer = requestAnimationFrame(tick)
  }

  host.addEventListener('click', (event) => {
    if (!running) return
    const cell = (event.target as HTMLElement).closest<HTMLElement>('.ecell')
    if (!cell || cell.classList.contains('is-found')) return
    const index = Number(cell.dataset.i)
    if (table.targets.has(index)) {
      cell.classList.add('is-found')
      found++
      left.textContent = `${config.evens - found} to find`
      if (found === config.evens) nextTable()
    } else {
      errors++
      cell.classList.add('is-wrong')
      setTimeout(() => cell.classList.remove('is-wrong'), 200)
    }
  })

  const nextTable = () => {
    tableIndex++
    if (tableIndex >= config.tables) {
      running = false
      if (evenTimer) cancelAnimationFrame(evenTimer)
      return finishEven(config, name, (performance.now() - startedAt) / 1000, errors)
    }
    found = 0
    table = buildTable(config)
    paint()
    left.textContent = `${config.evens} to find`
    fill.style.width = `${(tableIndex / config.tables) * 100}%`
    hint.textContent = `Table ${tableIndex + 1} of ${config.tables}.`
  }

  action.addEventListener('click', () => {
    if (running) return
    running = true
    startedAt = performance.now()
    action.hidden = true
    tick()
  })

  app.querySelector<HTMLButtonElement>('#quit')!.addEventListener('click', () => {
    running = false
    if (evenTimer) cancelAnimationFrame(evenTimer)
    renderEvenList()
  })

  paint()
}

function finishEven(config: EvenConfig, name: string, seconds: number, errors: number): void {
  saveKeyedResult(evenKey(config), { seconds, errors, trials: config.tables })
  const all = resultsForKey(evenKey(config))
  const best = all.reduce((b, r) => (r.seconds < b ? r.seconds : b), seconds)

  app.innerHTML = `
    <main class="screen screen--center">
      <p class="eyebrow">${name}</p>
      <h1 class="title">${fmt(seconds)}s</h1>
      <p class="meta">for ${config.tables} tables · ${fmt(seconds / config.tables)}s each</p>
      ${errors > 0 ? `<p class="meta">${errors} wrong tap${errors === 1 ? '' : 's'}</p>` : '<p class="meta">no wrong taps</p>'}
      <p class="meta">${evenLabel(config)}</p>
      <p class="meta">best ${fmt(best)}s</p>
      <button class="primary" id="again">AGAIN</button>
      <button class="ghost" id="done">Done</button>
    </main>`
  app.querySelector<HTMLButtonElement>('#again')!.addEventListener('click', () => openEven(config, name))
  app.querySelector<HTMLButtonElement>('#done')!.addEventListener('click', renderEvenList)
}

// Space confirms, for checking it on a desktop keyboard.
window.addEventListener('keydown', (event) => {
  if (event.code !== 'Space') return
  event.preventDefault()
  if (round?.config.eyes) onConfirm()
})

renderTab()
