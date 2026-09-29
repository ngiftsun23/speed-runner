# Speed Runner

A reading-speed and concentration trainer, built as an installable PWA. Schulte
tables and Field of vision are implemented; the other exercises are listed in the
Practice grid and marked "Not built yet".

Plain TypeScript and Vite, no framework. There is no backend: every result lives
in the browser's `localStorage`, on the device that produced it.

## Commands

```bash
npm run dev      # dev server; add --host to reach it from a phone on the LAN
npm run build    # typecheck then build to dist/
npx netlify-cli deploy --prod --dir=dist   # publish
```

Live at **https://speed-runner-app.netlify.app**, installed on the owner's phone.
The service worker uses `autoUpdate`, so a deploy reaches the installed app on its
next launch — no reinstall.

The owner prefers deploying each change and checking the live URL over running a
dev server on the local network. Use the dev server only for rapid visual
back-and-forth, and say when switching to it.

## Layout

| File | What it holds |
|---|---|
| `src/engine.ts` | Schulte model: grids, target orders, rounds. Pure, no DOM. |
| `src/presets.ts` | The five Schulte presets and the card badges. |
| `src/fov.ts` | Field of vision model: field positions, trials, scoring. Pure. |
| `src/exercises.ts` | The Practice grid's list of drills and their status. |
| `src/store.ts` | `localStorage` reads and writes; results, custom configs. |
| `src/chart.ts` | The times chart, as an SVG string. |
| `src/art.ts` | Home screen artwork. |
| `src/main.ts` | Every screen and all wiring. Large; split it before it grows much further. |

Screens are rendered by assigning `innerHTML` and then attaching listeners. There
is no virtual DOM and no reactive state — a change means re-rendering the screen
and re-wiring it.

## Rules that are not obvious from the code

- **The centre cell is reserved.** On an odd × odd grid the middle cell never
  holds a number: it is the fixation point, and the whole drill depends on the
  eyes staying there. In Schulte's Random Order the centre displays the current
  target instead, since a random sequence cannot be worked out. Only odd × odd
  grids have a centre cell, so a 5×5 holds 24 numbers and an even grid such as
  6×4 has none to reserve.
- **Grids are labelled rows × cols**, matching the app this one is modelled on.
  Internally they are `cols` and `rows`. The owner's custom table is 6 columns by
  4 rows and reads "4 × 6".
- **Eyes mode is the point.** Confirming with a button rather than tapping the
  cell is what stops finger-led scanning. It is unverifiable by design; the flash
  after each confirm is there so the user can self-check.
- **No invented progress gates.** Unbuilt drills say "Not built yet", not
  "Level 12 required". If a real unlock rule is ever added, the number must mean
  something.
- **No transfer claims.** Home says plainly that the drills make you better at the
  drills. Keep it that way.

## Gotchas

- **Renaming the Netlify site changes the origin.** It breaks the installed PWA
  and orphans every stored time, because `localStorage` is per origin. This has
  already happened once, deliberately.
- **A new Netlify site returns 401 on everything.** It ships with
  `sso_login: true`; clear it through the API, since the dashboard toggle is not
  where you expect:
  `netlify api updateSite --data '{"site_id":"<id>","body":{"sso_login":false}}'`
- **`vite preview` rejects unknown Host headers.** Serving the build through a
  tunnel needs the host in `preview.allowedHosts` (`.trycloudflare.com` is already
  there).
- **One button, one listener.** The drill screen's action button is START before a
  round and CONFIRM during it. Stacking a second listener instead of dispatching
  on state restarted the round on every confirm, and Eyes-mode rounds could never
  finish. Dispatch on state.
- **`placeDot` is also the grid sizing function** and returns early if there is no
  `.dot` element. A screen with a grid must include one, hidden if unused.
- **Cells are sized against both dimensions**, so tall grids like 9×9 fit, and
  cell text is sized from the measured cell rather than `rem` — the owner's phone
  runs an enlarged system text size that would otherwise overflow the grid.
- **Fonts are npm packages, never a CDN.** The installed app has to render
  correctly with no network.
- **Results keys are prefixed by drill** (`schulte/…`, `fov/…`). Keys written
  before that change have no prefix and are still read as Schulte's.

## Open

- **Gorbov's rule is assumed**, not confirmed: 25 cells split 13 ascending and 12
  descending, interleaved, with one confirm button showing the target in its
  colour. Ask before relying on it.
- **Exercise sets** — the Practice screen has no equivalent of the reference app's
  "Basic set / Advanced set". That is really the session runner: warm-up, three
  timed rounds, stop.
- **Field of vision results are saved but not shown.** The Stats tab only renders
  Schulte keys.
- **The chart button on Schulte preset cards** opens per-table statistics; the
  same affordance does not exist for Field of vision.
- **No git remote.** The repository exists only on this machine.

See `docs/` for the coaching protocol and the decision log.
