# Presentation video autoplay and controls

`VideoPlayer.vue` previously enabled native controls when an active case-study
video remained paused for eight seconds. Slow loading could expose the player UI;
a subsequent pause with controls enabled set `userPaused`, suppressing coordinator
autoplay until the media was released.

The shared component now has no slow-load controls timer or manual-pause state.
Controls are always false, including after caller attributes are applied. Muted,
inline, looping playback remains; remote playback and picture-in-picture are
disabled. The video cannot receive pointer input or keyboard focus, and click and
context-menu defaults are canceled. Touch gestures reach the page for scrolling.
There is no click-to-play handler or custom player UI.

The coordinator retries on canplay/progress and retries rejected play promises
with backoff capped at two seconds. Unexpected pauses of the selected video
schedule recovery. Each play attempt explicitly sets muted/defaultMuted,
playsInline and controls=false. One-player selection, hidden-tab pauses, canplay
readiness, nearby partial-buffer retention, and distant source release remain.
This applies to DoorDashPrototype, direct DoorDash videos, other case studies,
and homepage videos. No media was re-encoded or resized.

Regression coverage in `tests/video-coordinator.test.mjs` exercises readiness,
progress/timer recovery, browser pauses, hidden tabs, preloading and late play
resolution after deselection. `scripts/perf/verify-video-controls.mjs` runs through
`npm test` against the production build using normal Chromium autoplay policy.
It checks desktop and touch/mobile layouts, a nine-second withheld video response,
tap-free recovery, absence of controls, pointer/gesture behavior, and playback on
DoorDash prototype/direct videos, Nova, Nuance and the homepage. Existing loading,
coordinator and cancellation checks cover slow-network startup and buffer retention.

Validation: `npm run build` and the full `npm test` suite passed, including all six
coordinator unit tests and the desktop/mobile browser regressions above.

Browser or OS autoplay restrictions can still reject muted playback; the component
keeps retrying and retains the poster without exposing controls. Chromium mobile
emulation does not replace a physical iOS Safari check.
