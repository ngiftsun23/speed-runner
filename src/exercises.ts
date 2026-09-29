export type ExerciseStatus = 'ready' | 'soon'

export interface Exercise {
  id: string
  name: string
  /** What the drill actually trains — kept concrete, no transfer claims. */
  trains: string
  icon: string
  status: ExerciseStatus
}

/**
 * The app's drills. Only Schulte is built; the rest are listed as planned so
 * the shape of the app is visible, and are marked plainly rather than dressed
 * up as locked levels.
 */
export const EXERCISES: Exercise[] = [
  {
    id: 'schulte',
    name: 'Schulte table',
    trains: 'Visual search from a held centre',
    icon: 'grid',
    status: 'ready',
  },
  {
    id: 'field',
    name: 'Field of vision',
    trains: 'Reading characters away from fixation',
    icon: 'eye',
    status: 'ready',
  },
  {
    id: 'rsvp',
    name: 'Running words',
    trains: 'Reading at a forced pace, without backtracking',
    icon: 'flash',
    status: 'soon',
  },
  {
    id: 'columns',
    name: 'Columns of words',
    trains: 'Taking a line in two or three fixations',
    icon: 'columns',
    status: 'soon',
  },
  {
    id: 'greendot',
    name: 'Green dot',
    trains: 'Holding fixation while text is read around it',
    icon: 'dot',
    status: 'soon',
  },
  {
    id: 'stroop',
    name: 'Colour confusion',
    trains: 'Ignoring an interfering signal',
    icon: 'palette',
    status: 'soon',
  },
]
