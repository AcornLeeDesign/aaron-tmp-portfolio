# Throttled browser performance — main vs Grok (cursor) vs Codex images (astra) vs combined

Run 2026-10-22 (PT) on the box. Commits: main 596990b, cursor ce42f0c, astra cb6e854, combined 467830e.
Each variant built with `npm run build` and served locally via `node .output/server/index.mjs`.

**Setup:** Playwright Chromium 1248, fresh context per run, cache disabled via CDP, Slow 4G
(562.5 ms latency, 180,000 B/s down, 84,375 B/s up), CPU throttling 4x. Desktop 1440×900 DPR1;
mobile 390×844 DPR3 with touch. Case-study gate pre-unlocked via sessionStorage on branches that still have it.
3 runs per combination, medians shown. The four variants ran concurrently (one browser each, 8-core box).

**Metrics:** FCP, LCP and CLS come from PerformanceObserver. LCP is frozen at the start of scrolling.
TBT sums each long task's time over 50 ms, from FCP to the end of the load phase.
"Load" means the load event, then network idle (capped at 45 s), then 5 s more.
For the scroll, the page moves by half a viewport every 1.2 s, capped at 120 s.
Frames are the sum of `getVideoPlaybackQuality` across all videos, as a delta over the scroll.
Bytes are CDP `encodedDataLength`.

### doordash · desktop

| Variant | FCP | LCP | CLS | TBT | 1st video playing | Load MB (video) | After scroll MB (video) | Dropped/total frames | Notes |
|---|---|---|---|---|---|---|---|---|---|
| main | 1.7 s | 1.7 s | 0.005 | 74 ms | — | 4.04 (0.00) | 13.33 (6.83) | 0/44 |  no play in 3/3 |
| cursor | 1.6 s | 1.6 s | 0.005 | 72 ms | 20.6 s | 1.51 (0.00) | 8.89 (3.31) | 10/136 | scroll cap 120s first play only after scroll |
| astra | 1.7 s | 1.7 s | 0.005 | 63 ms | — | 0.59 (0.00) | 9.82 (2.22) | 0/17 |  no play in 3/3 |
| combined | 1.7 s | 1.7 s | 0.005 | 76 ms | — | 0.59 (0.00) | 9.82 (2.18) | 0/24 |  no play in 3/3 |

### doordash · mobile

| Variant | FCP | LCP | CLS | TBT | 1st video playing | Load MB (video) | After scroll MB (video) | Dropped/total frames | Notes |
|---|---|---|---|---|---|---|---|---|---|
| main | 1.7 s | 1.7 s | 0.001 | 83 ms | — | 4.04 (0.00) | 11.17 (5.24) | 0/36 |  no play in 3/3 |
| cursor | 1.6 s | 1.6 s | 0.001 | 86 ms | 18.7 s | 1.51 (0.00) | 7.86 (2.51) | 9/575 |  first play only after scroll |
| astra | 1.6 s | 1.6 s | 0.001 | 66 ms | — | 0.59 (0.00) | 7.70 (1.20) | 0/5 |  no play in 3/3 |
| combined | 1.6 s | 1.6 s | 0.001 | 67 ms | 17.3 s | 0.59 (0.00) | 7.58 (1.70) | 2/90 | scroll cap 120s first play only after scroll |

### homepage · desktop

| Variant | FCP | LCP | CLS | TBT | 1st video playing | Load MB (video) | After scroll MB (video) | Dropped/total frames | Notes |
|---|---|---|---|---|---|---|---|---|---|
| main | 1.6 s | 41.7 s | 0.008 | 2948 ms | 19.3 s | 9.79 (1.46) | 14.11 (4.24) | 245/1244 |  |
| cursor | 1.6 s | 42.3 s | 0.008 | 3261 ms | 12.7 s | 9.75 (1.46) | 14.08 (4.24) | 281/1258 |  |
| astra | 1.6 s | 35.4 s | 0.008 | 2086 ms | 7.6 s | 7.83 (1.46) | 11.80 (2.81) | 231/908 |  |
| combined | 1.6 s | 37.1 s | 0.008 | 2106 ms | 7.6 s | 8.80 (2.43) | 12.59 (3.60) | 116/501 |  |

### homepage · mobile

| Variant | FCP | LCP | CLS | TBT | 1st video playing | Load MB (video) | After scroll MB (video) | Dropped/total frames | Notes |
|---|---|---|---|---|---|---|---|---|---|
| main | 1.6 s | 3.2 s | 0.001 | 94 ms | 10.3 s | 3.48 (1.46) | 6.91 (3.87) | 13/622 |  |
| cursor | 1.6 s | 3.2 s | 0.002 | 108 ms | 9.2 s | 5.83 (0.28) | 9.25 (2.71) | 9/519 |  |
| astra | 1.6 s | 3.4 s | 0.001 | 105 ms | 7.6 s | 2.47 (1.46) | 5.73 (3.03) | 6/553 |  |
| combined | 1.6 s | 3.4 s | 0.001 | 137 ms | 7.1 s | 2.15 (1.23) | 5.26 (2.53) | 8/299 |  |


## Lighthouse (mobile preset, simulated throttling, single run)

| Page | Variant | Score | LCP | TBT | Total bytes |
|---|---|---|---|---|---|
| DoorDash | main | 71 | 5.9 s | 20 ms | 3,969 KiB |
| DoorDash | combined | 77 | 4.3 s | 0 ms | 601 KiB |
| Home | main | 69 | 6.4 s | 30 ms | 3,429 KiB |
| Home | combined | 77 | 4.3 s | 20 ms | 2,130 KiB |

Lighthouse can't pre-unlock sessionStorage, so the main DoorDash run sees the password gate.
Its byte count still matches the 4.0 MB the unlocked throttled run loads.

## Notes / anomalies
- On Slow 4G (about 180 KB/s), the after-scroll byte totals are capped by bandwidth, since a 40–55 s scroll can only move about 8–10 MB.
  So they show what got downloaded in that time, not the full weight of the page.
- On DoorDash, videos rarely reach `playing` during the scroll on any variant. Only cursor (both viewports) and combined (mobile) play after scrolling.
- Homepage desktop LCP is about 35–42 s on every variant, with about 2–3 s TBT. The LCP element arrives late on this connection, and astra and combined are about 5 s faster.
- On cursor's homepage mobile run, 5.8 MB transfers at load compared with 3.5 MB on main, even though there's less video. That's likely images or posters, since cursor doesn't have Codex's image work.
- Some runs hit the 120 s scroll cap (noted in the tables).
