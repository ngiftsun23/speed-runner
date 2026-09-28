export interface Point {
  at: number
  seconds: number
}

const W = 320
const H = 190
const PAD_L = 34
const PAD_R = 12
const PAD_T = 16
const PAD_B = 24

const shortDate = (at: number) =>
  new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

/**
 * Times over successive rounds, one series.
 *
 * The y axis is inverted on purpose: a faster time is a better result, so
 * putting the small numbers at the top makes improvement read as a rise. The
 * axis is labelled to say so, since an inverted scale is otherwise misread.
 *
 * Rounds are spaced evenly rather than by date, so the shape shows progress
 * per attempt and a gap of days does not stretch the line.
 */
export function timesChart(points: Point[]): string {
  if (points.length === 0) {
    return `<p class="note">No rounds in this range.</p>`
  }

  const values = points.map((p) => p.seconds)
  let lo = Math.min(...values)
  let hi = Math.max(...values)
  if (hi - lo < 1) {
    lo -= 1
    hi += 1
  }
  const pad = (hi - lo) * 0.15
  lo -= pad
  hi += pad

  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const x = (i: number) =>
    points.length === 1 ? PAD_L + plotW / 2 : PAD_L + (i / (points.length - 1)) * plotW
  // Inverted: the lowest time sits at the top of the plot.
  const y = (v: number) => PAD_T + ((v - lo) / (hi - lo)) * plotH

  const ticks = 4
  const gridlines = Array.from({ length: ticks + 1 }, (_, i) => {
    const value = lo + ((hi - lo) * i) / ticks
    const yy = y(value)
    return `
      <line class="ch-grid" x1="${PAD_L}" y1="${yy}" x2="${W - PAD_R}" y2="${yy}" />
      <text class="ch-axis" x="${PAD_L - 6}" y="${yy + 3}" text-anchor="end">${value.toFixed(1)}</text>`
  }).join('')

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)} ${y(p.seconds)}`).join(' ')

  const best = points.reduce((a, b) => (b.seconds < a.seconds ? b : a))
  const bestIndex = points.indexOf(best)
  const lastIndex = points.length - 1

  const dots = points
    .map((p, i) => {
      const emphasis = i === bestIndex || i === lastIndex ? ' is-key' : ''
      return `<circle class="ch-dot${emphasis}" cx="${x(i)}" cy="${y(p.seconds)}" r="4"
        data-value="${p.seconds.toFixed(1)}s" data-date="${shortDate(p.at)}"
        tabindex="0"><title>${p.seconds.toFixed(1)}s · ${shortDate(p.at)}</title></circle>`
    })
    .join('')

  // Label only the two points that carry meaning, never every point.
  const label = (i: number, text: string) => {
    const px = x(i)
    const anchor = px > W - 60 ? 'end' : px < 60 ? 'start' : 'middle'
    return `<text class="ch-label" x="${px}" y="${y(points[i].seconds) - 9}"
      text-anchor="${anchor}">${text}</text>`
  }

  const labels =
    lastIndex === bestIndex
      ? label(lastIndex, `${points[lastIndex].seconds.toFixed(1)}s`)
      : label(bestIndex, `best ${best.seconds.toFixed(1)}s`) +
        label(lastIndex, `${points[lastIndex].seconds.toFixed(1)}s`)

  return `
    <figure class="chart">
      <svg viewBox="0 0 ${W} ${H}" role="img"
        aria-label="Round times, most recent ${points.length} rounds">
        ${gridlines}
        ${points.length > 1 ? `<path class="ch-line" d="${path}" />` : ''}
        ${dots}
        ${labels}
        <text class="ch-axis" x="${PAD_L}" y="${H - 6}" text-anchor="start">${shortDate(points[0].at)}</text>
        ${
          points.length > 1
            ? `<text class="ch-axis" x="${W - PAD_R}" y="${H - 6}" text-anchor="end">${shortDate(points[lastIndex].at)}</text>`
            : ''
        }
      </svg>
      <figcaption class="ch-caption">seconds per round · lower is better, so up is faster</figcaption>
    </figure>`
}
