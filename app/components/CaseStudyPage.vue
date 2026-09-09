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
      <NuxtLink to="/" class="case__back">
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
        <h1 class="case__title">{{ study.title }}</h1>
        <p class="case__lede">{{ study.overview }}</p>

        <dl class="case__meta">
          <div class="case__meta-item">
            <dt>Role</dt>
            <dd>{{ study.role }}</dd>
          </div>
          <div class="case__meta-item">
            <dt>Team</dt>
            <dd>{{ study.team.join(', ') }}</dd>
          </div>
          <div class="case__meta-item">
            <dt>Timeline</dt>
            <dd>{{ study.timeline }}</dd>
          </div>
          <div class="case__meta-item">
            <dt>Tools</dt>
            <dd>{{ study.tools.join(', ') }}</dd>
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
        <VideoPlayer :src="study.heroVideo" />
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
        <h2>{{ section.title }}</h2>

        <template v-for="(block, index) in section.blocks" :key="`${section.id}-${index}`">
          <p v-if="block.type === 'paragraph' && block.text">
            {{ block.text }}
          </p>

          <h3 v-else-if="block.type === 'subheading' && block.text">
            {{ block.text }}
          </h3>

          <blockquote v-else-if="block.type === 'quote' && block.text">
            <p>{{ block.text }}</p>
            <footer v-if="block.attribution">{{ block.attribution }}</footer>
          </blockquote>

          <div v-else-if="block.type === 'stat'" class="case__stat">
            <p class="case__stat-value">{{ block.text }}</p>
            <p v-if="block.caption" class="case__stat-caption">{{ block.caption }}</p>
          </div>

          <ul v-else-if="block.type === 'list' && block.items?.length">
            <li v-for="item in block.items" :key="item">{{ item }}</li>
          </ul>

          <p v-else-if="block.type === 'callout' && block.text" class="case__callout">
            {{ block.text }}
          </p>

          <figure v-else-if="block.type === 'video' && block.src" class="case__media">
            <VideoPlayer :src="block.src" />
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
  padding-inline: var(--page-padding);
  padding-bottom: 5rem;
}

.case__top {
  max-width: 720px;
  margin-inline: auto;
  padding-top: 24px;
}

.case__back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 28px;
  opacity: 0.75;
  transition: opacity var(--transition-fast);
}

.case__back:hover {
  opacity: 1;
}

.case__header {
  margin-bottom: 32px;
}

.case__title {
  font-size: clamp(2rem, 1.5rem + 2vw, 3rem);
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 12px;
}

.case__lede {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
  color: color-mix(in srgb, var(--color-text) 78%, transparent);
  max-width: 40rem;
}

.case__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border);
}

.case__meta-item dt {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.case__meta-item dd {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
}

.case__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
  list-style: none;
  padding: 0;
}

.case__tags li {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 999px;
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
  margin: 0 0 2rem;
  border-radius: 10px;
  overflow: hidden;
  background: #000;
  border: 1px solid var(--color-border);
}

.case__hero :deep(video),
.case__media :deep(video) {
  width: 100%;
  height: auto;
  display: block;
  aspect-ratio: 16 / 10;
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
  padding: 10px 12px 12px;
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-muted);
  background: color-mix(in srgb, var(--color-bg) 80%, #000);
}

.case__section + .case__section {
  margin-top: 0.5rem;
}

.case__stat {
  margin: 1.25em 0;
  padding: 16px 18px;
  border-radius: 10px;
  background-color: color-mix(in srgb, var(--color-surface) 45%, transparent);
}

.case__stat-value {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.35;
  margin: 0 !important;
}

.case__stat-caption {
  margin-top: 6px !important;
  margin-bottom: 0 !important;
  font-size: 13px;
  color: var(--color-text-muted);
}

.case__callout {
  font-size: 16px !important;
  font-weight: 500 !important;
  line-height: 1.5 !important;
  padding: 14px 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.case__section :deep(blockquote footer) {
  margin-top: 8px;
  font-size: 13px;
  font-style: normal;
  color: var(--color-text-muted);
}

@media (max-width: 639px) {
  .case__meta {
    grid-template-columns: 1fr;
  }
}
</style>
