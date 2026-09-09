<script setup lang="ts">
import { getCaseStudy } from '~/data/caseStudies'

// Keep work-in-progress case studies available to local collaborators without publishing them.
if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

const study = getCaseStudy('nova')
if (!study) {
  throw createError({ statusCode: 404, statusMessage: 'Case study not found' })
}
</script>

<template>
  <CaseStudyPage :study="study" />
</template>
