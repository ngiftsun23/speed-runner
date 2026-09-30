# Drill specifications

The rules of each exercise, stated independently of the code, so a rewrite can
stay faithful. Screenshots of the app these are modelled on are in
`reference/`.

Grids are written **rows × cols** throughout, matching the reference app. In
code they are `cols` and `rows`.

## The reserved centre

Shared by every grid drill. On an odd × odd grid the middle cell holds no
content: it is the fixation point, and the drills depend on the eyes staying
there. Consequences:

- A 5×5 Schulte holds **24** numbers, not 25.
- An even-sided grid such as the owner's 6×4 has no centre cell; the fixation
  dot sits at the true geometric centre of the rectangle instead, which falls on
  a gridline rather than inside a cell.
- Field of vision offers **odd sizes only**, because a cross needs a true centre
  row and column.

## Schulte tables

Find the targets in order, as fast as possible. One round is one grid.

**Target orders**

- **Sequential** — 1, 2, 3 … The next target can be worked out, so nothing needs
  to be displayed.
- **Random** — every target in a random order. It cannot be worked out, so the
  reserved centre cell displays the current target. The fixation dot is hidden
  in this mode: the number is itself the fixation point.
- **Gorbov** — two interleaved halves, each its own colour: 1, n, 2, n−1 … The
  alternation is the point; it is task-switching on top of search.
  **This rule is assumed, not confirmed by the owner.** Confirm before relying
  on it.

**Toggles**

- **Shuffle** — the whole grid is redealt after every find, the centre staying
  reserved. Much harder. Note that a *new arrangement per round* is not shuffle
  mode; that is inherent to a Schulte table and cannot be turned off.
- **Eyes** — confirm with a button instead of tapping the cell. This is what
  stops finger-led scanning, and it is the owner's default. It cannot be
  verified by the app, so the found cell flashes briefly after each confirm to
  allow self-checking.
- **Colour** — cells get hues. Clutter, off by default. A label's colour is
  stable across reshuffles, so colour is never a cue to position.

**Presets**: standard 5×5 · random order 5×5 · Gorbov 5×5 · large 6×5 ·
hardcore 5×5 random + shuffle + colour. Presets are tap mode; only the custom
table carries Eyes.

**Scoring**: total seconds, plus the slowest single find, which is the number
worth looking at.

## Field of vision

Judge whether the letters at the edges of the grid match, without leaving the
centre.

- The grid is filled with random **background letters, fixed for the whole
  round**. They are clutter, not content.
- The **field positions** carry the test letters. *Cross* uses the midpoint of
  each edge — four positions. *Extended* adds the four corners — eight.
- Between trials those positions show a dot on a tinted cell. During a trial
  they flash letters, then blank.
- **Half of trials contain a mismatch**: one position shows a different letter.
  Press MISTAKE if you saw one.
- The response window runs through the flash *and* the blank after it, so a
  considered late press still counts. What matters is noticing, not reflex.
- **Both error types are scored** — a missed mismatch and a press when there was
  none. Otherwise pressing every trial would score 100%.

**Presets**: easy 5×5 cross 600 ms · standard 7×7 cross 400 ms · hard 9×9
extended 300 ms. Twenty trials a round. Custom allows 3–9 odd, either field
type, 600 down to 150 ms.

**Scoring**: correct out of trials, reported as caught / missed / false.

## Running words

Read words that appear one at a time across a grid of slots, without chasing
them with the eyes.

- Slots are blank underlines. One word appears at a time.
- **Sequence** fills the slots in turn; **random** jumps, never landing on the
  same slot twice running.
- At the end of a round you are asked **which word was last**. Six candidates,
  plus "I don't know". The distractors are other words from the same round, so
  it tests what was actually seen rather than what feels familiar.
- **The speed adapts**: a correct answer adds 50 wpm, a wrong one or "I don't
  know" takes 50 off, with a floor of 100.
- After answering, the correct box turns green and a wrong pick turns red, so a
  miss still shows the word.

**Presets**: standard 3×3 sequence from 300 wpm · hard 3×3 random from 350.
Eight rounds a session, ten words a round. Custom allows 3×3 to 5×5, either
order, 150–400 wpm, 6–12 words.

**Scoring**: the **fastest speed still answered correctly** — not the speed
reached at the end, which may be a run of failures.

## Not built

Columns of words, Green dot, Colour confusion. They appear in the Practice grid
labelled "Not built yet" rather than behind invented level gates.
