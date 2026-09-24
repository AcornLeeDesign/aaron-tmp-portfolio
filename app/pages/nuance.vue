<script setup lang="ts">
type SectionId =
  | 'overview'
  | 'problem'
  | 'current-analysis'
  | 'visual-cues'
  | 'personalization'
  | 'learning'

const sections: Array<{ id: SectionId, label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'problem', label: 'Problem' },
  { id: 'current-analysis', label: 'Current analysis' },
  { id: 'visual-cues', label: 'Visual cues' },
  { id: 'personalization', label: 'Personalization' },
  { id: 'learning', label: 'Learning' },
]

const route = useRoute()
const activeSection = ref<SectionId>('overview')
const pageRef = ref<HTMLElement | null>(null)
let scrollFrame: number | undefined

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

  const activationLine = window.innerHeight * 0.4
  let current = sectionElements[0]?.dataset.caseSection as SectionId

  sectionElements.forEach((section) => {
    if (section.getBoundingClientRect().top <= activationLine) {
      current = section.dataset.caseSection as SectionId
    }
  })

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
    if (!initialHash) updateActiveSection()
  })
  window.addEventListener('scroll', scheduleSectionUpdate, { passive: true })
  document.addEventListener('scroll', scheduleSectionUpdate, { passive: true })
  window.addEventListener('resize', scheduleSectionUpdate)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleSectionUpdate)
  document.removeEventListener('scroll', scheduleSectionUpdate)
  window.removeEventListener('resize', scheduleSectionUpdate)
  if (scrollFrame !== undefined) window.cancelAnimationFrame(scrollFrame)
})
</script>

<template>
  <article ref="pageRef" class="nuance-case">
    <div class="nuance-case__layout">
      <aside class="case-rail" aria-label="Nuance case study sections">
        <nav class="case-rail__nav">
          <a
            v-for="section in sections"
            :key="section.id"
            :href="`#${section.id}`"
            class="case-rail__link"
            :class="{ 'case-rail__link--active': activeSection === section.id }"
            :aria-current="activeSection === section.id ? 'location' : undefined"
            @click="activeSection = section.id"
          >
            {{ section.label }}
          </a>
        </nav>
      </aside>

      <div class="case-content">
        <section
          id="overview"
          class="case-section case-section--overview"
          data-case-section="overview"
        >
          <h1>Nuance</h1>

          <div class="case-section__intro">
            <h2>Emotional cues to calls for the hard of hearing</h2>
            <p>
              Designed a phone app to improve conversational comprehension over call by
              pairing an AI-driven emotional visualizer and live captioning
            </p>
          </div>

          <ul class="case-meta" aria-label="Project details">
            <li>Concept</li>
            <li>Product designer + 3D artist</li>
            <li>Built with Jae Sung Park, Uyen Hoang</li>
            <li>2 days</li>
          </ul>
        </section>

        <div
          class="case-media-placeholder case-media-placeholder--overview"
          role="img"
          aria-label="Overview image placeholder"
        />

        <section
          id="problem"
          class="case-section case-section--problem"
          data-case-section="problem"
        >
          <div class="case-section__heading">
            <h2>Missing emotional context on calls</h2>
            <p>
              The hard of hearing miss the pauses, subtle laughs, and shifts in tone.
              They have difficulty understanding emotional context over call with only
              captioning.
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
        </section>

        <div
          class="case-media-placeholder case-media-placeholder--problem"
          role="img"
          aria-label="Problem image placeholder"
        />

        <section
          id="current-analysis"
          class="case-section case-section--current-analysis"
          data-case-section="current-analysis"
        >
          <div class="case-section__heading">
            <h2>Phone calls turn into text bubbles</h2>
            <p>
              Current apps focus on captioning, yet the feeling of a real conversation
              is lost.
            </p>
          </div>

          <div class="phone-placeholders" aria-label="Three interface image placeholders">
            <div v-for="index in 3" :key="index" class="phone-placeholder" />
          </div>
        </section>

        <section
          id="visual-cues"
          class="case-section case-section--visual-cues"
          data-case-section="visual-cues"
        >
          <div class="case-section__heading">
            <h2>Maximizing on visual cues</h2>
            <p class="cue-sequence">
              More visual cues →<br />
              Emotional context →<br />
              Holistic comprehension
            </p>
            <p>
              If we give more sensory information to the most active sense, sight,
              they’ll be able to easily analyze context clues.
            </p>
          </div>
        </section>

        <section
          id="personalization"
          class="case-section case-section--personalization"
          data-case-section="personalization"
        >
          <div class="cue-detail">
            <div class="cue-pill">
              <span>Facial expressions</span>
              <span class="cue-pill__face" aria-hidden="true" />
            </div>
            <p>
              The hard of hearing rely on facial expressions in regular conversation
              to pick up nonverbal cues. Not every call is FaceTime so we create an avatar.
            </p>
          </div>

          <div class="cue-detail">
            <div class="cue-pill cue-pill--color">
              <span>Color</span>
              <span class="cue-pill__colors" aria-hidden="true">
                <i v-for="index in 4" :key="index" />
              </span>
            </div>
            <p>
              Color is often directly linked to emotion, so we leveraged color as a
              visual cue for emotion, making facial expressions more easy to interpret.
            </p>
          </div>
        </section>

        <div class="case-media-stack" aria-label="Personalization image placeholders">
          <div
            v-for="index in 3"
            :key="index"
            class="case-media-placeholder"
            role="img"
            :aria-label="`Personalization image placeholder ${index}`"
          />
        </div>

        <section
          id="learning"
          class="case-section case-section--learning"
          data-case-section="learning"
        >
          <ol class="learning-list">
            <li>
              <div>
                <h2>Layered cues build an immersive experience</h2>
                <p>
                  Activating different senses and addressing each sense through
                  different angles brings greater comprehension and easier decision making.
                </p>
                <p>For example, sight can pick up color, size, depth, movement, etc.</p>
              </div>
            </li>
            <li>
              <div>
                <h2>Accessible design should be intuitive and enjoyable</h2>
                <p>Not a slap-on feature as “accommodation”.</p>
              </div>
            </li>
            <li>
              <div>
                <h2>Scoping one great experience</h2>
                <p>
                  During a sprint, scoping down to aspects of a single core experience
                  forces out potential for feature bloat.
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
  width: 100%;
  padding: calc(var(--layout-header-clearance) + var(--space-m)) var(--layout-content-edge) var(--space-xxxl);
  color: var(--color-text);
}

.nuance-case__layout {
  position: relative;
  width: 100%;
  margin-inline: auto;
}

.case-rail {
  position: absolute;
  z-index: 2;
  top: 0;
  bottom: 0;
  left: var(--space-s);
  width: 120px;
}

.case-rail__nav {
  position: sticky;
  top: var(--layout-header-clearance);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding-top: 64px;
}

.case-rail__link {
  width: 100%;
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-body);
  opacity: 0.42;
  transition: opacity var(--transition-fast);
}

.case-rail__link:hover {
  opacity: 0.7;
}

.case-rail__link--active {
  opacity: 1;
}

.case-rail__link:focus-visible {
  outline: 1px solid currentColor;
  outline-offset: var(--space-xxs);
}

.case-content {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
}

.case-section {
  width: min(700px, 100%);
  scroll-margin-top: calc(var(--layout-header-clearance) + var(--space-m));
  font-size: 16px;
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-body);
}

.case-section--overview {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.case-section--overview h1 {
  margin: 0;
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-medium);
  letter-spacing: -0.02em;
  line-height: var(--line-height-body);
}

.case-section__intro,
.case-section__heading,
.cue-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.case-section h2 {
  margin: 0;
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-medium);
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
  width: 100%;
  aspect-ratio: 1075 / 607;
  border-radius: var(--space-m);
  background: #575757;
}

.case-media-placeholder--overview {
  margin-top: 48px;
}

.case-section--problem {
  margin-top: 104px;
}

.case-evidence {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  margin-top: var(--space-xl);
}

.evidence-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin: 0;
  padding: var(--space-s) var(--space-m);
  border-radius: var(--radius-m);
  background: #f5f5f5;
  color: #525459;
}

.evidence-card blockquote {
  margin: 0;
}

.evidence-card strong {
  color: #000000;
  font-weight: var(--font-weight-regular);
}

.evidence-card figcaption {
  color: var(--color-subdued);
  font-size: var(--font-size-s);
  text-align: right;
}

.case-media-placeholder--problem {
  margin-top: 200px;
}

.case-section--current-analysis {
  margin-top: 112px;
}

.phone-placeholders {
  display: grid;
  grid-template-columns: repeat(3, 142px);
  gap: 15px;
  margin-top: var(--space-xl);
}

.phone-placeholder {
  width: 142px;
  aspect-ratio: 142 / 271;
  border-radius: var(--space-m);
  background: var(--color-placeholder);
}

.case-section--visual-cues {
  margin-top: 104px;
}

.cue-sequence {
  white-space: nowrap;
}

.case-section--personalization {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxl);
  margin-top: var(--space-xxxl);
}

.cue-pill {
  display: flex;
  width: max-content;
  max-width: 100%;
  align-items: center;
  gap: var(--space-m);
  padding: var(--space-xxs) var(--space-xxs) var(--space-xxs) var(--space-m);
  border-radius: var(--radius-pill);
  background: #f5f5f5;
}

.cue-pill__face {
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #9e9e9e;
}

.cue-pill--color {
  gap: var(--space-xxs);
}

.cue-pill__colors {
  display: flex;
  gap: var(--space-xxs);
  padding: var(--space-s);
}

.cue-pill__colors i {
  width: var(--space-s);
  height: var(--space-s);
  border-radius: 50%;
  background: #9e9e9e;
}

.case-media-stack {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
  margin-top: 112px;
}

.case-section--learning {
  margin-top: 72px;
  padding-bottom: var(--space-xxxl);
}

.learning-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxl);
  counter-reset: learning;
}

.learning-list li {
  display: grid;
  grid-template-columns: 16px 1fr;
  gap: var(--space-s);
  counter-increment: learning;
}

.learning-list li::before {
  content: counter(learning);
  font-weight: var(--font-weight-medium);
}

.learning-list li > div {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

@media (max-width: 960px) {
  .nuance-case {
    padding-top: var(--layout-header-clearance);
  }

  .case-rail {
    position: sticky;
    top: calc(var(--control-height) + (var(--space-m) * 2));
    z-index: 4;
    width: auto;
    margin-inline: calc(var(--page-padding) * -1);
    background: color-mix(in srgb, var(--color-bg) 92%, transparent);
    backdrop-filter: blur(12px);
  }

  .case-rail__nav {
    position: static;
    flex-direction: row;
    gap: var(--space-l);
    padding: var(--space-s) var(--page-padding);
    overflow-x: auto;
    scrollbar-width: none;
  }

  .case-rail__nav::-webkit-scrollbar {
    display: none;
  }

  .case-rail__link {
    width: max-content;
    flex: 0 0 auto;
  }

  .case-content {
    margin-top: var(--space-xxxl);
  }

  .case-media-placeholder--problem {
    margin-top: clamp(96px, 18vw, 160px);
  }
}

@media (max-width: 767px) {
  .case-section {
    font-size: var(--font-size-m);
  }

  .case-section h2 {
    font-size: var(--font-size-m);
  }

  .case-section--overview h1 {
    font-size: var(--font-size-xl);
  }

  .case-media-placeholder--overview {
    margin-top: var(--space-xxxl);
  }

  .case-section--problem,
  .case-section--current-analysis,
  .case-section--visual-cues,
  .case-media-stack {
    margin-top: clamp(72px, 18vw, 112px);
  }

  .case-section--personalization,
  .case-section--learning {
    margin-top: var(--space-xxxl);
  }

  .phone-placeholders {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-s);
  }

  .phone-placeholder {
    width: auto;
  }
}

@media (max-width: 479px) {
  .case-media-placeholder {
    border-radius: var(--space-s);
  }

  .cue-sequence {
    white-space: normal;
  }
}
</style>
