# Project Instructions

This file is the authoritative instruction source for Codex in this repository. Files in `.cursor/rules/` may mirror these rules for editor compatibility.

## Figma Design-to-Code

- When a request includes a Figma URL or asks to implement a Figma design, use the official Figma MCP as the source of truth.
- Load the required Figma design-to-code skill before requesting design context.
- Call `get_design_context` for the exact file key and node ID, including its screenshot, before editing code.
- If the returned context is sparse, fetch the relevant visible child nodes before implementation.
- Use Figma MCP asset tooling for required design assets; do not substitute screenshots or manually recreate assets.
- Validate implementations against the Figma screenshot and the project’s existing components, tokens, and conventions.

## Design Tokens

- Use existing CSS custom-property tokens for spacing, typography, color, radius, sizing, and layout values.
- Never place a raw spacing value in `margin`, `padding`, `gap`, layout offsets, or spacing calculations. `0` is allowed.
- Use the numeric spacing primitives in `app/assets/css/main.css`; the suffix is the number of 4px units (`--space-12` = 48px).
- Prefer the readable compact aliases (`--space-xs`, `--space-m`, etc.) when they clearly express an established local pattern.
- Use semantic layout or component tokens for intentional off-grid values. Define the raw value once in the appropriate token scope, document its purpose, and reference the token everywhere else.
- When implementing from Figma or using the Figma MCP, translate Figma values to existing tokens. Figma measurements do not override the token requirement.
- If a Figma value has no equivalent token, use the nearest established token unless exact fidelity is necessary; then add a reusable semantic token instead of writing the value inline.
- Fluid spacing may use `clamp()`, but its fixed endpoints must be tokens.
- Exceptions: `0`, one-pixel borders, media-query breakpoints, percentages, runtime geometry, and accessibility off-screen techniques.

## Responsive Breakpoints

- Mobile: `0–639px` (`max-width: 639px`).
- Tablet: `640–1023px`.
- Desktop: `1024px` and wider (`min-width: 1024px`).
- Use `max-width: 1023px` for styles shared by tablet and mobile.
- Prefer these thresholds over one-off breakpoints. Add a component-specific breakpoint only when its content demonstrably requires one, and document why.
- Complex desktop interactions must have a linear, touch-friendly fallback at tablet width and below.
- The homepage project carousel is desktop-only. At `1023px` and below, render projects as a normal single-column list with no sticky or scroll-driven horizontal behavior.

## Case-Study Video Quality

- Treat full-width and hero case-study videos as presentation media, not homepage/waterfall thumbnails.
- Preserve the source pixel dimensions for case-study media up to 2560px wide. Do not apply the 1080px waterfall downscale profile.
- When the source is browser-compatible H.264, use a stream copy rather than re-encoding: `-c:v copy -an -movflags +faststart`.
- Only re-encode when compatibility or an unreasonably large source requires it. Keep the original resolution when possible and use a high-quality target such as H.264 CRF 18–20 or VP9 CRF 24–27.
- Generate WebM fallbacks at the same dimensions as the delivered MP4; never use a visibly lower-quality fallback.
- Preserve the untouched source in `public/videos/originals/` and generate the poster from that source.
- Use `VideoPlayer` for lazy loading, playback coordination, and poster handling.
- Verify delivered resolution, codecs, duration, and file size with `ffprobe` before considering the asset complete.
- Aggressive CRF 30+, low-bitrate, or downscaled encodes are allowed only for small homepage/waterfall thumbnails.
