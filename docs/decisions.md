# Decisions

Why things are the way they are, so they do not get re-opened by accident.
Newest last.

## A PWA, not a native Android app

The machine had no Android toolchain: no SDK, no Studio, and a JDK too old for
current builds. Native would have cost roughly two hours of setup before the
first grid appeared, and every subsequent change a build-and-install cycle
rather than a reload.

Nothing in the app needs native APIs — it is a grid, a timer and a button — so
the PWA gives the same product with a far tighter loop. It installs to the home
screen, runs fullscreen and portrait, and works offline. If a Play Store listing
is ever wanted, a TWA wraps the same URL without rewriting anything.

## Netlify, not Fly

The app is static files with no backend; results live in the browser. Netlify
serves that for free on its CDN. Fly runs containers, which would mean building
and running one just to hand out static files, for no benefit and eventual cost.

Fly would only start to make sense with a real backend — syncing results across
devices, or accounts.

## The site was renamed, knowingly breaking the install

`schulte-trainer.netlify.app` became `speed-runner-app.netlify.app` when the app
was renamed. That changes the origin, so the installed PWA broke and its stored
times became unreachable. The owner asked for the rename immediately and
accepted that cost. `speed-runner` itself was already taken.

Do not rename it again casually: every rename orphans the installed app and the
training history with it.

## No invented progress gates

The reference app locks exercises behind "Level 12 required". This app has no
level system, so unbuilt drills say "Not built yet". A number that gates
something must mean something; a fake one is the interface lying to the person
using it.

A real unlock rule could be added later — for instance, a drill opening once the
average on the previous one stabilises.

## No transfer claims

The brief was explicit: no IQ claims, no "expands your visual field". The home
screen says the drills make you better at the drills and that carry-over to
ordinary reading is modest. The reference app claims otherwise; this one does
not follow it there.

## Copyrighted artwork was declined

A request to put the Warner Bros. Road Runner on the home screen, and later to
restyle that image, was declined — the app is published at a public URL. An
original bird was drawn instead, and later replaced by artwork the owner
supplied.

## Deploy each change rather than serving on the LAN

The owner prefers to check the deployed URL over running a dev server on the
local network, to avoid depending on being on the same Wi-Fi. A deploy costs
about twenty seconds; the installed app picks it up on next launch because the
service worker registers with `autoUpdate`.

The dev server stays available for rapid visual back-and-forth, where waiting
for a rebuild between each nudge would be painful.

## Dark, neo-grotesque, and restrained colour

Dark reduces glare for a drill stared at closely. Type is Inter, tracked tight
at display sizes; the cartoon face is used only for the app name in the top bar,
because a reading-speed trainer should not slow its own reader down — a
full-interface experiment with it was tried and reverted for exactly that
reason.

Text wears ink tokens; colour is kept for meaning, which in practice means the
green and red of right and wrong.

## Fonts are packages, never a CDN

Both faces install via npm and are precached by the service worker. A CDN would
leave the installed app falling back to a system font whenever it is offline,
which is most of the time.

## Neo-brutalist skin, as an appended block

The dark, restrained theme was replaced on request with a neo-brutalist one:
cream paper, 2px near-black borders, hard offset shadows with no blur, flat
saturated colour, buttons that shift into their own shadow when pressed.

It is appended at the end of `style.css` as a clearly marked block that
overrides the tokens and adds the borders, rather than being woven through the
rules above it. That is deliberate: it can be removed in one piece.

The cost, accepted knowingly: the style only works on a light ground, so the
low-glare dark screen is gone, and the drills are stared at closely.

## The display face is the wordmark's alone

The app name uses a display face — currently Syne, after trying a cartoon face
and Archivo Black. An attempt to extend that face to headings, buttons and card
names in the name of consistency was rejected outright. Consistency here means
one text face everywhere with the wordmark as the single exception.

What was genuinely inconsistent was the type *scale*: six body sizes and six
heading sizes had accumulated across the screens. That was collapsed to four
steps, all in Inter.

## Yellow stays

An attempt to give blue and yellow separate jobs — blue for action, yellow only
for drill highlights — was reverted. Flat yellow is one of the signatures of the
style, and stripping it back to two uses made the app look less like itself.
