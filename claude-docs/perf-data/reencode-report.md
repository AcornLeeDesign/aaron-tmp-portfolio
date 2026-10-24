# Quality-first video re-encoding

Original exports are restored using `scripts/perf/video-sources.json`; no delivered derivative is a reference. Run `python3 scripts/perf/reencode-quality.py`. Results resume only when source and output SHA-256 match.

Each encode uses libx264 slow, High/4.2, yuv420p, square pixels, faststart, no audio; desktop width ≤1920 and mobile ≤1280, without upscaling. The CRF search starts at 20 and tightens quality until it passes, checking intermediate integer CRFs. Compact originals below 500 kb/s that already fit are stream-copied. The initial VBV cap is 75% of the old measured peak with a one-second buffer; caps double when no candidate satisfies both SSIM ≥0.999 and source size. A source stream copy is permitted only within the rendition dimensions. No slow-network rendition exists.

SSIM pairs every decoded frame against the original scaled to output size with Lanczos. This is a stringent lossy quality threshold, not mathematical pixel identity. Frame counts, timestamps (≤0.1 ms), duration (≤1 ms), codec and size are asserted before installation. Average bitrate counts video packet bytes / duration; peak is the maximum sliding one-second PTS window (not just integer-aligned buckets). Container file sizes include metadata. All rates below are kb/s, sizes MiB.

| Clip | Original MiB | Before → after MiB | Average before → after | Peak before → after | SSIM | CRF / VBV cap |
|---|---:|---:|---:|---:|---:|---|
| `asl-feature-mobile.mp4` | 1.397 | 1.177 → 0.381 | 1054 → 337 | 2172 → 531 | 0.999042 | 17 / 1628 |
| `asl-feature.mp4` | 1.397 | 2.317 → 0.525 | 2081 → 467 | 3879 → 721 | 0.999000 | 19 / 2909 |
| `chewsy_createsc.mp4` | 0.282 | 0.282 → 0.282 | 267 → 267 | 795 → 795 | 1.000000 | stream copy |
| `doordash/before-mobile.mp4` | 4.358 | 0.858 → 0.372 | 936 → 403 | 3129 → 994 | 0.999101 | 16 / 2346 |
| `doordash/before.mp4` | 4.358 | 1.690 → 0.442 | 1847 → 479 | 6307 → 1289 | 0.999075 | 19 / 4730 |
| `doordash/guide-mobile.mp4` | 8.963 | 2.244 → 1.720 | 1103 → 844 | 3226 → 2173 | 0.999040 | 14 / 2419 |
| `doordash/guide.mp4` | 8.963 | 4.371 → 2.728 | 2154 → 1343 | 5486 → 3440 | 0.999088 | 15 / 4114 |
| `doordash/iteration-banner-mobile.mp4` | 0.093 | 0.121 → 0.027 | 279 → 58 | 589 → 160 | 0.999184 | 25 / 441 |
| `doordash/iteration-banner.mp4` | 0.093 | 0.240 → 0.035 | 554 → 76 | 1152 → 201 | 0.999088 | 29 / 864 |
| `doordash/iteration-toast-mobile.mp4` | 1.146 | 0.358 → 0.092 | 448 → 112 | 1766 → 411 | 0.999020 | 24 / 1324 |
| `doordash/iteration-toast.mp4` | 1.146 | 0.815 → 0.146 | 1023 → 180 | 3988 → 697 | 0.999030 | 26 / 2990 |
| `doordash/legacy-feature-flag-mobile.mp4` | 17.366 | 3.373 → 1.162 | 1132 → 387 | 4599 → 1173 | 0.999158 | 17 / 3449 |
| `doordash/legacy-feature-flag.mp4` | 17.366 | 6.037 → 1.489 | 2029 → 497 | 7526 → 1599 | 0.999081 | 20 / 5644 |
| `doordash/prep-station-mobile.mp4` | 9.480 | 5.222 → 1.298 | 1081 → 266 | 3611 → 980 | 0.999144 | 18 / 2708 |
| `doordash/prep-station.mp4` | 9.480 | 9.716 → 1.793 | 2015 → 368 | 6090 → 1311 | 0.999049 | 21 / 4567 |
| `doordash/printer-setup-mobile.mp4` | 7.484 | 4.542 → 0.854 | 1120 → 207 | 4348 → 683 | 0.999029 | 20 / 3261 |
| `doordash/printer-setup.mp4` | 7.484 | 8.427 → 1.186 | 2082 → 289 | 7323 → 763 | 0.999036 | 22 / 5492 |
| `doordash/printer-types-mobile.mp4` | 13.023 | 3.282 → 1.521 | 1080 → 498 | 3707 → 1330 | 0.999033 | 15 / 2780 |
| `doordash/printer-types.mp4` | 13.023 | 6.418 → 2.226 | 2118 → 731 | 6379 → 2079 | 0.999038 | 17 / 4784 |
| `doordash/select-printer-mobile.mp4` | 8.424 | 2.459 → 1.074 | 1067 → 463 | 2440 → 1493 | 0.999069 | 15 / 1829 |
| `doordash/select-printer.mp4` | 8.424 | 4.818 → 1.603 | 2096 → 693 | 4287 → 2244 | 0.999037 | 17 / 3215 |
| `doordash/status-bar-entry-mobile.mp4` | 10.912 | 2.583 → 1.213 | 1060 → 495 | 3120 → 1890 | 0.999023 | 15 / 2339 |
| `doordash/status-bar-entry.mp4` | 10.912 | 5.000 → 1.823 | 2057 → 746 | 5997 → 2737 | 0.999036 | 17 / 4498 |
| `doordash/status-bar-mobile.mp4` | 15.806 | 5.759 → 1.247 | 1084 → 231 | 3674 → 778 | 0.999115 | 20 / 2755 |
| `doordash/status-bar.mp4` | 15.806 | 10.891 → 2.039 | 2053 → 381 | 6491 → 1206 | 0.999379 | 20 / 4867 |
| `doordash/status-footer-mobile.mp4` | 5.936 | 2.321 → 0.833 | 1059 → 377 | 3205 → 1046 | 0.999101 | 15 / 2403 |
| `doordash/status-footer.mp4` | 5.936 | 4.572 → 1.254 | 2091 → 570 | 5839 → 1520 | 0.999051 | 17 / 4379 |
| `doordash/status-logic-doc-mobile.mp4` | 26.562 | 3.543 → 15.560 | 1014 → 4472 | 1774 → 7398 | 0.999044 | 13 / 5320 |
| `doordash/status-logic-doc.mp4` | 26.562 | 7.085 → 18.531 | 2033 → 5327 | 3311 → 8023 | 0.999038 | 14 / 9932 |
| `doordash/status-logic-mobile.mp4` | 2.493 | 1.870 → 0.299 | 424 → 66 | 2374 → 399 | 0.999466 | 20 / 1780 |
| `doordash/status-logic.mp4` | 2.493 | 3.325 → 0.523 | 755 → 117 | 4178 → 678 | 0.999620 | 20 / 3133 |
| `doordash/toast-entry-mobile.mp4` | 10.024 | 2.179 → 1.051 | 1090 → 523 | 4400 → 1765 | 0.999033 | 15 / 3299 |
| `doordash/toast-entry.mp4` | 10.024 | 4.192 → 1.629 | 2102 → 813 | 7694 → 2904 | 0.999045 | 17 / 5770 |
| `doordash/unused-motion-cutter-mobile.mp4` | 0.132 | 0.132 → 0.132 | 272 → 272 | 830 → 830 | 1.000000 | stream copy |
| `doordash/unused-motion-cutter.mp4` | 0.132 | 0.132 → 0.132 | 272 → 272 | 830 → 830 | 1.000000 | stream copy |
| `doordash/unused-motion-printer-mobile.mp4` | 0.367 | 0.367 → 0.056 | 613 → 91 | 1352 → 188 | 0.999782 | 20 / 1014 |
| `doordash/unused-motion-printer.mp4` | 0.367 | 0.367 → 0.056 | 613 → 91 | 1352 → 188 | 0.999782 | 20 / 1014 |
| `fleetline-mobile.mp4` | 0.670 | 0.670 → 0.670 | 160 → 160 | 728 → 728 | 1.000000 | stream copy |
| `fleetline.mp4` | 0.670 | 0.670 → 0.670 | 160 → 160 | 728 → 728 | 1.000000 | stream copy |
| `gameboy-mobile.mp4` | 0.686 | 0.686 → 0.686 | 412 → 412 | 689 → 689 | 1.000000 | stream copy |
| `gameboy.mp4` | 0.686 | 0.686 → 0.686 | 412 → 412 | 689 → 689 | 1.000000 | stream copy |
| `haven_3d-mobile.mp4` | 2.270 | 0.997 → 2.270 | 1001 → 2283 | 1585 → 3092 | 1.000000 | stream copy |
| `haven_3d.mp4` | 2.270 | 2.001 → 2.270 | 2011 → 2283 | 2696 → 3092 | 1.000000 | stream copy |
| `home_screen-mobile.mp4` | 0.258 | 0.258 → 0.258 | 317 → 317 | 602 → 602 | 1.000000 | stream copy |
| `home_screen.mp4` | 0.258 | 0.258 → 0.258 | 317 → 317 | 602 → 602 | 1.000000 | stream copy |
| `library-mobile.mp4` | 2.542 | 0.687 → 0.990 | 1050 → 1515 | 2086 → 2484 | 0.999028 | 11 / 1564 |
| `library.mp4` | 2.542 | 1.349 → 1.727 | 2066 → 2646 | 3922 → 4314 | 0.999038 | 13 / 2941 |
| `manta-mobile.mp4` | 1.111 | 1.111 → 1.111 | 429 → 429 | 745 → 745 | 1.000000 | stream copy |
| `manta.mp4` | 1.111 | 1.111 → 1.111 | 429 → 429 | 745 → 745 | 1.000000 | stream copy |
| `missed-call-mobile.mp4` | 1.457 | 2.068 → 0.514 | 1162 → 285 | 3644 → 829 | 0.999403 | 20 / 2733 |
| `missed-call.mp4` | 1.457 | 3.964 → 0.802 | 2232 → 447 | 6598 → 1231 | 0.999533 | 20 / 4948 |
| `mock_call-mobile.mp4` | 0.181 | 0.181 → 0.181 | 86 → 86 | 208 → 208 | 1.000000 | stream copy |
| `mock_call.mp4` | 0.181 | 0.181 → 0.181 | 86 → 86 | 208 → 208 | 1.000000 | stream copy |
| `mood-colors-mobile.mp4` | 6.233 | 1.864 → 0.544 | 1115 → 322 | 2923 → 836 | 0.999564 | 20 / 2192 |
| `mood-colors.mp4` | 6.233 | 3.656 → 0.828 | 2191 → 492 | 5508 → 1230 | 0.999669 | 20 / 4131 |
| `mood_set-mobile.mp4` | 0.496 | 0.496 → 0.496 | 233 → 233 | 611 → 611 | 1.000000 | stream copy |
| `mood_set.mp4` | 0.496 | 0.496 → 0.496 | 233 → 233 | 611 → 611 | 1.000000 | stream copy |
| `multi-line-mobile.mp4` | 1.212 | 2.517 → 0.443 | 1136 → 196 | 2874 → 474 | 0.999490 | 20 / 2155 |
| `multi-line.mp4` | 1.212 | 4.910 → 0.701 | 2220 → 313 | 5412 → 740 | 0.999533 | 20 / 4059 |
| `nova_practice_V.mp4` | 1.078 | 1.078 → 1.078 | 1074 → 1074 | 4135 → 4135 | 1.000000 | stream copy |
| `nova_preview_quiz-mobile.mp4` | 7.680 | 1.175 → 0.439 | 983 → 366 | 2726 → 980 | 0.999313 | 20 / 2044 |
| `nova_preview_quiz.mp4` | 7.680 | 2.321 → 0.697 | 1945 → 582 | 6300 → 1597 | 0.999577 | 20 / 4725 |
| `nova_walkthrough-mobile.mp4` | 5.417 | 4.283 → 2.721 | 1015 → 643 | 4099 → 3348 | 0.999045 | 17 / 3074 |
| `nova_walkthrough.mp4` | 5.417 | 8.452 → 4.175 | 2007 → 989 | 7136 → 5293 | 0.999089 | 19 / 5352 |
| `nuance-talking-mobile.mp4` | 3.869 | 2.149 → 0.546 | 1031 → 260 | 1882 → 508 | 0.999368 | 20 / 1411 |
| `nuance-talking.mp4` | 3.869 | 3.869 → 0.808 | 1859 → 386 | 3538 → 712 | 0.999477 | 20 / 2653 |
| `nuance_pure-mobile.mp4` | 0.127 | 0.127 → 0.127 | 210 → 210 | 370 → 370 | 1.000000 | stream copy |
| `nuance_pure.mp4` | 0.127 | 0.127 → 0.127 | 210 → 210 | 370 → 370 | 1.000000 | stream copy |
| `pen-mobile.mp4` | 0.080 | 0.080 → 0.080 | 80 → 80 | 138 → 138 | 1.000000 | stream copy |
| `pen.mp4` | 0.080 | 0.080 → 0.080 | 80 → 80 | 138 → 138 | 1.000000 | stream copy |
| `quiz_fullscreen_student-mobile.mp4` | 1.701 | 2.151 → 0.590 | 1138 → 308 | 5184 → 1435 | 0.999140 | 20 / 3887 |
| `quiz_fullscreen_student.mp4` | 1.701 | 4.022 → 1.038 | 2132 → 547 | 6559 → 2843 | 0.999382 | 20 / 4919 |
| `quiz_fullscreen_teacher-mobile.mp4` | 1.431 | 2.094 → 0.620 | 1141 → 334 | 4513 → 1001 | 0.999060 | 20 / 3384 |
| `quiz_fullscreen_teacher.mp4` | 1.431 | 3.833 → 1.052 | 2092 → 570 | 7942 → 1840 | 0.999310 | 20 / 5956 |
| `rabbithole-mobile.mp4` | 1.308 | 1.308 → 1.308 | 455 → 455 | 1747 → 1747 | 1.000000 | stream copy |
| `rabbithole.mp4` | 1.308 | 1.308 → 1.308 | 455 → 455 | 1747 → 1747 | 1.000000 | stream copy |
| `recent_call-mobile.mp4` | 0.368 | 0.368 → 0.368 | 236 → 236 | 627 → 627 | 1.000000 | stream copy |
| `recent_call.mp4` | 0.368 | 0.368 → 0.368 | 236 → 236 | 627 → 627 | 1.000000 | stream copy |
| `transcript-mobile.mp4` | 1.591 | 2.854 → 0.566 | 1075 → 210 | 2907 → 514 | 0.999478 | 20 / 2179 |
| `transcript.mp4` | 1.591 | 5.590 → 0.907 | 2109 → 339 | 5312 → 805 | 0.999525 | 20 / 3983 |
| `wiggle-mobile.mp4` | 0.153 | 0.153 → 0.153 | 99 → 99 | 233 → 233 | 1.000000 | stream copy |
| `wiggle.mp4` | 0.153 | 0.153 → 0.153 | 99 → 99 | 233 → 233 | 1.000000 | stream copy |

## Pending constraint decisions

These existing files were left unchanged. No tested replacement meets all three requirements (SSIM ≥0.999, mobile width ≤1280, bytes ≤source). They are not counted as accepted outputs. Stream-copying would preserve source pixels and size but exceed the mobile width limit; a qualifying resized encode exceeds source size.

| Clip | Original width / MiB | Existing MiB / SSIM | Existing avg / peak kbps (unchanged) | Smallest passing tested MiB / SSIM |
|---|---:|---:|---:|---:|
| `chewsy_createsc-mobile.mp4` | 1440 / 0.282 | 1.051 / 0.999622 | 1007 / 2825 | 0.579 / 0.999042 |
| `nova_practice_V-mobile.mp4` | 1588 / 1.078 | 1.093 / 0.997479 | 1090 / 3244 | 1.878 / 0.999018 |

Existing bytes and average/peak rates are unchanged; [pending records](reencode-pending.json) contain those measurements and the failed search attempts. The strict inventory verifier intentionally fails until these decisions are resolved.

Validated outputs: 82. Full attempt histories, source bitrate, hashes, dimensions and timing checks: [reencode-quality](reencode-quality/).
