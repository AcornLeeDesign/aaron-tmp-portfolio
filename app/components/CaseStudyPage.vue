<script setup lang="ts">
import type { CaseStudy } from '~/data/caseStudies'
import { CASE_STUDY_STORAGE_KEY } from '~/data/caseStudies'

const props = defineProps<{
  study: CaseStudy
}>()

const unlocked = ref(false)
const ready = ref(false)

useHead({
  title: `${props.study.title} — Aaron Lee`,
})

onMounted(() => {
  try {
    unlocked.value = sessionStorage.getItem(CASE_STUDY_STORAGE_KEY) === '1'
  } catch {
    unlocked.value = false
  }
  ready.value = true
})

function onUnlocked() {
  unlocked.value = true
}
</script>

<template>
  <article class="case">
    <div class="case__top">
      <NuxtLink to="/" class="case__back text-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M15.75 19.5 8.25 12l7.5-7.5"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span>Back</span>
      </NuxtLink>

      <header class="case__header">
        <h1 class="case__title text-primary">{{ study.title }}</h1>
        <p class="case__lede text-primary">{{ study.overview }}</p>

        <dl class="case__meta">
          <div class="case__meta-item">
            <dt class="text-primary">Role</dt>
            <dd class="text-primary">{{ study.role }}</dd>
          </div>
          <div class="case__meta-item">
            <dt class="text-primary">Team</dt>
            <dd class="text-primary">{{ study.team.join(', ') }}</dd>
          </div>
          <div class="case__meta-item">
            <dt class="text-primary">Timeline</dt>
            <dd class="text-primary">{{ study.timeline }}</dd>
          </div>
          <div class="case__meta-item">
            <dt class="text-primary">Tools</dt>
            <dd class="text-primary">{{ study.tools.join(', ') }}</dd>
          </div>
        </dl>

        <ul v-if="study.tags.length" class="case__tags" aria-label="Tags">
          <li v-for="tag in study.tags" :key="tag">{{ tag }}</li>
        </ul>
      </header>
    </div>

    <div v-if="!ready" class="case__loading" aria-hidden="true" />

    <CaseStudyGate v-else-if="!unlocked" @unlocked="onUnlocked" />

    <div v-else class="case__body">
      <figure v-if="study.heroVideo" class="case__hero">
        <VideoPlayer case-study :src="study.heroVideo" />
      </figure>

      <figure v-else-if="study.heroImage" class="case__hero case__media--image">
        <img :src="study.heroImage" :alt="study.title" loading="eager" />
      </figure>

      <section
        v-for="section in study.sections"
        :id="section.id"
        :key="section.id"
        class="case__section prose"
      >
        <h2 class="text-primary">{{ section.title }}</h2>

        <template v-for="(block, index) in section.blocks" :key="`${section.id}-${index}`">
          <p v-if="block.type === 'paragraph' && block.text" class="text-primary">
            {{ block.text }}
          </p>

          <h3 v-else-if="block.type === 'subheading' && block.text" class="text-primary">
            {{ block.text }}
          </h3>

          <blockquote v-else-if="block.type === 'quote' && block.text" class="text-primary">
            <p>{{ block.text }}</p>
            <footer v-if="block.attribution">{{ block.attribution }}</footer>
          </blockquote>

          <div v-else-if="block.type === 'stat'" class="case__stat">
            <p class="case__stat-value">{{ block.text }}</p>
            <p v-if="block.caption" class="case__stat-caption">{{ block.caption }}</p>
          </div>

          <ul v-else-if="block.type === 'list' && block.items?.length" class="text-primary">
            <li v-for="item in block.items" :key="item">{{ item }}</li>
          </ul>

          <p v-else-if="block.type === 'callout' && block.text" class="case__callout text-primary">
            {{ block.text }}
          </p>

          <figure v-else-if="block.type === 'video' && block.src" class="case__media">
            <VideoPlayer case-study :src="block.src" />
            <figcaption v-if="block.caption">{{ block.caption }}</figcaption>
          </figure>

          <figure v-else-if="block.type === 'image' && block.src" class="case__media case__media--image">
            <img :src="block.src" :alt="block.caption || ''" loading="lazy" />
            <figcaption v-if="block.caption">{{ block.caption }}</figcaption>
          </figure>
        </template>
      </section>
    </div>
  </article>
</template>

<style scoped>
.case {
  padding-inline: var(--layout-content-edge);
  padding-bottom: var(--space-xxxl);
}

.case__top {
  max-width: 720px;
  margin-inline: auto;
  padding-top: var(--space-xl);
}

.case__back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xxs);
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--space-xxl);
  opacity: 0.75;
  transition: opacity var(--transition-fast);
}

.case__back:hover {
  opacity: 1;
}

.case__header {
  margin-bottom: var(--space-xxl);
}

.case__title {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-heading);
  letter-spacing: -0.03em;
  line-height: var(--line-height-tight);
  margin-bottom: var(--space-s);
}

.case__lede {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-body);
  max-width: 40rem;
}

.case__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-m) var(--space-xl);
  margin-top: var(--space-xl);
  padding-top: var(--space-xl);
  border-top: 1px solid var(--color-border);
}

.case__meta-item dt {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: var(--space-xxs);
}

.case__meta-item dd {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-body);
}

.case__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-top: var(--space-l);
  list-style: none;
  padding: 0;
}

.case__tags li {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  padding: var(--space-xxs) var(--space-s);
  border-radius: var(--radius-pill);
  background-color: color-mix(in srgb, var(--color-surface) 70%, transparent);
  color: var(--color-text);
}

.case__loading {
  min-height: 120px;
}

.case__body {
  max-width: 720px;
  margin-inline: auto;
}

.case__hero,
.case__media {
  margin: 0 0 var(--space-xxl);
  border-radius: var(--case-study-surface-radius);
  overflow: hidden;
  isolation: isolate;
  -webkit-mask-image: -webkit-radial-gradient(white, black);
  background: #000;
  border: 1px solid var(--color-border);
}

.case__hero :deep(video),
.case__media :deep(video) {
  width: 100%;
  height: auto;
  display: block;
  aspect-ratio: 16 / 10;
  border-radius: inherit;
  object-fit: cover;
}

.case__media--image {
  background: color-mix(in srgb, var(--color-surface) 55%, #000);
}

.case__media--image img {
  width: 100%;
  height: auto;
  display: block;
  max-height: min(72vh, 720px);
  object-fit: contain;
  object-position: center;
  background: color-mix(in srgb, var(--color-surface) 40%, #111);
}

.case__media figcaption {
  padding: var(--space-xs) var(--space-s) var(--space-s);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-regular);
  color: var(--color-text-muted);
  background: color-mix(in srgb, var(--color-bg) 80%, #000);
}

.case__section + .case__section {
  margin-top: var(--space-xs);
}

.case__stat {
  margin: var(--space-l) 0;
  padding: var(--space-m) var(--space-l);
  border-radius: var(--case-study-surface-radius);
  background-color: color-mix(in srgb, var(--color-surface) 45%, transparent);
}

.case__stat-value {
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-heading);
  margin: 0 !important;
}

.case__stat-caption {
  margin-top: var(--space-xs) !important;
  margin-bottom: 0 !important;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.case__callout {
  font-size: var(--font-size-s) !important;
  font-weight: var(--font-weight-medium) !important;
  line-height: var(--line-height-body) !important;
  padding: var(--space-m) 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.case__section :deep(blockquote footer) {
  margin-top: var(--space-xs);
  font-size: var(--font-size-xs);
  font-style: normal;
  color: inherit;
}

@media (max-width: 639px) {
  .case__meta {
    grid-template-columns: 1fr;
  }
}
</style>
