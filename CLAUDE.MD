# Aaron Tmp Portfolio

## Project Overview
Personal portfolio website for ACAD 275. Built with Nuxt 4 and Vue 3. Uses npm as the package manager.

## Tech Stack
- Framework: Nuxt 4 (v4.4.2)
- Language: TypeScript, Vue 3 SFCs with `<script setup lang="ts">`
- Package Manager: npm — always use `npm install`, `npm run dev`, etc. npm only - no other package managers.

## Project Structure (Nuxt 4)

    app/
      app.vue                    # Root component — <NuxtLayout> + <NuxtPage />
      pages/
        index.vue                # Home (/) — waterfall video grid
        nova.vue                 # Gated Nova case study (/nova)
        nuance.vue               # Gated Nuance case study (/nuance)
      components/
        VideoPlayer.vue          # Lazy-loading video with WebM/MP4 sources + poster
        CaseStudyGate.vue        # Password form for case studies
        CaseStudyPage.vue        # Shared case study layout + gated body
      data/
        caseStudies.ts           # Structured Nova / Nuance case study content
      layouts/
        default.vue              # Site shell: header + floating pill nav + contact popover
      assets/
        css/main.css             # Global styles, CSS variables, reset, .prose utility
    public/
      images/                    # Static images (PNG) for waterfall grid
      videos/                    # Optimized video files (MP4, WebM, posters)
      videos/posters/            # First-frame JPEG posters for lazy loading
      videos/originals/          # Uncompressed video backups
      icons/                     # SVG icons (heroicons)
    claude-docs/
      video-treatment.md         # Full video optimization process documentation
    nuxt.config.ts               # Nuxt configuration

## Navigation & Routing
- Floating pill nav at bottom center with Work, About, Contact.
- Work and About are NuxtLink routes.
- Contact is a popover modal (not a page) — toggles above the pill nav with spring animation.
- Deployment items open external URLs in new tabs (`target="_blank"`).
- Items with no tag/link are non-interactive divs.

## Waterfall Grid (index.vue)
- 3-column layout with items sized by aspect ratio.
- Supports both videos (via `VideoPlayer`) and images (via `<img>` with `type: 'image'`).
- Each item may have a status or deployment tag shown on hover (desktop) or always visible (mobile/tablet ≤1023px).
- Deployment tags use an inline external-link SVG icon.
- Icons are inline SVGs with `stroke="currentColor"` to inherit text color.
- Do NOT use `<img>` for icons inside tags — `currentColor` won't work.
- Aspect ratios can be manually overridden (e.g. `1 / 1`) — `object-fit: cover` handles cropping.

## Case-study Routes
- `/nova` and `/nuance` are password-gated case studies (shared `sessionStorage` key `case-study-unlocked`).
- Default password is `case` via `runtimeConfig.public.caseStudyPassword`.
- Content lives in `app/data/caseStudies.ts` (sourced from Framer dumps in `content/case-studies/`).
- Shared UI: `CaseStudyGate.vue` (password form) + `CaseStudyPage.vue` (layout/body).
- These routes are development-only and return 404 in production builds.
- Home waterfall cards remain unlinked and retain the "Case study soon" label.
- Do not invent case-study facts beyond the Framer text package.

## Key CSS Variables (defined in main.css :root)
- `--color-bg` — page background (#ffffff)
- `--color-surface` — card/nav surfaces (#f2f2f2)
- `--color-text` / `--color-text-muted` — primary (#000000) and secondary text
- `--color-border` — borders
- `--color-placeholder` — placeholder backgrounds (#d9d9d9)
- `--page-padding` — consistent inline padding (24px)
- `--font-sans` — Geist, system-ui fallback

## Conventions
- Always use `<script setup lang="ts">` in every component.
- Nuxt auto-imports: do NOT manually import ref, computed, useRoute, watch, etc.
- Components in app/components/ are auto-imported — no manual registration.
- Do NOT name components starting with "Lazy" — Nuxt reserves that prefix for its own lazy-loading.
- Use file-based routing via app/pages/.
- Use semantic HTML for accessibility.
- Keep components small and single-purpose.
- Mobile-first responsive design.

## Commands
- `npm install` — install dependencies
- `npm run dev` — dev server at http://localhost:3000
- `npm run build` — production build
- `npm run generate` — static generation
- `npm run preview` — preview production build

## Video Treatment
- All new videos must go through the optimization process documented in `claude-docs/video-treatment.md`.
- Waterfall videos use CRF 30 and a maximum width of 1080px.
- Steps: get dimensions → backup original → compress MP4 (H.264) → generate WebM (VP9) → generate poster JPEG.
- The `VideoPlayer` component handles lazy source attachment, MP4-first fallback ordering, viewport playback coordination (maximum three), and poster images automatically.
- Originals are backed up in `public/videos/originals/`.

## Design Direction
- Clean, modern, minimal aesthetic using Geist font
- Font weights: only regular (400) and medium (500) — no bold or semibold
- Smooth animations with gentle spring easing where appropriate
- Responsive: mobile-first, 1-col mobile / 3-col tablet and desktop
- Tags visible by default on mobile/tablet, hover-only on desktop
