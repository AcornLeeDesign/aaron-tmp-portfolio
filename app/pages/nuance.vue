<script setup lang="ts">
import captionMateCallHistoryUrl from '~/assets/images/case-studies/nuance/captionmate-call-history.png'
import innoCaptionCallUrl from '~/assets/images/case-studies/nuance/innocaption-call-upscaled.png'
import liveCaptionCallUrl from '~/assets/images/case-studies/nuance/live-caption-call-upscaled.png'

type SectionId =
  | 'overview'
  | 'problem'
  | 'visual-cues'
  | 'product'
  | 'learning'
  | 'next-steps'

const sections: Array<{ id: SectionId, label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'problem', label: 'Problem' },
  { id: 'visual-cues', label: 'Visual cues' },
  { id: 'product', label: 'Product' },
  { id: 'learning', label: 'Learnings' },
  { id: 'next-steps', label: 'Next steps' },
]

const route = useRoute()
const activeSection = ref<SectionId>('overview')
const pageRef = ref<HTMLElement | null>(null)
let scrollFrame: number | undefined
let sectionObserver: IntersectionObserver | undefined

watch(() => route.hash, (hash) => {
  const hashSection = hash.slice(1) as SectionId
  if (sections.some(section => section.id === hashSection)) {
    activeSection.value = hashSection
  }
}, { immediate: true })

useHead({ title: 'Nuance — Aaron Lee' })

function updateActiveSection() {
  scrollFrame = undefined
  const sectionElements = pageRef.value?.querySelectorAll<HTMLElement>('[data-case-section]')
  if (!sectionElements?.length) return

  const activationLine = window.innerHeight * 0.6
  let current = sectionElements[0]?.dataset.caseSection as SectionId

  sectionElements.forEach((section) => {
    if (section.getBoundingClientRect().top <= activationLine) {
      current = section.dataset.caseSection as SectionId
    }
  })

  const scrollTop = Math.max(
    window.scrollY,
    document.documentElement.scrollTop,
    document.body.scrollTop,
  )
  const viewportBottom = scrollTop + document.documentElement.clientHeight
  const pageHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
  )
  const reachedPageEnd = Math.ceil(viewportBottom) >= pageHeight

  if (reachedPageEnd) {
    current = sectionElements[sectionElements.length - 1]?.dataset.caseSection as SectionId
  }

  if (current) activeSection.value = current
}

function scheduleSectionUpdate() {
  if (scrollFrame !== undefined) return
  scrollFrame = window.requestAnimationFrame(updateActiveSection)
}

onMounted(() => {
  const initialHash = window.location.hash.slice(1) as SectionId
  if (sections.some(section => section.id === initialHash)) {
    activeSection.value = initialHash
  } else {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })
  }

  nextTick(() => {
    const sectionElements = pageRef.value?.querySelectorAll<HTMLElement>('[data-case-section]')

    if (sectionElements?.length) {
      sectionObserver = new IntersectionObserver(scheduleSectionUpdate)
      sectionElements.forEach(section => sectionObserver?.observe(section))
    }

    updateActiveSection()
  })
  window.addEventListener('scroll', scheduleSectionUpdate, { passive: true })
  document.addEventListener('scroll', scheduleSectionUpdate, { passive: true, capture: true })
  window.addEventListener('resize', scheduleSectionUpdate)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleSectionUpdate)
  document.removeEventListener('scroll', scheduleSectionUpdate, true)
  window.removeEventListener('resize', scheduleSectionUpdate)
  sectionObserver?.disconnect()
  if (scrollFrame !== undefined) window.cancelAnimationFrame(scrollFrame)
})
</script>

<template>
  <article ref="pageRef" class="nuance-case">
    <div class="nuance-case__layout">
      <CaseStudySectionNav
        :sections="sections"
        :active-section="activeSection"
        label="Nuance case study sections"
        @select="activeSection = $event"
      />

      <div class="case-content">
        <section
          id="overview"
          class="case-section case-section--overview"
          data-case-section="overview"
        >
          <h1>Nuance</h1>

          <div class="case-section__intro">
            <h2>Bringing emotional signifiers to calls for the hard of hearing</h2>
            <p>
              Designed a call app to improve conversational comprehension over call by
              pairing an AI-driven emotional visualizer with live captioning
            </p>
          </div>

          <ul class="case-meta" aria-label="Project details">
            <li>Concept</li>
            <li>Product designer + 3D artist</li>
            <li>Built with Jae Sung Park, Uyen Hoang</li>
            <li>2 days</li>
          </ul>
        </section>

        <figure class="case-media-figure case-media-figure--overview">
          <div class="case-media-placeholder case-media-placeholder--video case-media-placeholder--fig-one">
            <div class="case-phone-device">
              <div class="case-phone-screen">
                <div class="case-phone-video-crop">
                  <VideoPlayer case-study
                    class="case-media-video case-media-video--fig-one-screen"
                    src="/videos/nuance-talking.mp4"
                  />
                </div>
              </div>
              <img
                class="case-phone-frame"
                src="/images/case-studies/nuance/iphone-16-pro.png"
                alt=""
                aria-hidden="true"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
          <figcaption class="case-media-caption">
            Fig 1. Live call demo. Character animates according to AI interpretation.
          </figcaption>
        </figure>

        <section
          id="problem"
          class="case-section case-section--problem"
          data-case-section="problem"
        >
          <div class="case-section__heading">
            <h2>The deaf can’t hear emotion over the phone without video, which causes frustration and miscommunication</h2>
            <p>
              The hard of hearing miss the pauses, subtle laughs, and shifts in tone.
              They have trouble understanding emotional context over call with only
              captioning, which leads to miscommunication and struggle for both sides. This is a real issue when the caller is less familiar.
            </p>
          </div>

          <div class="case-evidence" aria-label="Research evidence">
            <figure class="evidence-card">
              <blockquote>
                <strong>24%</strong> of 131 HOH participants in a study experienced
                some-to-moderate difficulty in comprehension with captions.
              </blockquote>
              <figcaption>InnoCaption 2023</figcaption>
            </figure>

            <figure class="evidence-card">
              <blockquote>
                “I know what they’re saying, but I can’t feel how they’re saying it.”
              </blockquote>
              <figcaption>Anonymous older adult</figcaption>
            </figure>
          </div>
          <div class="case-section--competitors">
            <div class="case-section__heading">
              <h2>Current captioning services lack emotional emotional clarity</h2>
              <p>
                Alternative apps focus on captioning, yet the feeling of a real conversation
                is lost along with emotional clarity. Captions can’t be the only solution.
              </p>
            </div>

            <figure class="case-media-figure case-media-figure--competitors case-media-figure--copy-width">
              <div class="phone-placeholders" aria-label="Current captioning service interfaces">
                <img
                  class="phone-placeholder"
                  :src="captionMateCallHistoryUrl"
                  alt="CaptionMate call history showing captioned conversation bubbles"
                  loading="eager"
                  decoding="async"
                />
                <img
                  class="phone-placeholder"
                  :src="innoCaptionCallUrl"
                  alt="InnoCaption conference call with live captions"
                  loading="eager"
                  decoding="async"
                />
                <img
                  class="phone-placeholder"
                  :src="liveCaptionCallUrl"
                  alt="Live caption calling app displaying a transcribed conversation"
                  loading="eager"
                  decoding="async"
                />
              </div>
              <figcaption class="case-media-caption">
                Fig 2. Many options offer the same features with no real solve.
              </figcaption>
            </figure>
          </div>
        </section>

        <section
          id="visual-cues"
          class="case-section case-section--visual-cues"
          data-case-section="visual-cues"
        >
          <div class="case-section__heading">
            <h2>Layering visual cues to make interpretation easier</h2>
            <p class="cue-sequence">
              More visual cues →<br />
              More emotional context →<br />
              Improved comprehension
            </p>
            <p>
              The more senses that are engaged, the more real the experience becomes.
			  In the same vein, if we layer more sensory information given to the most active sense, sight, they’ll be able to more efficiently analyze context clues.
            </p>
          </div>

          <figure class="case-media-figure case-media-figure--visual-cues case-media-figure--copy-width">
            <div class="case-media-placeholder visual-cues-media">
              <img
                class="visual-cues-diagram"
                src="/images/case-studies/nuance/visual-cues.png"
                alt="Diagram showing captions, avatars, expression, color, brightness, and depth as complementary visual cues"
                loading="lazy"
                decoding="async"
              />
            </div>
            <figcaption class="case-media-caption">
              Fig 3. Deciding what different information we could pass to the eyes.
            </figcaption>
          </figure>

          <div class="visual-cue-details">
            <div class="cue-detail">
              <h2>Always having facial expressions available in no-video situations</h2>
              <p>
                The hard of hearing rely on facial expressions in regular conversation
                to pick up nonverbal cues. Not every call is FaceTime so we create an avatar.
              </p>
			  <p>
                AI would detect the caller’s tone and immediately depict a facial expression.
              </p>
            </div>

            <figure class="case-media-figure case-media-figure--copy-width">
              <div
                class="case-media-placeholder expression-media"
                role="group"
                aria-label="Two expressive Nuance avatars"
              >
                <img
                  src="/images/case-studies/nuance/avatar-listening-blue.png"
                  alt="Blue Nuance avatar with a concerned expression"
                  loading="lazy"
                  decoding="async"
                />
                <img
                  src="/images/case-studies/nuance/avatar-listening-pink.png"
                  alt="Pink Nuance avatar with an attentive expression"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption class="case-media-caption">
                Fig 4. Modeled and rigged a sample character that shifts color and facial expressions.
              </figcaption>
            </figure>

            <div class="cue-detail">
              <h2>Color is often linked with emotion</h2>
              <p>
                Color is often directly linked to emotion, so we leveraged color as a
                visual cue for emotion, making facial expressions more easy to interpret.
              </p>
            </div>
          </div>

          <div class="case-media-stack" aria-label="Visual cue media">
            <figure class="case-media-figure">
              <div class="case-media-placeholder case-media-placeholder--video case-media-placeholder--mood-colors">
                <div class="case-phone-device">
                  <div class="case-phone-screen">
                    <div class="case-phone-video-crop">
                      <VideoPlayer case-study
                        class="case-media-video case-media-video--mood-screen"
                        src="/videos/mood-colors.mp4"
                      />
                    </div>
                  </div>
                  <img
                    class="case-phone-frame"
                    src="/images/case-studies/nuance/iphone-16-pro.png"
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
              <figcaption class="case-media-caption">Fig 5. Mood color pairs.</figcaption>
            </figure>
          </div>
        </section>

        <section
          id="product"
          class="case-section case-section--product"
          data-case-section="product"
        >
          <div class="case-section__heading">
            <h2>Product</h2>
          </div>

          <div class="case-media-stack" aria-label="Product demonstrations">
            <figure class="case-media-figure">
              <div class="case-media-placeholder case-media-placeholder--video">
                <VideoPlayer case-study
                  class="case-media-video"
                  src="/videos/transcript.mp4"
                  aria-label="Transcript feature demonstration"
                />
              </div>
              <figcaption class="case-media-caption">Fig 6. Preview transcript.</figcaption>
            </figure>
            <figure class="case-media-figure">
              <div class="case-media-placeholder case-media-placeholder--video">
                <VideoPlayer case-study
                  class="case-media-video"
                  src="/videos/asl-feature.mp4"
                  aria-label="ASL feature demonstration"
                />
              </div>
              <figcaption class="case-media-caption">Fig 7. ASL feature.</figcaption>
            </figure>
            <figure class="case-media-figure">
              <div class="case-media-placeholder case-media-placeholder--video">
                <VideoPlayer case-study
                  class="case-media-video"
                  src="/videos/multi-line.mp4"
                  aria-label="Multi-line transcript demonstration"
                />
              </div>
              <figcaption class="case-media-caption">
                Fig 8. Dynamic layout for multi-line handling.
              </figcaption>
            </figure>
            <figure class="case-media-figure">
              <div class="case-media-placeholder case-media-placeholder--video">
                <VideoPlayer case-study
                  class="case-media-video"
                  src="/videos/missed-call.mp4"
                  aria-label="Missed call feature demonstration"
                />
              </div>
              <figcaption class="case-media-caption">Fig 9. Recent call playback</figcaption>
            </figure>
          </div>
        </section>

        <section
          id="learning"
          class="case-section case-section--learning"
          data-case-section="learning"
        >
          <h2>Learnings</h2>
          <ol class="case-numbered-list learning-list">
            <li>
              <div>
                <h3>Layered cues build an immersive experience</h3>
                <div class="learning-list__body">
                  <p>
                    Activating different senses and addressing each sense through
                    different angles brings greater comprehension and easier decision making.
                  </p>
                  <p>For example, sight can pick up color, size, depth, movement, etc.</p>
                </div>
              </div>
            </li>
            <li>
              <div>
                <h3>Accessible design should be intuitive and enjoyable</h3>
                <div class="learning-list__body">
                  <p>Not a slap-on feature as “accommodation”.</p>
                </div>
              </div>
            </li>
            <li>
              <div>
                <h3>Scoping one great experience</h3>
                <div class="learning-list__body">
                  <p>
                    During a sprint, scoping down to aspects of a single core experience
                    forces out potential for feature bloat.
                  </p>
                </div>
              </div>
            </li>
          </ol>
        </section>

        <section
          id="next-steps"
          class="case-section case-section--next-steps"
          data-case-section="next-steps"
        >
          <h2>Next steps</h2>
          <ol class="case-numbered-list next-steps-list">
            <li>
              <div>
                <p class="next-steps-list__action">
                  Talk with 2-3 engineers and psychologists to understand blindspots.
                </p>
                <p>
                  Emotion-to-color is a foggy area. AI voice → expression is also an
                  experimental concept and may have latency issues.
                </p>
              </div>
            </li>
            <li>
              <div>
                <p class="next-steps-list__action">
                  Get a working prototype to an excited user and have them use it for 1-2 weeks.
                </p>
                <p>
                  Measure success by satisfaction survey and length of calls compared to past data.
                </p>
              </div>
            </li>
          </ol>
        </section>
      </div>
    </div>
  </article>
</template>

<style scoped>
.nuance-case {
  --case-copy-media-gap: var(--space-18);
  /* Shared measure for copy and copy-width media. */
  --case-copy-width: var(--content-copy-width);
  /* Keeps prototype videos immersive without letting them over-expand on ultrawide displays. */
  --case-prototype-media-max-width: 1800px;
  --case-competitor-media-opacity: 0.6;
  --case-avatar-scale: 1.2;
  /* Matches the phone treatment from the original interactive Nuance prototype. */
  --case-phone-device-height: 88%;
  --case-phone-device-aspect: 450 / 920;
  --case-phone-screen-aspect: 402 / 874;
  --case-phone-screen-background: #080c0f;
  /* Match the homepage's portrait crop for mobile phone demonstrations. */
  --case-mobile-demo-aspect: 3 / 4;
  /* Keeps the transparent visual-cues diagram readable without treating it as full-bleed media. */
  --case-visual-cues-min-width: 320px;
  --case-visual-cues-max-width: 800px;
  /* Caps each square avatar while allowing both to share the standard media block. */
  --case-avatar-max-size: 520px;
  width: 100%;
  padding: calc(var(--layout-header-clearance) + var(--space-m)) var(--layout-content-edge) var(--space-30);
  color: var(--color-text);
}

.nuance-case__layout {
  position: relative;
  width: 100%;
  margin-inline: auto;
}


.case-content {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
}

.case-section {
  width: min(var(--case-copy-width), 100%);
  scroll-margin-top: calc(var(--layout-header-clearance) + var(--space-m));
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-body);
}

.case-section--overview {
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
}

.case-section--overview h1 {
  margin: 0;
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-regular);
  letter-spacing: -0.02em;
  line-height: var(--line-height-body);
}

.case-section__intro,
.case-section__heading,
.cue-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.case-section h2 {
  margin: 0;
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-heading);
  letter-spacing: 0;
  line-height: var(--line-height-body);
}

.case-section p {
  margin: 0;
}

.case-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
  color: var(--color-subdued);
  font-size: var(--font-size-s);
  line-height: var(--line-height-body);
}

.case-meta li:first-child {
  color: var(--color-text);
}

.case-media-placeholder {
  display: block;
  width: 100%;
  aspect-ratio: 1075 / 607;
  overflow: hidden;
  border-radius: var(--case-study-surface-radius);
  background: var(--color-media-background);
}

.case-media-figure {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
}

.case-media-figure--overview,
.case-media-figure--competitors,
.case-media-figure--visual-cues {
  margin-top: var(--case-copy-media-gap);
}

.case-media-caption {
  width: min(var(--case-copy-width), 100%);
  margin-top: var(--space-xs);
  margin-inline: auto;
  color: var(--color-subdued);
  font-family: var(--font-mono-ui);
  font-size: var(--font-size-s);
  line-height: var(--line-height-body);
  text-align: left;
}

.case-media-placeholder--video {
  isolation: isolate;
  -webkit-mask-image: -webkit-radial-gradient(white, black);
  background: var(--color-media-background);
}

.case-media-placeholder--fig-one,
.case-media-placeholder--mood-colors {
  display: grid;
  place-items: center;
  background-position: center;
  background-size: cover;
}

.case-media-placeholder--fig-one {
  background-image: url('/images/case-studies/nuance/fig-1-clouds.jpg');
}

.case-media-placeholder--mood-colors {
  background-image: url('/images/case-studies/nuance/mood-colors-clouds.jpg');
}

.case-phone-device {
  position: relative;
  height: var(--case-phone-device-height);
  aspect-ratio: var(--case-phone-device-aspect);
}

.case-phone-screen {
  position: absolute;
  top: 2.5%;
  left: 50%;
  width: auto;
  height: 95%;
  aspect-ratio: var(--case-phone-screen-aspect);
  transform: translateX(-50%);
  overflow: hidden;
  border-radius: 13.68% / 6.29%;
  background: var(--case-phone-screen-background);
}

.case-phone-video-crop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
}

.case-media-video.case-media-video--fig-one-screen {
  /* Maps a 414 × 900 source crop into the prototype's 402 × 874 screen ratio. */
  position: absolute;
  top: -9.667%;
  left: -149.758%;
  width: 399.517%;
  max-width: none;
  height: 120%;
  border-radius: 0;
  object-fit: fill;
}

.case-media-video.case-media-video--mood-screen {
  /* Maps the source crop to the prototype's exact 402 × 874 screen ratio. */
  position: absolute;
  top: -9.947%;
  left: -151.085%;
  width: 402.956%;
  max-width: none;
  height: 120.974%;
  border-radius: 0;
  object-fit: fill;
}

.case-phone-frame {
  position: absolute;
  z-index: 1;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
  user-select: none;
}

.case-media-video {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: contain;
  object-position: center;
}

.case-media-placeholder--image {
  object-fit: cover;
  object-position: center;
}

.case-section--problem {
  width: min(1200px, 100%);
  margin-top: var(--case-copy-media-gap);
}

.case-section--problem > .case-section__heading,
.case-section--problem > .case-evidence {
  width: min(var(--case-copy-width), 100%);
  margin-inline: auto;
}

.case-evidence {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
  margin-top: var(--space-xl);
}

.evidence-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin: 0;
  padding: var(--space-s) var(--space-m);
  border-radius: var(--case-study-surface-radius);
  background: var(--color-surface);
  color: var(--color-subdued);
}

.evidence-card blockquote {
  margin: 0;
}

.evidence-card strong {
  color: var(--color-text);
  font-weight: var(--font-weight-regular);
}

.evidence-card figcaption {
  color: var(--color-subdued);
  font-size: var(--font-size-s);
  text-align: right;
}

.case-section--competitors {
  width: min(1200px, 100%);
  margin-top: var(--case-copy-media-gap);
}

.case-section--competitors .case-section__heading {
  width: min(var(--case-copy-width), 100%);
  margin-inline: auto;
}

.case-media-figure--copy-width {
  width: min(var(--case-copy-width), 100%);
  margin-inline: auto;
}

.phone-placeholders {
  display: grid;
  width: 100%;
  aspect-ratio: 1075 / 607;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-m);
  opacity: var(--case-competitor-media-opacity);
}

.phone-placeholder {
  display: block;
  min-width: 0;
  width: 100%;
  height: 100%;
  border-radius: var(--case-study-surface-radius);
  background: var(--color-media-background);
  object-fit: cover;
  object-position: center;
}

.case-section--visual-cues {
  width: 100%;
  margin-top: var(--case-copy-media-gap);
}

.case-section--visual-cues > .case-section__heading {
  width: min(var(--case-copy-width), 100%);
  margin-inline: auto;
}

.cue-sequence {
  white-space: nowrap;
}

.visual-cues-diagram {
  width: min(100%, var(--case-visual-cues-max-width));
  min-width: min(100%, var(--case-visual-cues-min-width));
  height: auto;
}

.visual-cues-media {
  display: grid;
  place-items: center;
  padding: var(--space-xl);
}

.visual-cue-details {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: var(--case-copy-media-gap);
  margin-top: var(--case-copy-media-gap);
}

.visual-cue-details .cue-detail {
  width: min(var(--case-copy-width), 100%);
  margin-inline: auto;
}

.expression-media {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  place-items: center;
  gap: var(--space-xxl);
  padding: var(--space-xl);
}

.expression-media img {
  width: min(100%, var(--case-avatar-max-size));
  aspect-ratio: 1;
  object-fit: contain;
  transform: scale(var(--case-avatar-scale));
  transform-origin: center;
}

.case-media-stack {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
  margin-top: var(--case-copy-media-gap);
}

.case-section--product {
  width: 100%;
  margin-top: var(--case-copy-media-gap);
}

.case-section--product > .case-section__heading {
  width: min(var(--case-copy-width), 100%);
  margin-inline: auto;
}

.case-section--learning {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
  margin-top: var(--case-copy-media-gap);
}

.case-numbered-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.learning-list {
  counter-reset: learning;
}

.next-steps-list {
  counter-reset: next-step;
}

.case-numbered-list li {
  display: grid;
  grid-template-columns: var(--space-m) 1fr;
  align-items: baseline;
  gap: var(--space-s);
}

.learning-list li {
  counter-increment: learning;
}

.learning-list li::before {
  content: counter(learning);
  font-weight: var(--font-weight-medium);
}

.next-steps-list li {
  counter-increment: next-step;
}

.next-steps-list li::before {
  content: counter(next-step);
  font-weight: var(--font-weight-medium);
}

.case-numbered-list li > div {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: baseline;
  gap: var(--space-10);
}

.learning-list li > div,
.next-steps-list li > div {
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-xs);
}

.learning-list h3 {
  margin: 0;
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-heading);
  letter-spacing: 0;
  line-height: var(--line-height-body);
}

.learning-list__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.case-section--next-steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
  margin-top: var(--case-copy-media-gap);
  padding-bottom: calc(var(--case-study-bottom-blur-height) + var(--space-xxxl));
}

.next-steps-list__action {
  font-size: var(--font-size-m);
}

@media (max-width: 1023px) {
  .nuance-case {
    padding-top: var(--layout-header-clearance);
  }


}

@media (min-width: 1601px) {
  .case-media-placeholder--video {
    width: min(100%, var(--case-prototype-media-max-width));
  }
}

@media (max-width: 767px) {
  .case-section {
    font-size: var(--font-size-s);
  }

  .case-section h2 {
    font-size: var(--font-size-m);
  }

  .learning-list h3,
  .next-steps-list__action {
    font-size: var(--font-size-s);
  }

  .phone-placeholders {
    gap: var(--space-s);
  }
}

@media (max-width: 639px) {
  /* Figures 1 and 5–9: larger phones without the wide source-canvas margins. */
  .case-media-placeholder--video {
    aspect-ratio: var(--case-mobile-demo-aspect);
  }

  .case-media-placeholder--video > .case-media-video {
    object-fit: cover;
    object-position: center;
  }
}

@media (max-width: 479px) {
  .cue-sequence {
    white-space: normal;
  }
}
</style>
