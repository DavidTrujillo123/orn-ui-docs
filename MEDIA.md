# Media

A component page shows the video clip at `public/media/<slug>.mp4`, and falls
back to its poster frame `<slug>.jpg` when there is no clip. The choice is
made at build time by looking at the filesystem (see
`src/components/ComponentPageLayout.astro`) — there is no flag to keep in sync
and no runtime fallback that depends on a 404.

That fallback is also the escape hatch for a component that gains nothing from
motion: delete its `.mp4`, keep the `.jpg`, and the page shows a still.

The home grid always uses posters, never the clips — forty videos playing at
once is a page that weighs tens of megabytes and moves all over.

GIFs were the previous format; they were dropped once every component had a
clip (26x smaller for BottomSheet, and regenerable instead of hand-recorded).
`scripts/record.sh`, which built them, went with them — it is in the history if
it is ever needed.

## Variant screenshots

Every variant in the "Variants" section can show a still of itself, in light
and dark, above its code. The page picks them up at build time from
`public/media/variants/<slug>/<N>-light.jpg` / `<N>-dark.jpg`, where `N` is
the variant's 1-based position in the demo; the site's theme decides which
one is visible. A variant without a capture shows only its code.

```sh
scripts/capture-variants.sh <layer> <slug> <count> [cropY cropH]
scripts/capture-variants.sh atoms typography 9 1300 320   # small content: a band
scripts/capture-variants.sh organisms modal 4             # default: the whole demo card
VIDEO=1 BAND_H=560 scripts/capture-variants.sh atoms spinner 8   # band centred on each variant
```

`BAND_H=<px>` finds each variant's content inside the demo card (from the
light screenshot) and centres a band of that height on it, so every variant
gets the same height and equal air above and below. With `VIDEO=1` each clip
is checked against its poster (background luma at the first and last frame):
a clip that does not match its theme aborts the run instead of shipping.

It opens each variant by deep link (`ornui:///<layer>/<slug>?v=N`, handled
by the example app's `VariantList`), so it needs neither Maestro nor swipes:
only a booted simulator with the example app (plus Metro if it is a Debug
build). It also rewrites the poster `public/media/<slug>.jpg` from variant 1.
Keep `demos/<Name>.demo.tsx` here in sync with the example app's copy, or the
numbering drifts from the labels.

With the library repo checked out next to this one (`../orn-ui`), props,
registry and demo types come from it (see `scripts/orn-ui-path.mjs`), so the
docs can show unreleased APIs locally. Vercel has no sibling repo and uses
the npm package: publish the library before deploying docs that use new APIs
(`ORN_UI_PUBLISHED=1 pnpm run build` reproduces the Vercel build).

Which medium for which component:

- **Static** (text, badges, dividers, cards, avatars): variant screenshots and
  a poster; no clip. Delete the `.mp4` so the hero shows the still.
- **Animated on its own** (spinners, skeleton, shiny text, transitions): run
  with `VIDEO=1`. Every variant gets a ~3 s loop (light and dark, the still as
  poster) and the hero clip is those variants back to back. No Maestro
  needed: the motion needs no touch.
- **Interactive** (sheets, pickers, gestures, toasts, wizards): a short clip of
  the interaction in the hero, plus a screenshot of each variant's resting
  state in "Variants".

## Recording a clip (video)

The choreography is a Maestro flow living in the library repo, at
`apps/example/.maestro/demos/<category>-<slug>.yaml` — *not* in
`.maestro/flows/`, so `maestro test .maestro` (the e2e suite, CI) never runs
it: `config.yaml` there only globs `flows/**/*.yaml`. A demo clip failing must
not break the test suite, and it adds no coverage — the behavior flows already
assert what the component does.

```sh
scripts/record-demo.sh bottom-sheet                  # runs the flow, encodes
scripts/record-demo.sh bottom-sheet --from clip.mp4  # encode only
scripts/record-all-demos.sh                          # every component, in one go
scripts/record-all-demos.sh button card              # only those slugs
```

`record-all-demos.sh` does not stop at the first failure — it records ~45
clips against a real simulator, and losing half an hour of recording to one
bad selector is not a trade worth making. Failures are collected and printed
at the end, with each run's log left in `/tmp/record-<slug>.log`.

Most of those flows are generated, not written: `pnpm --filter example
gen:maestro:demos` reads the manifest plus each demo's `.tsx` and emits a
tour of that component's variants — deep link, then one paged swipe and a beat
per variant, so the clip shows every variant instead of just the first. What
it cannot generate is interaction (open the sheet, cancel the form, pick an
option); those flows are written by hand and listed in the generator's
`HAND_WRITTEN` set so a regeneration leaves them alone.

The script pins the simulator status bar (9:41, full battery) before running,
so a re-recording differs only where the UI differs. It writes
`public/media/<slug>.mp4` (h264, 560px wide, 30fps) and
`public/media/<slug>.jpg` (first frame, used as `poster`).

Why this beats a GIF, concretely — BottomSheet:

| | GIF | clip |
|---|---|---|
| size | 1.2 MB | 46 KB |
| length | ~4 s | 6.8 s, paced |
| frame rate | 8 fps, 96 colours | 30 fps, full colour |
| re-recordable | by hand, on a booted sim | `scripts/record-demo.sh <slug>` |

### Autoplay is not the `autoplay` attribute

`<video autoplay muted loop playsinline>` alone leaves the clip frozen on its
poster in browsers that block autoplay by policy — Brave does it out of the
box. Measured against this build over CDP: `paused: true`, `currentTime: 0`,
`readyState: 4`, `error: null` — loaded and stopped, no failure to see. The
same element started fine from a scripted `video.play()`.

So the page keeps the attribute (it is what plays the clip with JS off) and
also calls `play()` from an inline script, driven by an `IntersectionObserver`
so a clip below the fold starts when it is scrolled to and pauses when it
leaves. If `play()` is rejected anyway, the video gets `controls` — the demo
stays reachable instead of being a silent still. `prefers-reduced-motion:
reduce` takes the same controls path deliberately.

Inside the flow, `startRecording` goes *after* the deep link, so the clip
opens on the demo screen with no splash or navigation. Maestro has no `sleep`
command (`sleep` and `wait` are both invalid syntax, and
`waitForAnimationToEnd` returns the moment the screen stops moving), so pauses
come from `demos/_beat.yaml`, a subflow that busy-waits `MS` milliseconds in
`evalScript`. Those beats are what makes a clip readable instead of a twitch.

## Known gap

Recording does not run in CI: it needs a booted iOS Simulator with the example
app installed, which CI doesn't have. Media is committed, not built.

Every documented component has a clip today. One that doesn't shows its code
snippet plus a placeholder — the site ships either way rather than serving a
broken `<img>`.
