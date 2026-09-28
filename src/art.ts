/**
 * Original mark for the home screen: a stylised running bird with motion
 * trails. Drawn here rather than sourced, so nothing in the app depends on
 * someone else's artwork.
 */
export const runnerArt = (): string => `
  <svg class="art" viewBox="0 0 220 120" role="img" aria-label="A running bird">
    <g class="art__trail">
      <path d="M6 44h44" /><path d="M0 62h34" /><path d="M10 80h40" />
    </g>
    <g class="art__bird">
      <path class="art__body"
        d="M96 34c14 0 26 9 30 22 3 9 11 10 18 6 4-2 7 2 4 6-6 8-16 12-26 10
           l-8 22c-1 4-7 3-6-2l4-20c-10-2-18-8-23-16l-14 18c-3 4-8 0-6-4l14-22
           c2-11 8-20 13-20z" />
      <path class="art__tail" d="M72 52 44 40l30 22z" />
      <path class="art__crest" d="M104 22c4-8 12-12 18-10-6 4-8 10-8 16z" />
      <path class="art__beak" d="M126 40h18l-18 8z" />
      <circle class="art__eye" cx="118" cy="38" r="3" />
      <path class="art__legs" d="M104 92l-8 16M118 92l6 16" />
    </g>
  </svg>`
